// Panel.tsx
import { useState } from "react"
import clsx from "clsx"
import { ChevronDown, ChevronRight } from "lucide-react"

type PanelProps = {
  title?: string
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
  defaultOpen?: boolean
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

export default function Panel({
  title,
  children,
  footer,
  className,
  defaultOpen = true,
  color = "default",
}: PanelProps) {
  const [open, setOpen] = useState(defaultOpen)

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
    <section
      role="region"
      aria-label={title || "Panel"}
      className={clsx(
        "flex flex-col rounded-sm border shadow-sm hover:shadow-md active:shadow-inner transition-all duration-150",
        "px-[1em] py-[0.75em]",
        colorClasses[color],
        className
      )}
    >
      {title && (
        <header
          className="flex items-center justify-between mb-[0.5em] font-semibold text-base border-b border-gray-200 pb-[0.5em] cursor-pointer select-none"
          onClick={() => setOpen(!open)}
        >
          <span>{title}</span>
          {open ? (
            <ChevronDown className="w-[1em] h-[1em] text-gray-500" />
          ) : (
            <ChevronRight className="w-[1em] h-[1em] text-gray-500" />
          )}
        </header>
      )}

      {open && (
        <>
          <div className="flex-1">{children}</div>
          {footer && (
            <footer className="mt-[0.75em] border-t border-gray-200 pt-[0.5em] text-sm text-gray-600">
              {footer}
            </footer>
          )}
        </>
      )}
    </section>
  )
}
