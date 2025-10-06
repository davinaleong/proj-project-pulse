import { type LucideIcon } from "lucide-react"
import clsx from "clsx"
import { useState } from "react"

export type ColorVariant =
  | "primary"
  | "secondary"
  | "danger"
  | "success"
  | "warning"
  | "info"
  | "default"
  | "transparent"
  | "custom"

type IconButtonProps = {
  icon: LucideIcon
  onClick?: () => void
  color?: ColorVariant
  tooltip?: string
  className?: string
  disabled?: boolean
}

function IconButton({
  icon: Icon,
  onClick,
  color = "default",
  tooltip,
  className,
  disabled = false,
}: IconButtonProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  const colorClasses: Record<ColorVariant, string> = {
    primary:
      "bg-pp-teal-50 text-pp-teal-900 border-pp-teal-200 hover:bg-pp-teal-100",
    secondary:
      "bg-pp-gray-50 text-pp-gray-900 border-pp-gray-200 hover:bg-pp-gray-100",
    danger: "bg-red-50 text-red-900 border-red-200 hover:bg-red-100",
    success: "bg-green-50 text-green-900 border-green-200 hover:bg-green-100",
    warning:
      "bg-yellow-50 text-yellow-900 border-yellow-200 hover:bg-yellow-100",
    info: "bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100",
    default: "bg-white text-gray-900 border-gray-200 hover:bg-gray-50",
    transparent:
      "bg-transparent text-gray-900 border-gray-200 hover:bg-gray-50/30",
    custom: "",
  }

  return (
    <div className="relative inline-flex items-center justify-center">
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        onMouseEnter={() => tooltip && setShowTooltip(true)}
        onMouseLeave={() => tooltip && setShowTooltip(false)}
        className={clsx(
          "flex items-center justify-center rounded-full border shadow-sm cursor-pointer",
          "aspect-square w-[5em] h-[5em] transition-all duration-150 ease-in-out",
          "backdrop-blur-sm bg-opacity-70 select-none",
          "hover:shadow-md active:scale-70 disabled:opacity-50",
          colorClasses[color],
          className
        )}
      >
        <Icon className="w-[3em] h-[3em]" />
      </button>

      {tooltip && showTooltip && (
        <span
          className={clsx(
            "absolute bottom-[125%] left-1/2 -translate-x-1/2 whitespace-nowrap",
            "rounded-sm bg-gray-100 text-gray-900 text-xs px-[1em] py-[1em] shadow-lg",
            "opacity-90"
          )}
        >
          {tooltip}
        </span>
      )}
    </div>
  )
}

export default IconButton
