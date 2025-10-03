import { useState, type ChangeEvent } from "react"
import clsx from "clsx"

type NumericInputProps = {
  id?: string
  name: string
  label?: string
  value?: number | string
  onChange?: (val: number) => void
  placeholder?: string
  required?: boolean
  disabled?: boolean
  readOnly?: boolean
  decimalPlaces?: number
  useCommas?: boolean
  className?: string
  message?: string
  messageVariant?: "help" | "error" | "success"
}

function NumericInput({
  id,
  name,
  label,
  value = "",
  onChange,
  placeholder,
  required = false,
  disabled = false,
  readOnly = false,
  decimalPlaces = 2,
  useCommas = true,
  className,
  message,
  messageVariant = "help",
}: NumericInputProps) {
  const [inputValue, setInputValue] = useState<string>(value?.toString() ?? "")

  const messageClasses: Record<"help" | "error" | "success", string> = {
    help: "text-gray-500",
    error: "text-red-600",
    success: "text-green-600",
  }

  const inputId = id || name

  // Format number
  function formatNumber(val: string) {
    if (!val) return ""
    let num = parseFloat(val)
    if (isNaN(num)) return ""
    let formatted = num.toFixed(decimalPlaces)
    if (useCommas) {
      formatted = Number(formatted).toLocaleString("en-US", {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
      })
    }
    return formatted
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    // allow only numbers and dot
    if (/^[0-9]*[.,]?[0-9]*$/.test(val) || val === "") {
      setInputValue(val)
      const parsed = parseFloat(val.replace(/,/g, ""))
      if (!isNaN(parsed)) {
        onChange?.(parsed)
      } else {
        onChange?.(NaN)
      }
    }
  }

  function handleBlur() {
    setInputValue(formatNumber(inputValue))
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

      <input
        id={inputId}
        name={name}
        type="text"
        inputMode="decimal"
        value={inputValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        readOnly={readOnly}
        className={clsx(
          "block w-full rounded-sm bg-gray-100 px-[1em] py-[0.5em] shadow-inner focus:outline-none focus:ring-2 focus:ring-pp-teal-500",
          disabled || readOnly
            ? "bg-gray-200 text-gray-500 cursor-not-allowed opacity-70"
            : "text-gray-900",
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

export default NumericInput
