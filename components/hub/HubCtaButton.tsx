import { whatsAppUrl } from '@/lib/whatsapp';

interface Props {
  label: string;
  className?: string;
}

export default function HubCtaButton({ label, className = '' }: Props) {
  const message = `Hi, I'm interested in: ${label}`;

  return (
    <a
      href={whatsAppUrl(message)}
      target="_blank"
      rel="noopener noreferrer"
      className={`btn-whatsapp inline-flex items-center justify-center text-base px-8 py-3 shadow-lg hover:shadow-xl ${className}`.trim()}
    >
      {label}
    </a>
  );
}
