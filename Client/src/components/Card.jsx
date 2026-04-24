/**
 * Card — white surface with rounded corners, border, and optional padding.
 */
export default function Card({ children, className = '', padding = true }) {
  return (
    <div
      className={[
        'bg-white rounded-2xl border border-slate-200 shadow-sm',
        padding ? 'p-6' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
}
