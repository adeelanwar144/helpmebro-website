import { ImageResponse } from 'next/og';
import { DEFAULT_OG_DESCRIPTION, DEFAULT_OG_TITLE, SITE_NAME } from '@/lib/site';

export const runtime = 'edge';
export const alt = DEFAULT_OG_TITLE;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 64,
          background: 'linear-gradient(135deg, #1c1f4c 0%, #037272 100%)',
          color: 'white',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: '#fec20f',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            marginBottom: 24,
          }}
        >
          Summer 2026
        </div>
        <div style={{ fontSize: 56, fontWeight: 800, lineHeight: 1.15, maxWidth: 900 }}>
          Assignment Help for US University Students
        </div>
        <div style={{ fontSize: 26, marginTop: 28, color: 'rgba(255,255,255,0.85)', maxWidth: 820 }}>
          {DEFAULT_OG_DESCRIPTION}
        </div>
        <div
          style={{
            marginTop: 48,
            fontSize: 22,
            fontWeight: 700,
            color: '#1c1f4c',
            background: '#fec20f',
            padding: '12px 28px',
            borderRadius: 12,
            alignSelf: 'flex-start',
          }}
        >
          {SITE_NAME}
        </div>
      </div>
    ),
    { ...size }
  );
}
