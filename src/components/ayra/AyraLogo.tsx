/** AYRA brand mark: a teal hex core with an "A" beam. Same shape as public/favicon.svg. */
export function AyraLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <path d="M16 2 28 9v14l-12 7-12-7V9z" fill="none" stroke="var(--primary)" strokeWidth="1.8" />
      <path d="M10 22 16 9l6 13M12.6 17.5h6.8" fill="none" stroke="var(--primary)" strokeWidth="2.2" strokeLinecap="square" />
      <circle cx="16" cy="9" r="1.8" fill="var(--primary-glow)" />
    </svg>
  );
}
