import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import type { CourseSeoContent } from '../../lib/types';

/** Single source of truth — update config/content-generation.json to change model. */
function loadContentGenerationModel(): string {
  const configPath = path.join(process.cwd(), 'config', 'content-generation.json');
  const raw = JSON.parse(fs.readFileSync(configPath, 'utf8')) as { model?: string };
  if (!raw.model?.trim()) {
    throw new Error('config/content-generation.json must define a non-empty "model" string');
  }
  return raw.model.trim();
}

export const CONTENT_GENERATION_MODEL = loadContentGenerationModel();

const WEB_SEARCH_TOOL = { type: 'web_search_20250305' as const, name: 'web_search', max_uses: 2 };

export interface ApiUsageRecord {
  logLabel: string;
  turn: number;
  inputTokens: number;
  outputTokens: number;
}

const usageRecords: ApiUsageRecord[] = [];

export function resetApiUsage(): void {
  usageRecords.length = 0;
}

export function getApiUsageRecords(): ApiUsageRecord[] {
  return [...usageRecords];
}

function recordApiUsage(
  logLabel: string,
  turn: number,
  usage: { input_tokens: number; output_tokens: number }
): void {
  usageRecords.push({
    logLabel,
    turn,
    inputTokens: usage.input_tokens,
    outputTokens: usage.output_tokens,
  });
}

export function summarizeApiUsageCost(
  records: ApiUsageRecord[],
  inputRatePerMillion = 1,
  outputRatePerMillion = 5
): {
  totalInputTokens: number;
  totalOutputTokens: number;
  inputCostUsd: number;
  outputCostUsd: number;
  totalCostUsd: number;
} {
  const totalInputTokens = records.reduce((sum, r) => sum + r.inputTokens, 0);
  const totalOutputTokens = records.reduce((sum, r) => sum + r.outputTokens, 0);
  const inputCostUsd = (totalInputTokens / 1_000_000) * inputRatePerMillion;
  const outputCostUsd = (totalOutputTokens / 1_000_000) * outputRatePerMillion;
  return {
    totalInputTokens,
    totalOutputTokens,
    inputCostUsd,
    outputCostUsd,
    totalCostUsd: inputCostUsd + outputCostUsd,
  };
}

export interface GeneratedContentPayload {
  needsReview: boolean;
  needsReviewReason?: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  byline: string;
  sections: { heading: string; body: string }[];
  keywords: string[];
}

function extractTextFromResponse(response: Anthropic.Message): string {
  const parts: string[] = [];
  for (const block of response.content) {
    if (block.type === 'text') {
      parts.push(block.text);
    }
  }
  return parts.join('\n');
}

function tryParseJsonObject(jsonStr: string): GeneratedContentPayload {
  try {
    const parsed = JSON.parse(jsonStr) as GeneratedContentPayload;
    if (!parsed.sections || !Array.isArray(parsed.keywords)) {
      throw new Error('Claude JSON missing required sections or keywords');
    }
    return parsed;
  } catch (firstErr) {
    const sanitized = jsonStr.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, ' ');
    try {
      const parsed = JSON.parse(sanitized) as GeneratedContentPayload;
      if (!parsed.sections || !Array.isArray(parsed.keywords)) {
        throw new Error('Claude JSON missing required sections or keywords');
      }
      return parsed;
    } catch {
      throw firstErr instanceof Error ? firstErr : new Error(String(firstErr));
    }
  }
}

function parseJsonFromText(text: string): GeneratedContentPayload {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced ? fenced[1].trim() : text.trim();

  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1) {
    throw new Error('Claude response did not contain JSON object');
  }

  const parsed = tryParseJsonObject(raw.slice(start, end + 1));

  return parsed;
}

export function parseGeneratedContentText(text: string): GeneratedContentPayload {
  return parseJsonFromText(text);
}

export class ClaudeContentClient {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async complete(
    systemPrompt: string,
    userPrompt: string,
    logLabel?: string
  ): Promise<string> {
    const label = logLabel ?? 'unknown course';
    console.log(`  [API] ${label}: starting Claude request (model ${CONTENT_GENERATION_MODEL}, web_search enabled)...`);

    const messages: Anthropic.MessageParam[] = [{ role: 'user', content: userPrompt }];
    let response: Anthropic.Message;

    try {
      response = await this.client.messages.create({
        model: CONTENT_GENERATION_MODEL,
        max_tokens: 16000,
        system: systemPrompt,
        tools: [WEB_SEARCH_TOOL],
        messages,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`  [API] ${label}: request FAILED — ${message}`);
      throw new Error(`Claude API request failed for ${label}: ${message}`);
    }

    console.log(
      `  [API] ${label}: turn 1 stop_reason=${response.stop_reason}, usage in=${response.usage.input_tokens} out=${response.usage.output_tokens}`
    );
    recordApiUsage(label, 1, response.usage);

    for (let turn = 1; turn < 8; turn++) {
      if (response.stop_reason === 'end_turn') {
        const text = extractTextFromResponse(response);
        console.log(`  [API] ${label}: completed after ${turn} turn(s), ${text.length} chars text`);
        return text;
      }

      messages.push({ role: 'assistant', content: response.content });

      if (response.stop_reason === 'pause_turn' || response.stop_reason === 'tool_use') {
        const toolBlocks = response.content.filter((b) => b.type === 'tool_use');
        if (toolBlocks.length) {
          console.log(
            `  [API] ${label}: turn ${turn} tool_use (${toolBlocks.map((b) => (b.type === 'tool_use' ? b.name : '')).join(', ')}) — continuing...`
          );
        }

        try {
          response = await this.client.messages.create({
            model: CONTENT_GENERATION_MODEL,
            max_tokens: 16000,
            system: systemPrompt,
            tools: [WEB_SEARCH_TOOL],
            messages,
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          console.error(`  [API] ${label}: follow-up turn ${turn + 1} FAILED — ${message}`);
          throw new Error(`Claude API follow-up failed for ${label} (turn ${turn + 1}): ${message}`);
        }

        console.log(
          `  [API] ${label}: turn ${turn + 1} stop_reason=${response.stop_reason}, usage in=${response.usage.input_tokens} out=${response.usage.output_tokens}`
        );
        recordApiUsage(label, turn + 1, response.usage);
        continue;
      }

      const text = extractTextFromResponse(response);
      console.log(
        `  [API] ${label}: stopped with reason=${response.stop_reason}, returning ${text.length} chars`
      );
      return text;
    }

    const text = extractTextFromResponse(response);
    console.warn(`  [API] ${label}: hit max tool turns; returning partial response (${text.length} chars)`);
    return text;
  }

  async generateContent(
    systemPrompt: string,
    userPrompt: string,
    logLabel?: string
  ): Promise<GeneratedContentPayload> {
    const text = await this.complete(systemPrompt, userPrompt, logLabel);
    try {
      return parseJsonFromText(text);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(
        `Failed to parse Claude JSON for ${logLabel ?? 'course'}: ${message}. Response preview: ${text.slice(0, 400)}`
      );
    }
  }

  toSeoContent(
    payload: GeneratedContentPayload,
    bioUrl: string,
    lastReviewed: string,
    generationAttempts: number
  ): CourseSeoContent {
    return {
      metaTitle: payload.metaTitle,
      metaDescription: payload.metaDescription,
      h1: payload.h1,
      byline: payload.byline,
      bioUrl,
      sections: payload.sections,
      keywords: payload.keywords,
      lastReviewed,
      generationAttempts,
    };
  }
}

export function payloadToJson(payload: GeneratedContentPayload): string {
  return JSON.stringify(payload, null, 2);
}
