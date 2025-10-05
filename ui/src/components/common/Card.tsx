import {
  useState,
  type ReactNode,
  type ReactElement,
  cloneElement,
  isValidElement,
} from "react"
import clsx from "clsx"
import { ChevronDown, ChevronUp } from "lucide-react"
import { getColorClasses, type ColorVariant } from "../../utils/colors"

type IconPosition = "left" | "right" | "top" | "bottom"

type CardProps = {
  title?: string
  footer?: ReactNode
  color?: ColorVariant
  expandable?: boolean
  defaultOpen?: boolean
  icon?: ReactNode
  iconPosition?: IconPosition
  imageTop?: ReactNode
  imageBottom?: ReactNode
  className?: string
  children?: ReactNode
}

export default function Card({
  title,
  footer,
  color = "default",
  expandable = false,
  defaultOpen = true,
  icon,
  iconPosition = "left",
  imageTop,
  imageBottom,
  className,
  children,
}: CardProps) {
  const [open, setOpen] = useState(defaultOpen)

  /**
   * Handles icon scaling and placement based on position.
   */
  const renderIcon = () => {
    if (!icon || !isValidElement(icon)) return null

    const el = icon as ReactElement<{ className?: string }>
    const extraClass =
      iconPosition === "left" || iconPosition === "right"
        ? "scale-[1.3] mx-[1em]"
        : "block w-full p-[1em]"

    return cloneElement(el, {
      className: clsx(el.props.className, extraClass),
    })
  }

  return (
    <div
      className={clsx(
        "rounded-sm border shadow-sm transition-all duration-300 overflow-hidden",
        getColorClasses(color),
        className
      )}
    >
      {/* Header */}
      {title && (
        <div className="flex justify-between items-center p-[1em] border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-lg">{title}</h3>
          {expandable && (
            <button
              onClick={() => setOpen((prev) => !prev)}
              className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
            >
              {open ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          )}
        </div>
      )}

      {/* Top image (no padding) */}
      {imageTop && <div className="w-full overflow-hidden">{imageTop}</div>}

      {/* Content */}
      {open && (
        <div
          className={clsx("p-[1em] flex", {
            "flex-col items-center":
              iconPosition === "top" || iconPosition === "bottom",
            "items-center": iconPosition === "left" || iconPosition === "right",
          })}
        >
          {iconPosition === "top" && renderIcon()}
          {iconPosition === "left" && renderIcon()}

          <div className="flex-1">{children}</div>

          {iconPosition === "right" && renderIcon()}
          {iconPosition === "bottom" && renderIcon()}
        </div>
      )}

      {/* Bottom image (no padding) */}
      {imageBottom && (
        <div className="w-full overflow-hidden">{imageBottom}</div>
      )}

      {/* Footer */}
      {footer && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-[1em] text-sm">
          {footer}
        </div>
      )}
    </div>
  )
}
