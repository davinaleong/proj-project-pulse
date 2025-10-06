import { ChevronRight } from "lucide-react"
import Button from "./Button"
import { getColorClasses, type ColorVariant } from "../../utils/colors"
import clsx from "clsx"

export type Crumb = {
  label: string
  onClick?: () => void
}

type BreadcrumbsProps = {
  items: Crumb[]
  className?: string
  color?: ColorVariant
}

/**
 * Breadcrumbs Component
 * ---------------------
 * - Paper-style container using color variants
 * - Scrollable horizontally for overflow
 * - Uses Button for clickable links
 * - Shows Lucide ChevronRight separators
 */
export default function Breadcrumbs({
  items,
  className,
  color = "default",
}: BreadcrumbsProps) {
  return (
    <nav
      className={clsx(
        "flex items-center gap-[0.5em] overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent",
        "py-[0.5em] px-[1em] rounded-sm border shadow-sm",
        "hover:shadow-md active:shadow-inner transition-all duration-150",
        getColorClasses(color),
        className
      )}
      aria-label="Breadcrumb"
    >
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1
        return (
          <div
            key={idx}
            className="flex items-center gap-[0.5em] flex-shrink-0"
          >
            {!isLast ? (
              <Button
                variant="link"
                onClick={item.onClick || (() => {})}
                className="whitespace-nowrap"
              >
                {item.label}
              </Button>
            ) : (
              <span className="font-medium text-gray-500 cursor-default whitespace-nowrap">
                {item.label}
              </span>
            )}
            {!isLast && (
              <ChevronRight className="w-[1em] h-[1em] text-gray-400 flex-shrink-0" />
            )}
          </div>
        )
      })}
    </nav>
  )
}
