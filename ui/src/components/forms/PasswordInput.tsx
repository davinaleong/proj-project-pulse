import { useState, type ChangeEvent } from "react"
import clsx from "clsx"
import Button from "../common/Button"
import { Eye, EyeOff } from "lucide-react"

type PasswordConvention = "simple" | "medium" | "strong"
type MessageVariant = "help" | "error" | "success"

export type PasswordInputProps = {
  id?: string
  name: string
  label?: string
  placeholder?: string
  required?: boolean
  value?: string
  confirmValue?: string
  onChange?: (value: string, isValid: boolean) => void
  onConfirmChange?: (value: string, matches: boolean) => void
  convention?: PasswordConvention
  showConfirmation?: boolean
  message?: string
  messageVariant?: MessageVariant
  disabled?: boolean
  readOnly?: boolean
  className?: string
}

function PasswordInput({
  id,
  name,
  label,
  placeholder = "Enter your password",
  required = false,
  value = "",
  confirmValue = "",
  onChange,
  onConfirmChange,
  convention = "medium",
  showConfirmation = false,
  message,
  messageVariant = "help",
  disabled = false,
  readOnly = false,
  className,
}: PasswordInputProps) {
  const [password, setPassword] = useState(value)
  const [confirm, setConfirm] = useState(confirmValue)
  const [isVisible, setIsVisible] = useState(false)
  const [isValid, setIsValid] = useState(true)
  const [isMatch, setIsMatch] = useState(true)

  const messageClasses: Record<MessageVariant, string> = {
    help: "text-gray-500",
    error: "text-red-600",
    success: "text-green-600",
  }

  /** ✅ Password Validation Rules */
  function validatePassword(pwd: string): boolean {
    if (!pwd) return !required
    switch (convention) {
      case "simple":
        return pwd.length >= 6
      case "medium":
        return /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(pwd)
      case "strong":
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?#&])[A-Za-z\d@$!%*?#&]{10,}$/.test(
          pwd
        )
      default:
        return true
    }
  }

  /** ✅ Confirmation Check */
  function validateConfirmation(pwd: string, confirm: string): boolean {
    return pwd === confirm
  }

  function handlePasswordChange(e: ChangeEvent<HTMLInputElement>) {
    const newPwd = e.target.value
    const valid = validatePassword(newPwd)
    setPassword(newPwd)
    setIsValid(valid)
    onChange?.(newPwd, valid)
    if (showConfirmation) {
      const match = validateConfirmation(newPwd, confirm)
      setIsMatch(match)
      onConfirmChange?.(confirm, match)
    }
  }

  function handleConfirmChange(e: ChangeEvent<HTMLInputElement>) {
    const newConfirm = e.target.value
    setConfirm(newConfirm)
    const match = validateConfirmation(password, newConfirm)
    setIsMatch(match)
    onConfirmChange?.(newConfirm, match)
  }

  const inputId = id || name

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

      {/* ✅ Password Field */}
      <div className="relative">
        <input
          id={inputId}
          name={name}
          type={isVisible ? "text" : "password"}
          placeholder={placeholder}
          required={required}
          value={password}
          onChange={handlePasswordChange}
          disabled={disabled}
          readOnly={readOnly}
          className={clsx(
            "block w-full rounded-sm bg-gray-100 px-[1em] py-[0.5em] shadow-inner focus:outline-none focus:ring-2 pr-[2.5em]",
            isValid
              ? "focus:ring-pp-teal-500"
              : "border-red-500 focus:ring-red-500",
            disabled || readOnly
              ? "bg-gray-200 text-gray-500 cursor-not-allowed opacity-70"
              : "text-gray-900",
            className
          )}
        />
        <div className="absolute top-0 right-0 h-full flex items-center pr-[0.5em]">
          <Button
            onClick={() => setIsVisible(!isVisible)}
            variant="bare"
            icon={isVisible ? EyeOff : Eye}
            iconPosition="left"
          />
        </div>
      </div>

      {/* ✅ Password Message */}
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

      {!isValid && !message && (
        <p className="text-sm text-red-600 mt-[0.25em]">
          {convention === "simple" &&
            "Password must be at least 6 characters long."}
          {convention === "medium" &&
            "Password must be at least 8 characters long and include both letters and numbers."}
          {convention === "strong" &&
            "Password must be at least 10 characters long, include uppercase, lowercase, a number, and a special character."}
        </p>
      )}

      {/* ✅ Confirmation Field */}
      {showConfirmation && (
        <div className="mt-[0.75em]">
          <label
            htmlFor={`${inputId}-confirm`}
            className="block text-sm font-medium text-gray-700"
          >
            Confirm Password
          </label>
          <input
            id={`${inputId}-confirm`}
            name={`${name}-confirm`}
            type={isVisible ? "text" : "password"}
            value={confirm}
            onChange={handleConfirmChange}
            disabled={disabled}
            readOnly={readOnly}
            placeholder="Re-enter password"
            className={clsx(
              "block w-full rounded-sm bg-gray-100 px-[1em] py-[0.5em] shadow-inner focus:outline-none focus:ring-2",
              isMatch
                ? "focus:ring-pp-teal-500"
                : "border-red-500 focus:ring-red-500",
              disabled || readOnly
                ? "bg-gray-200 text-gray-500 cursor-not-allowed opacity-70"
                : "text-gray-900"
            )}
          />
          {!isMatch && (
            <p className="text-sm text-red-600 mt-[0.25em]">
              Passwords do not match.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default PasswordInput
