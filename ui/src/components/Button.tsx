import { type LucideIcon } from "lucide-react"
import clsx from "clsx"

type ButtonProps = {
  onClick: () => void
  variant?: "text" | "image" | "icon" | "link"
  children?: React.ReactNode
  src?: string // for images
  icon?: LucideIcon // for Lucide icons
  className?: string
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

export default function Button({
  onClick,
  variant = "text",
  children,
  src,
  icon: Icon,
  className,
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
      onClick={onClick}
      className={clsx(
        // Shared base
        "cursor-pointer inline-flex items-center gap-[0.5em] font-medium transition-all duration-150",
        "disabled:opacity-50 disabled:cursor-not-allowed",

        // Variants
        variant === "link" &&
          "bg-transparent border-0 p-0 underline underline-offset-4 text-blue-500 hover:text-blue-700 active:text-blue-900 shadow-none rounded-none",

        variant !== "link" &&
          "justify-center rounded-sm px-[1em] py-[0.5em] border shadow-sm hover:shadow-md active:shadow-inner hover:-translate-y-[1px]",

        variant !== "link" && colorClasses[color],

        className
      )}
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

      {variant === "link" && children}
    </button>
  )
}
