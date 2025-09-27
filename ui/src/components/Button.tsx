import { type LucideIcon } from "lucide-react"
import clsx from "clsx"

type ButtonProps = {
  onClick: () => void
  variant?: "text" | "image" | "icon"
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
    primary: "bg-pp-teal-500/10 text-pp-teal-900 dark:text-pp-teal-100",
    secondary: "bg-pp-gray-500/10 text-pp-gray-900 dark:text-pp-gray-100",
    danger: "bg-red-500/10 text-red-900 dark:text-red-100",
    success: "bg-green-500/10 text-green-900 dark:text-green-100",
    warning: "bg-yellow-500/10 text-yellow-900 dark:text-yellow-100",
    info: "bg-blue-500/10 text-blue-900 dark:text-blue-100",
    default: "bg-white/10 text-gray-900 dark:text-gray-100",
    transparent: "bg-white/5 text-gray-900 dark:text-gray-100",
    custom: "",
  }

  return (
    <button
      onClick={onClick}
      className={clsx(
        // Base glass look
        "cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 font-medium",
        "border border-white/30 backdrop-blur-md shadow-md",
        "transition-all duration-200 hover:scale-[1.02] hover:shadow-lg",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        colorClasses[color],
        className
      )}
    >
      {variant === "text" && children}

      {variant === "image" && src && (
        <>
          <img
            src={src}
            alt=""
            className="w-4 h-4 object-contain"
            draggable={false}
          />
          {children}
        </>
      )}

      {variant === "icon" && Icon && <Icon className="w-4 h-4" />}
    </button>
  )
}
