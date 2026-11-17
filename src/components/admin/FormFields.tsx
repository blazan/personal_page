"use client";

/**
 * Shared form controls for the admin panel.
 *
 * Centralising these keeps every editor visually consistent and means a change
 * to focus styling or label spacing happens in one place rather than in each of
 * the four content tabs.
 */

const baseInputClass =
  "w-full rounded-xl border border-subtle bg-[var(--surface-sunken)] px-3.5 py-2.5 text-sm outline-none transition-colors duration-200 placeholder:text-muted focus:border-[var(--accent)]";

/** Single-line text input with a label and optional hint. */
export function TextField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  type = "text",
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  type?: string;
  maxLength?: number;
}) {
  const id = `field-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-xs font-semibold tracking-wide">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        className={baseInputClass}
      />
      {hint && <p className="mt-1.5 text-[0.7rem] text-muted">{hint}</p>}
    </div>
  );
}

/** Multi-line text input. */
export function TextAreaField({
  label,
  value,
  onChange,
  rows = 4,
  placeholder,
  hint,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
  hint?: string;
  maxLength?: number;
}) {
  const id = `field-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-xs font-semibold tracking-wide">
        {label}
      </label>
      <textarea
        id={id}
        rows={rows}
        value={value}
        placeholder={placeholder}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        className={`${baseInputClass} resize-y leading-relaxed`}
      />
      {hint && <p className="mt-1.5 text-[0.7rem] text-muted">{hint}</p>}
    </div>
  );
}

/**
 * Textarea that edits a list of strings, one entry per line.
 * The API accepts both a newline-separated string and a JSON array.
 */
export function ListField({
  label,
  value,
  onChange,
  rows = 5,
  hint,
}: {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  rows?: number;
  hint?: string;
}) {
  return (
    <TextAreaField
      label={label}
      rows={rows}
      value={value.join("\n")}
      onChange={(text) =>
        onChange(
          text
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean),
        )
      }
      hint={hint ?? "One entry per line."}
    />
  );
}

/** Checkbox with an inline label. */
export function CheckboxField({
  label,
  checked,
  onChange,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  hint?: string;
}) {
  const id = `check-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div>
      <label htmlFor={id} className="flex cursor-pointer items-start gap-2.5">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[var(--accent)]"
        />
        <span className="text-xs font-medium">{label}</span>
      </label>
      {hint && <p className="mt-1.5 ml-6.5 text-[0.7rem] text-muted">{hint}</p>}
    </div>
  );
}

/** Inline status banner used for save confirmations and errors. */
export function StatusBanner({
  tone,
  children,
}: {
  tone: "success" | "error" | "info";
  children: React.ReactNode;
}) {
  const tones = {
    success:
      "border-emerald-500/30 bg-emerald-500/[0.07] text-emerald-700 dark:text-emerald-400",
    error:
      "border-red-500/30 bg-red-500/[0.07] text-red-700 dark:text-red-400",
    info: "border-[var(--accent)]/30 bg-[var(--accent)]/[0.07] text-[var(--accent)]",
  } as const;

  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-xl border px-3.5 py-2.5 text-xs ${tones[tone]}`}
    >
      {children}
    </p>
  );
}

/** Primary/secondary action button. */
export function Button({
  children,
  onClick,
  type = "button",
  variant = "primary",
  disabled = false,
  size = "md",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "primary" | "secondary" | "danger" | "ghost";
  disabled?: boolean;
  size?: "sm" | "md";
}) {
  const variants = {
    primary:
      "bg-[var(--accent)] text-white hover:brightness-110 shadow-sm",
    secondary:
      "border border-subtle hover:bg-[var(--surface-sunken)]",
    danger:
      "border border-red-500/40 text-red-600 hover:bg-red-500/[0.08] dark:text-red-400",
    ghost: "text-[var(--accent)] hover:bg-[var(--accent)]/[0.08]",
  } as const;

  const sizes = {
    sm: "px-3.5 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm",
  } as const;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-55 ${variants[variant]} ${sizes[size]}`}
    >
      {children}
    </button>
  );
}
