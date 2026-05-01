/**
 * Button — reusable button with variant + size props.
 *
 * Variants: primary | secondary | danger | ghost
 * Sizes:    sm | md | lg
 */

const variants = {
  primary:
    'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm focus-visible:ring-indigo-500',
  secondary:
    'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-sm focus-visible:ring-slate-400',
  danger:
    'bg-red-600 hover:bg-red-700 text-white shadow-sm focus-visible:ring-red-500',
  ghost:
    'bg-transparent hover:bg-slate-100 text-slate-600 focus-visible:ring-slate-400',
  teal: 'bg-teal-600 hover:bg-teal-700 text-white shadow-sm focus-visible:ring-teal-500',
  purple:
    'bg-purple-600 hover:bg-purple-700 text-white shadow-sm focus-visible:ring-purple-500',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  type = 'button',
  onClick,
  ...rest
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={[
        'inline-flex items-center justify-center font-semibold rounded-lg transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:opacity-60 disabled:cursor-not-allowed',
        variants[variant] ?? variants.primary,
        sizes[size] ?? sizes.md,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {children}
    </button>
  );
}
