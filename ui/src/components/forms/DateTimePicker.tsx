import { useState } from "react"
import clsx from "clsx"
import dayjs from "dayjs"
import Button from "./../common/Button"

type DateTimePickerProps = {
  id?: string
  name: string
  label?: string
  variant?: "date" | "time" | "datetime"
  value?: string
  onChange?: (value: string) => void
  className?: string
  required?: boolean
  disabled?: boolean
  readOnly?: boolean
  message?: string
  messageVariant?: "help" | "error" | "success"
}

function DateTimePicker({
  id,
  name,
  label,
  variant = "date",
  value,
  onChange,
  className,
  required = false,
  disabled = false,
  readOnly = false,
  message,
  messageVariant = "help",
}: DateTimePickerProps) {
  const [internalValue, setInternalValue] = useState<string>(value || "")

  const inputId = id || name

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setInternalValue(val)
    onChange?.(val)
  }

  // Format value with dayjs for display
  const formattedValue = internalValue
    ? variant === "time"
      ? dayjs(internalValue, "HH:mm").format("hh:mm A")
      : variant === "datetime"
      ? dayjs(internalValue).format("YYYY-MM-DD HH:mm")
      : dayjs(internalValue).format("YYYY-MM-DD")
    : ""

  const messageClasses: Record<"help" | "error" | "success", string> = {
    help: "text-gray-500",
    error: "text-red-600",
    success: "text-green-600",
  }

  // Shortcut: set Today
  const setToday = () => {
    const today =
      variant === "time"
        ? dayjs().format("HH:mm")
        : variant === "datetime"
        ? dayjs().format("YYYY-MM-DDTHH:mm")
        : dayjs().format("YYYY-MM-DD")

    setInternalValue(today)
    onChange?.(today)
  }

  return (
    <div className="flow">
      {label && (
        <label
          htmlFor={inputId}
          className={clsx(
            "block text-sm font-medium",
            disabled || readOnly ? "text-gray-400" : "text-gray-700"
          )}
        >
          {label}
        </label>
      )}

      <div className="flex items-center gap-[0.5em]">
        <input
          id={inputId}
          name={name}
          type={
            variant === "date"
              ? "date"
              : variant === "time"
              ? "time"
              : "datetime-local"
          }
          value={internalValue}
          onChange={handleChange}
          required={required}
          disabled={disabled}
          readOnly={readOnly}
          className={clsx(
            "block w-full rounded-sm px-[1em] py-[0.5em] shadow-inner text-sm",
            "focus:outline-none focus:ring-2 focus:ring-pp-teal-500",
            disabled || readOnly
              ? "bg-gray-200 text-gray-500 cursor-not-allowed opacity-70"
              : "bg-gray-100 text-gray-900",
            className
          )}
        />

        {/* ✅ Using custom Button component */}
        <Button
          type="button"
          variant="text"
          color="secondary"
          onClick={setToday}
        >
          Today
        </Button>
      </div>

      {/* Show formatted value */}
      {formattedValue && (
        <p className="text-xs text-gray-500 mt-[0.25em]">
          Selected: {formattedValue}
        </p>
      )}

      {message && (
        <p className={clsx("text-sm", messageClasses[messageVariant])}>
          {message}
        </p>
      )}
    </div>
  )
}

export default DateTimePicker
