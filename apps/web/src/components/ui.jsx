/** Shared UI primitives so every page uses the same visual language. */

export function Logo({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-ink-100">
      <path
        d="M21 12H3m9-9v18M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="font-semibold tracking-tight text-ink-100 text-[14px]">
      QueryLens
    </span>
  );
}

export function Spinner({ className = 'w-4 h-4' }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" className="opacity-20" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

const buttonBase =
  'inline-flex items-center justify-center gap-2 font-medium rounded-md transition-colors duration-100 ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-400 ' +
  'disabled:opacity-50 disabled:pointer-events-none select-none';

const buttonVariants = {
  primary:
    'bg-ink-100 hover:opacity-90 text-ink-950',
  secondary:
    'bg-ink-900 hover:bg-ink-800 text-ink-200 border border-ink-800 hover:border-ink-700',
  ghost: 'text-ink-400 hover:text-ink-200 hover:bg-ink-900',
  danger:
    'text-red-400 hover:bg-red-950/40 hover:text-red-300',
};

const buttonSizes = {
  sm: 'text-xs px-2.5 py-1.5',
  md: 'text-sm px-3.5 py-2',
  lg: 'text-[15px] px-4 py-2.5',
};

export function Button({ variant = 'primary', size = 'md', className = '', children, ...props }) {
  return (
    <button
      className={`${buttonBase} ${buttonVariants[variant]} ${buttonSizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export const inputClass =
  'w-full px-3 py-2 rounded-md bg-ink-950 border border-ink-800 text-sm text-ink-100 ' +
  'placeholder:text-ink-600 transition-colors duration-100 ' +
  'hover:border-ink-700 focus:border-ink-500 focus:outline-none';

export function Field({ label, hint, children }) {
  return (
    <div>
      <label className="flex items-baseline justify-between mb-2">
        <span className="text-[13px] font-medium text-ink-300">{label}</span>
        {hint && <span className="text-xs text-ink-500">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

export function Alert({ tone = 'error', title, children }) {
  const tones = {
    error: 'border-red-900 bg-red-950/20 text-red-400',
    success: 'border-emerald-900 bg-emerald-950/20 text-emerald-400',
    info: 'border-ink-800 bg-ink-900 text-ink-300',
  };
  return (
    <div className={`rounded-md border px-3 py-2.5 text-sm leading-relaxed ${tones[tone]}`}>
      {title && <span className="font-semibold text-ink-100 mr-2">{title}</span>}
      {children}
    </div>
  );
}

export function Card({ className = '', children }) {
  return (
    <div
      className={
        'rounded-lg border border-ink-800 bg-ink-900/50 ' +
        className
      }
    >
      {children}
    </div>
  );
}

/** Small uppercase section label used across pages. */
export function SectionLabel({ children }) {
  return (
    <span className="text-[11px] font-medium tracking-wider text-ink-500">
      {children}
    </span>
  );
}
