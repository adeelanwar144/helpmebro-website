'use client';

import { useState } from 'react';
import { whatsAppUrl } from '@/lib/whatsapp';

interface Props {
  courseCode: string;
  courseTitle: string;
  university: string;
}

interface FormErrors {
  name?: string;
  assignment?: string;
}

function buildWhatsAppMessage({
  courseCode,
  courseTitle,
  university,
  name,
  email,
  helpType,
  dueDate,
  additionalDetails,
}: {
  courseCode: string;
  courseTitle: string;
  university: string;
  name: string;
  email: string;
  helpType: string;
  dueDate: string;
  additionalDetails: string;
}) {
  return [
    `Hi, I need help with ${courseCode}: ${courseTitle} at ${university}.`,
    '',
    `Name: ${name}`,
    `Email: ${email || 'Not provided'}`,
    `Type of help needed: ${helpType}`,
    `Due date: ${dueDate || 'Not provided'}`,
    `Additional details: ${additionalDetails || 'Not provided'}`,
  ].join('\n');
}

export default function OrderForm({ courseCode, courseTitle, university }: Props) {
  const [errors, setErrors] = useState<FormErrors>({});

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const form = e.currentTarget;
    const data = new FormData(form);
    const name = String(data.get('name') ?? '').trim();
    const email = String(data.get('email') ?? '').trim();
    const assignmentValue = String(data.get('assignment') ?? '').trim();
    const dueDate = String(data.get('dueDate') ?? '').trim();
    const additionalDetails = String(data.get('details') ?? '').trim();

    const assignmentSelect = form.elements.namedItem('assignment') as HTMLSelectElement;
    const helpTypeLabel =
      assignmentSelect.selectedIndex > 0
        ? assignmentSelect.options[assignmentSelect.selectedIndex]?.text ?? assignmentValue
        : '';

    const nextErrors: FormErrors = {};
    if (!name) nextErrors.name = 'Please enter your name.';
    if (!assignmentValue) nextErrors.assignment = 'Please select what you need help with.';

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});

    const message = buildWhatsAppMessage({
      courseCode,
      courseTitle,
      university,
      name,
      email,
      helpType: helpTypeLabel,
      dueDate,
      additionalDetails,
    });

    const url = whatsAppUrl(message);
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="card overflow-hidden" id="order">
      <div className="bg-brand-navy text-white p-4">
        <p className="text-xs text-brand-gold uppercase font-semibold tracking-wide mb-1">
          Get Expert Help
        </p>
        <h3 className="font-display font-bold text-lg leading-tight">
          {courseCode}: {courseTitle}
        </h3>
        <p className="text-white/70 text-sm mt-1">{university}</p>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-3" noValidate>
        <div>
          <label htmlFor="order-name" className="block text-xs font-semibold text-brand-navy/70 mb-1">
            Your Name
          </label>
          <input
            id="order-name"
            name="name"
            placeholder="John Smith"
            className="input-field"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'order-name-error' : undefined}
          />
          {errors.name && (
            <p id="order-name-error" className="mt-1 text-xs text-red-600">
              {errors.name}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="order-email" className="block text-xs font-semibold text-brand-navy/70 mb-1">
            Email Address
          </label>
          <input
            id="order-email"
            name="email"
            type="email"
            placeholder="you@email.com"
            className="input-field"
          />
        </div>

        <div>
          <label htmlFor="order-assignment" className="block text-xs font-semibold text-brand-navy/70 mb-1">
            What do you need help with?
          </label>
          <select
            id="order-assignment"
            name="assignment"
            className="input-field"
            defaultValue=""
            aria-invalid={Boolean(errors.assignment)}
            aria-describedby={errors.assignment ? 'order-assignment-error' : undefined}
          >
            <option value="">Select type of help...</option>
            <option value="essay">Essay / paper</option>
            <option value="homework">Homework assignment</option>
            <option value="project">Project</option>
            <option value="exam-prep">Exam prep</option>
            <option value="multiple">Multiple assignments</option>
            <option value="other">Other</option>
          </select>
          {errors.assignment && (
            <p id="order-assignment-error" className="mt-1 text-xs text-red-600">
              {errors.assignment}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="order-due-date" className="block text-xs font-semibold text-brand-navy/70 mb-1">
            Due Date
          </label>
          <input id="order-due-date" name="dueDate" type="date" className="input-field" />
        </div>

        <div>
          <label htmlFor="order-details" className="block text-xs font-semibold text-brand-navy/70 mb-1">
            Additional Details
          </label>
          <textarea
            id="order-details"
            name="details"
            rows={3}
            placeholder="Describe what you need help with..."
            className="input-field resize-none"
          />
        </div>

        <button type="submit" className="btn-primary w-full justify-center">
          🎓 Get My Assignment Done
        </button>

        <p className="text-xs text-brand-navy/45 text-center">
          Free quote · No commitment · 100% confidential
        </p>
      </form>
    </div>
  );
}
