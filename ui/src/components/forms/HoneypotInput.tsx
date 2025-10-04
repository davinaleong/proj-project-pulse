import clsx from "clsx"

export type HoneypotInputProps = {
  /** Unique field name (should not be named 'honeypot' or 'bot' to avoid detection) */
  name?: string
  /** Optional id */
  id?: string
  /** Optional className for debugging visibility */
  className?: string
  /** Optional label for accessibility — hidden by default */
  label?: string
}

/**
 * Honeypot field — hidden from humans but visible to bots.
 * If filled, form handlers can reject the submission.
 */
function HoneypotInput({
  name = "extra_info",
  id,
  className,
  label = "Do not fill this field",
}: HoneypotInputProps) {
  const inputId = id || name

  return (
    <div
      className={clsx(
        "absolute left-[-9999px] top-auto w-[1px] h-[1px] overflow-hidden",
        "opacity-0 pointer-events-none",
        className
      )}
    >
      {/* Hidden label for accessibility */}
      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>

      {/* Hidden input box */}
      <input
        type="text"
        name={name}
        id={inputId}
        autoComplete="off"
        tabIndex={-1}
        className="hidden"
      />
    </div>
  )
}

export default HoneypotInput
