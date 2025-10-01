import { type LucideIcon } from "lucide-react"
import clsx from "clsx"
import { getColorClasses, type ColorVariant } from "./../../utils/colors"

type ButtonProps = {
  onClick: () => void
  variant?: "text" | "image" | "icon" | "link" | "bare"
  type?: "button" | "submit" | "reset"
  children?: React.ReactNode
  src?: string
  icon?: LucideIcon
  className?: string
  disabled?: boolean
  color?: ColorVariant
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
        variant !== "link" && variant !== "bare" && getColorClasses(color),

        className
      )}
      disabled={disabled}
    >
      {variant === "text" && children}

      {variant === "image" && src && (
        <span className="flex items-center gap-[0.5em]">
          <img
            src={src}
            alt=""
            className="w-[1em] h-[1em] object-contain"
            draggable={false}
          />
          {children}
        </span>
      )}

      {variant === "icon" && Icon && <Icon className="w-[1em] h-[1em]" />}
      {variant === "bare" && Icon && <Icon className="w-[1em] h-[1em]" />}

      {variant === "link" && children}
    </button>
  )
}

export default Button
