import { type LucideIcon } from "lucide-react"
import clsx from "clsx"

type ButtonProps = {
  onClick: () => void
  variant?: "text" | "image" | "icon" | "link" | "bare"
  type?: "button" | "submit" | "reset"
  children?: React.ReactNode
  src?: string
  icon?: LucideIcon
  className?: string
  disabled?: boolean
  color?:
    | "primary"
    | "secondary"
    | "danger"
    | "success"
    | "warning"
    | "info"
    | "default"
    | "transparent"
    | "custom"
}

function Button({
  onClick,
  variant = "text",
  type = "button",
  children,
  src,
  icon: Icon,
  className,
  disabled = false,
  color = "primary",
}: ButtonProps) {
  const colorClasses = {
    primary: "bg-pp-teal-50 text-pp-teal-900 border-pp-teal-200",
    secondary: "bg-pp-gray-50 text-pp-gray-900 border-pp-gray-200",
    danger: "bg-red-50 text-red-900 border-red-200",
    success: "bg-green-50 text-green-900 border-green-200",
    warning: "bg-yellow-50 text-yellow-900 border-yellow-200",
    info: "bg-blue-50 text-blue-900 border-blue-200",
    default: "bg-white text-gray-900 border-gray-200",
    transparent: "bg-transparent text-gray-900 border-gray-200",
    custom: "",
  }

  return (
    <button
      type={type}
      onClick={onClick}
      className={clsx(
        "cursor-pointer inline-flex items-center font-medium transition-all duration-150",
        "disabled:opacity-50 disabled:cursor-not-allowed",

        // Link variant
        variant === "link" &&
          "bg-transparent border-0 p-0 underline underline-offset-4 text-blue-500 hover:text-blue-700 active:text-blue-900 shadow-none rounded-none",

        // Bare variant
        variant === "bare" &&
          "bg-transparent border-0 p-0 shadow-none rounded-none text-inherit hover:opacity-70",

        // Icon variant (no padding, square-ish button)
        variant === "icon" &&
          "justify-center rounded-sm border shadow-sm hover:shadow-md active:shadow-inner hover:-translate-y-[1px] p-0 w-[2.5em] h-[2.5em]",

        // Default paper-style variants (text, image)
        variant !== "link" &&
          variant !== "bare" &&
          variant !== "icon" &&
          "justify-center rounded-sm px-[1em] py-[0.5em] border shadow-sm hover:shadow-md active:shadow-inner hover:-translate-y-[1px]",

        // Apply color classes except for bare/link
        variant !== "link" && variant !== "bare" && colorClasses[color],

        className
      )}
      disabled={disabled}
    >
      {variant === "text" && children}

      {variant === "image" && src && (
        <>
          <img
            src={src}
            alt=""
            className="w-[1em] h-[1em] object-contain"
            draggable={false}
          />
          {children}
        </>
      )}

      {variant === "icon" && Icon && <Icon className="w-[1em] h-[1em]" />}
      {variant === "bare" && Icon && <Icon className="w-[1em] h-[1em]" />}

      {variant === "link" && children}
    </button>
  )
}

export default Button
