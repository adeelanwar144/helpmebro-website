import Link from 'next/link';

interface Crumb {
  label: string;
  href?: string;
}

interface Props {
  items: Crumb[];
  tone?: 'default' | 'inverse';
}

export default function Breadcrumb({ items, tone = 'default' }: Props) {
  const isInverse = tone === 'inverse';

  return (
    <nav aria-label="Breadcrumb" className="relative">
      <ol className="flex items-center gap-2 text-sm flex-wrap">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-2">
            {i > 0 && (
              <span
                className={`font-medium ${isInverse ? 'text-white/50' : ''}`}
                style={isInverse ? undefined : { color: '#00848c' }}
                aria-hidden
              >
                /
              </span>
            )}
            {item.href ? (
              <Link
                href={item.href}
                className={`font-semibold hover:underline underline-offset-4 transition-colors duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal rounded-sm ${
                  isInverse ? 'text-brand-gold hover:text-brand-yellow' : ''
                }`}
                style={isInverse ? undefined : { color: '#00848c' }}
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={`font-semibold ${isInverse ? 'text-white' : ''}`}
                style={isInverse ? undefined : { color: '#1c1f4c' }}
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
