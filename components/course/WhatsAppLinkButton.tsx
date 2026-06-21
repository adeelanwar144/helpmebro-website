import { whatsAppLink } from '@/lib/whatsapp';

interface Props {
  children?: string;
  className?: string;
}

export default function WhatsAppLinkButton({
  children = 'Talk on WhatsApp',
  className = '',
}: Props) {
  return (
    <a
      href={whatsAppLink()}
      target="_blank"
      rel="noopener noreferrer"
      className={`btn-whatsapp ${className}`.trim()}
    >
      {children}
    </a>
  );
}
