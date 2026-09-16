"use client";

interface FormFieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}

export function FormField({ label, htmlFor, error, hint, children }: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={htmlFor}
        className="block font-label-xs text-label-xs text-on-surface-variant uppercase tracking-wider"
      >
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-secondary">{hint}</p>}
      {error && <p className="text-xs text-red-400" role="alert">{error}</p>}
    </div>
  );
}