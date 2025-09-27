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
    primary:
      "bg-blue-500/20 hover:bg-pp-teal-500/30 text-pp-teal-900 dark:text-pp-teal-100",
    secondary:
      "bg-gray-500/20 hover:bg-pp-slate-500/30 text-pp-slate-900 dark:text-pp-slate-100",
    danger: "bg-red-500/20 hover:bg-red-500/30 text-red-900 dark:text-red-100",
    success:
      "bg-green-500/20 hover:bg-green-500/30 text-green-900 dark:text-green-100",
    warning:
      "bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-900 dark:text-yellow-100",
    info: "bg-blue-500/20 hover:bg-blue-500/30 text-blue-900 dark:text-blue-100",
    default:
      "bg-gray-500/20 hover:bg-gray-500/30 text-gray-900 dark:text-gray-100",
    transparent:
      "bg-white/10 hover:bg-white/20 text-gray-900 dark:text-gray-100",
    custom: "",
  }

  return (
    <button
      onClick={onClick}
      className={clsx(
        // Glass look base
        "cursor-pointer inline-flex items-center justify-center gap-[0.5em] rounded-sm px-[1em] py-[0.5em] font-medium hover:opacity-70",
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
            className="w-[1em] h-[1em] object-contain"
            draggable={false}
          />
          {children}
        </>
      )}

      {variant === "icon" && Icon && <Icon className="w-[1em] h-[1em]" />}
    </button>
  )
}
