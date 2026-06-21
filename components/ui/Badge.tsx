interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  className?: string;
}

const variants = {
  default: 'bg-brand-cream text-brand-navy border-brand-cream',
  success: 'bg-brand-teal/10 text-brand-teal-dark border-brand-teal/20',
  warning: 'bg-brand-yellow text-brand-navy border-brand-gold',
  danger: 'bg-brand-navy/10 text-brand-navy border-brand-navy/20',
};

export default function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center text-xs font-semibold border rounded-full px-2 py-0.5 ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
