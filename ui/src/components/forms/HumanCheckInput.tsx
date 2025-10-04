import { useState } from "react"
import clsx from "clsx"

type MessageVariant = "help" | "error" | "success"

export type HumanCheckInputProps = {
  id?: string
  name?: string
  label?: string
  required?: boolean
  onChange?: (checked: boolean) => void
  disabled?: boolean
  readOnly?: boolean
  message?: string
  messageVariant?: MessageVariant
  className?: string
}

function HumanCheckInput({
  id,
  name = "human_check",
  label = "I am not a robot 🤖",
  required = true,
  onChange,
  disabled = false,
  readOnly = false,
  message,
  messageVariant = "help",
  className,
}: HumanCheckInputProps) {
  const [checked, setChecked] = useState(false)
  const inputId = id || name

  const messageClasses: Record<MessageVariant, string> = {
    help: "text-gray-500",
    error: "text-red-600",
    success: "text-green-600",
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const isChecked = e.target.checked
    setChecked(isChecked)
    onChange?.(isChecked)
  }

  return (
    <div className="flow">
      <label
        htmlFor={inputId}
        className={clsx(
          "block text-sm font-medium mb-[0.25em]",
          disabled || readOnly ? "text-gray-400" : "text-gray-700"
        )}
      >
        Human Verification
      </label>

      <div
        className={clsx(
          "flex items-center gap-[0.75em] rounded-sm px-[1em] py-[0.5em] shadow-inner",
          "focus-within:ring-2 focus-within:ring-pp-teal-500 transition-all duration-150",
          disabled || readOnly
            ? "bg-gray-200 text-gray-500 cursor-not-allowed opacity-70"
            : "bg-gray-100 text-gray-900",
          className
        )}
      >
        <input
          id={inputId}
          name={name}
          type="checkbox"
          required={required}
          disabled={disabled || readOnly}
          checked={checked}
          onChange={handleChange}
          className={clsx(
            "w-[1em] h-[1em] accent-pp-teal-500 rounded-sm cursor-pointer",
            (disabled || readOnly) && "cursor-not-allowed"
          )}
        />
        <span>{label}</span>
      </div>

      {/* Optional validation or helper message */}
      {message && (
        <p
          className={clsx(
            "text-sm mt-[0.25em]",
            messageClasses[messageVariant]
          )}
        >
          {message}
        </p>
      )}

      {/* Auto error when required but unchecked */}
      {required && !checked && !disabled && !readOnly && (
        <p className="text-sm text-red-600 mt-[0.25em]">
          Please confirm you are human before submitting.
        </p>
      )}
    </div>
  )
}

export default HumanCheckInput
