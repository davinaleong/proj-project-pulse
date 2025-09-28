// Breadcrumbs.tsx
import { ChevronRight } from "lucide-react"
import Button from "./Button"

export type Crumb = {
  label: string
  onClick?: () => void
}

type BreadcrumbsProps = {
  items: Crumb[]
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

function Breadcrumbs({
  items,
  className,
  color = "default",
}: BreadcrumbsProps) {
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
    <nav
      className={`flex items-center gap-[0.5em] overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent py-[0.5em] px-[1em] rounded-sm border shadow-sm hover:shadow-md active:shadow-inner transition-all duration-150 ${colorClasses[color]} ${className}`}
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

export default Breadcrumbs
