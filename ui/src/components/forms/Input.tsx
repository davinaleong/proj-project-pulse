import clsx from "clsx"
import { ChangeEvent } from "react"

export type InputProps = {
  id?: string
  type?: string
  name: string
  label?: string
  placeholder?: string
  required?: boolean
  className?: string
  value?: string
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void
  message?: string
  messageVariant?: "help" | "error" | "success"
}

export default function Input({
  id,
  type = "text",
  name,
  label,
  placeholder,
  required = false,
  className,
  value,
  onChange,
  message,
  messageVariant = "help",
}: InputProps) {
  const inputId = id || name

  const messageClasses: Record<"help" | "error" | "success", string> = {
    help: "text-gray-500",
    error: "text-red-600",
    success: "text-green-600",
  }

  return (
    <div className="flow">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
        </label>
      )}

      <input
        id={inputId}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        value={value}
        onChange={onChange}
        className={clsx(
          "block w-full rounded-sm bg-gray-100 px-[1em] py-[0.5em] shadow-inner focus:outline-none focus:ring-2 focus:ring-pp-teal-500",
          className
        )}
      />

      {message && (
        <p className={clsx("text-sm mt-1", messageClasses[messageVariant])}>
          {message}
        </p>
      )}
    </div>
  )
}
