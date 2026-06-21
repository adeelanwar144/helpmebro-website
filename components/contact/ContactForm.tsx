'use client';

import { useState } from 'react';
import { whatsAppUrl } from '@/lib/whatsapp';

const WHATSAPP_GENERAL_MESSAGE =
  "Hi, I'd like to learn more about AssignHelp's assignment help services.";

const WHATSAPP_FOLLOW_UP_MESSAGE =
  'Hi, I just submitted a contact form and wanted to follow up.';

export function WhatsAppButton({
  message,
  className = '',
}: {
  message?: string;
  className?: string;
}) {
  return (
    <a
      href={whatsAppUrl(message ?? WHATSAPP_GENERAL_MESSAGE)}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold text-base px-6 py-3 rounded-lg transition-all duration-200 ease-out shadow-sm hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 ${className}`}
    >
      💬 Talk to us on WhatsApp
    </a>
  );
}

export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState('');

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const submittedName = String(formData.get('name') ?? '').trim();
    setName(submittedName || 'there');
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="card p-8 text-center">
        <div className="text-4xl mb-3" aria-hidden>
          ✅
        </div>
        <h3 className="font-bold text-lg text-brand-navy mb-2">
          Thanks, {name}!
        </h3>
        <p className="text-brand-navy/70 text-sm mb-6">
          For the fastest response, message us directly on WhatsApp.
        </p>
        <WhatsAppButton message={WHATSAPP_FOLLOW_UP_MESSAGE} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-brand-teal/20 bg-brand-teal/5 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-brand-navy/75 font-medium">
          For fastest help, message us on WhatsApp
        </p>
        <WhatsAppButton message={WHATSAPP_GENERAL_MESSAGE} className="shrink-0 justify-center" />
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        <div>
          <label htmlFor="contact-name" className="block text-xs font-semibold text-brand-navy/70 mb-1">
            Your Name
          </label>
          <input
            id="contact-name"
            name="name"
            required
            placeholder="John Smith"
            className="input-field"
          />
        </div>

        <div>
          <label htmlFor="contact-email" className="block text-xs font-semibold text-brand-navy/70 mb-1">
            Email Address
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            required
            placeholder="you@email.com"
            className="input-field"
          />
        </div>

        <div>
          <label htmlFor="contact-message" className="block text-xs font-semibold text-brand-navy/70 mb-1">
            Message
          </label>
          <textarea
            id="contact-message"
            name="message"
            required
            rows={5}
            placeholder="How can we help you?"
            className="input-field resize-none"
          />
        </div>

        <button type="submit" className="btn-primary w-full justify-center">
          Send Message
        </button>
      </form>
    </div>
  );
}
