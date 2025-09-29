import clsx from "clsx"

type MessageVariant = "help" | "error" | "success"

type InputFieldProps = {
  id?: string
  type?: string
  name: string
  label: string
  required?: boolean
  className?: string
  message?: string
  messageVariant?: MessageVariant
}

function Input({
  id,
  type = "text",
  name,
  label,
  required = false,
  className,
  message,
  messageVariant = "help",
}: InputFieldProps) {
  const inputId = id || name

  const messageClasses: Record<MessageVariant, string> = {
    help: "text-gray-500",
    error: "text-red-600",
    success: "text-green-600",
  }

  return (
    <div className="flow">
      {/* Label */}
      <label
        htmlFor={inputId}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
      </label>

      {/* Input */}
      <input
        id={inputId}
        name={name}
        type={type}
        required={required}
        className={clsx(
          "block w-full rounded-sm bg-gray-100 px-[1em] py-[0.5em] shadow-inner focus:outline-none focus:ring-2 focus:ring-pp-teal-500",
          className
        )}
      />

      {/* Message */}
      {message && (
        <p className={clsx("text-sm mt-1", messageClasses[messageVariant])}>
          {message}
        </p>
      )}
    </div>
  )
}

export default Input
