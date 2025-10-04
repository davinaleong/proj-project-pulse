import { useState, type ChangeEvent } from "react"
import clsx from "clsx"

type EmailRule = "any" | "company" | "whitelist"
type MessageVariant = "help" | "error" | "success"

export type EmailInputProps = {
  id?: string
  name: string
  label?: string
  placeholder?: string
  required?: boolean
  value?: string
  onChange?: (value: string, isValid: boolean) => void
  rules?: EmailRule
  allowedDomains?: string[]
  companyDomain?: string
  message?: string
  messageVariant?: MessageVariant
  disabled?: boolean
  readOnly?: boolean
  className?: string
}

function EmailInput({
  id,
  name,
  label,
  placeholder = "you@example.com",
  required = false,
  value = "",
  onChange,
  rules = "any",
  allowedDomains = [],
  companyDomain,
  message,
  messageVariant = "help",
  disabled = false,
  readOnly = false,
  className,
}: EmailInputProps) {
  const [email, setEmail] = useState(value)
  const [isValid, setIsValid] = useState(true)

  const messageClasses: Record<MessageVariant, string> = {
    help: "text-gray-500",
    error: "text-red-600",
    success: "text-green-600",
  }

  function validateEmail(email: string): boolean {
    if (!email) return !required

    // ✅ General email pattern
    const basicPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!basicPattern.test(email)) return false

    const domain = email.split("@")[1]?.toLowerCase() || ""

    switch (rules) {
      case "company":
        return domain === companyDomain?.toLowerCase()
      case "whitelist":
        return allowedDomains.map((d) => d.toLowerCase()).includes(domain)
      default:
        return true
    }
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const newEmail = e.target.value
    const valid = validateEmail(newEmail)
    setEmail(newEmail)
    setIsValid(valid)
    onChange?.(newEmail, valid)
  }

  const selectId = id || name

  return (
    <div className="flow">
      {label && (
        <label
          htmlFor={selectId}
          className={clsx(
            "block text-sm font-medium",
            disabled || readOnly ? "text-gray-400" : "text-gray-700"
          )}
        >
          {label}
        </label>
      )}

      <input
        id={selectId}
        name={name}
        type="email"
        required={required}
        value={email}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        className={clsx(
          "block w-full rounded-sm bg-gray-100 px-[1em] py-[0.5em] shadow-inner focus:outline-none focus:ring-2",
          isValid
            ? "focus:ring-pp-teal-500"
            : "border-red-500 focus:ring-red-500",
          disabled || readOnly
            ? "bg-gray-200 text-gray-500 cursor-not-allowed opacity-70"
            : "text-gray-900",
          className
        )}
      />

      {/* Validation or help message */}
      {message && (
        <p
          className={clsx(
            "text-sm mt-[0.25em]",
            !isValid ? "text-red-600" : messageClasses[messageVariant]
          )}
        >
          {message}
        </p>
      )}

      {/* Dynamic feedback */}
      {!isValid && !message && (
        <p className="text-sm text-red-600 mt-[0.25em]">
          Please enter a valid email address
          {rules === "company" && companyDomain
            ? ` ending with @${companyDomain}`
            : rules === "whitelist" && allowedDomains.length > 0
            ? ` from: ${allowedDomains.join(", ")}`
            : ""}
          .
        </p>
      )}
    </div>
  )
}

export default EmailInput
