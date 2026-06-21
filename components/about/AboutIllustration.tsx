/** Simple brand-color SVG illustration — no external assets */
export default function AboutIllustration() {
  return (
    <div className="flex justify-center mb-8" aria-hidden>
      <svg
        width="200"
        height="200"
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="University and learning illustration"
      >
        <rect x="20" y="80" width="160" height="100" rx="8" fill="#edebd9" />
        <rect x="40" y="60" width="120" height="30" rx="6" fill="#00848c" />
        <polygon points="100,20 170,70 30,70" fill="#1c1f4c" />
        <rect x="55" y="100" width="30" height="40" rx="4" fill="#037272" opacity="0.6" />
        <rect x="115" y="100" width="30" height="40" rx="4" fill="#037272" opacity="0.6" />
        <rect x="85" y="120" width="30" height="60" rx="4" fill="#1c1f4c" />
        <circle cx="100" cy="45" r="8" fill="#fec20f" />
        <rect x="70" y="155" width="60" height="6" rx="3" fill="#fccf17" />
      </svg>
    </div>
  );
}
