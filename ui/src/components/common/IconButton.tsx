import { type LucideIcon } from "lucide-react"
import clsx from "clsx"
import { useState } from "react"
import { getColorClasses, type ColorVariant } from "../../utils/colors"

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
          getColorClasses(color),
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
