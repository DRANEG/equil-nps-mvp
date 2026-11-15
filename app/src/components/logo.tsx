export function Logo({ size = 28, dark = false }: { size?: number; dark?: boolean }) {
  const bg = dark ? "#3ee0a8" : "#0a2b25";
  const fg = dark ? "#0a2b25" : "#3ee0a8";
  const tri = dark ? "#0a2b25" : "#0f9d72";
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="16" fill={bg} />
      <path d="M18 39.5h28" stroke={fg} strokeWidth="4.5" strokeLinecap="round" />
      <path d="M32 39.5 21 22h22L32 39.5Z" fill={tri} />
      <circle cx="32" cy="46.5" r="3.6" fill={fg} />
    </svg>
  );
}
