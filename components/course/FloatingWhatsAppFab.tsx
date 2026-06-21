import { WhatsApp } from '@/components/icons';
import { whatsAppLink } from '@/lib/whatsapp';

export default function FloatingWhatsAppFab() {
  return (
    <a
      href={whatsAppLink()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Talk on WhatsApp"
      className="lg:hidden fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform duration-200 ease-out hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
      style={{ backgroundColor: '#25D366', color: '#ffffff' }}
    >
      <WhatsApp className="h-7 w-7" aria-hidden />
    </a>
  );
}
