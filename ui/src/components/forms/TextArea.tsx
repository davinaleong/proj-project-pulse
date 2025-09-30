import clsx from "clsx"
import { type ChangeEvent } from "react"

export type TextAreaProps = {
  id?: string
  name: string
  label?: string
  placeholder?: string
  required?: boolean
  className?: string
  value?: string
  onChange?: (e: ChangeEvent<HTMLTextAreaElement>) => void
  message?: string
  messageVariant?: "help" | "error" | "success"
  cols?: number
  rows?: number
  disabled?: boolean
  readOnly?: boolean
}

function TextArea({
  id,
  name,
  label,
  placeholder,
  required = false,
  className,
  value,
  onChange,
  message,
  messageVariant = "help",
  cols = 30,
  rows = 5,
  disabled = false,
  readOnly = false,
}: TextAreaProps) {
  const textAreaId = id || name

  const messageClasses: Record<"help" | "error" | "success", string> = {
    help: "text-gray-500",
    error: "text-red-600",
    success: "text-green-600",
  }

  return (
    <div className="flow">
      {label && (
        <label
          htmlFor={textAreaId}
          className={clsx(
            "block text-sm font-medium",
            disabled || readOnly ? "text-gray-400" : "text-gray-700"
          )}
        >
          {label}
        </label>
      )}

      <textarea
        id={textAreaId}
        name={name}
        placeholder={placeholder}
        required={required}
        value={value}
        onChange={onChange}
        cols={cols}
        rows={rows}
        disabled={disabled}
        readOnly={readOnly}
        className={clsx(
          "block w-full rounded-sm px-[1em] py-[0.5em] shadow-inner resize-y",
          "focus:outline-none focus:ring-2 focus:ring-pp-teal-500",
          disabled || readOnly
            ? "bg-gray-200 text-gray-500 cursor-not-allowed opacity-70"
            : "bg-gray-100 text-gray-900",
          className
        )}
      />

      {message && (
        <p className={clsx("text-sm", messageClasses[messageVariant])}>
          {message}
        </p>
      )}
    </div>
  )
}

export default TextArea
