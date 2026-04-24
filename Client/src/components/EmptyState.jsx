/**
 * EmptyState — shown when a list/page has no data to display.
 */
export default function EmptyState({ icon = '📭', title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
      <span className="text-5xl" aria-hidden="true">
        {icon}
      </span>
      {title && (
        <h3 className="text-lg font-semibold text-slate-700">{title}</h3>
      )}
      {message && <p className="text-sm text-slate-500 max-w-sm">{message}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
