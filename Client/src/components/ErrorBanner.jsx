/**
 * ErrorBanner — inline error message for forms and page-level fetch errors.
 */
export default function ErrorBanner({ message, className = '' }) {
  if (!message) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className={[
        'flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span aria-hidden="true" className="mt-0.5 shrink-0">
        ⚠️
      </span>
      <span>{message}</span>
    </div>
  );
}
