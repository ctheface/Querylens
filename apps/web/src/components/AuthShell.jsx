import { Logo } from './ui.jsx';

/** Centered minimal layout shared by the login and register pages. */
export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="max-w-[360px] mx-auto mt-20 animate-rise">
      <div className="flex flex-col items-center text-center mb-8">
        <Logo size={32} />
        <h1 className="text-xl font-medium tracking-tight text-ink-100 mt-6">{title}</h1>
        {subtitle && <p className="text-[14px] text-ink-400 mt-2">{subtitle}</p>}
      </div>
      
      <div className="p-6">
        {children}
      </div>

      {footer && (
        <div className="text-center text-[13px] text-ink-500 mt-4">
          {footer}
        </div>
      )}
    </div>
  );
}
