// DropdownMenu.tsx
import { useState } from "react"
import clsx from "clsx"
import { ChevronUp, ChevronDown } from "lucide-react"

type DropdownMenuProps = {
  label: string
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
  children: React.ReactNode
}

function DropdownMenu({
  label,
  color = "default",
  children,
}: DropdownMenuProps) {
  const [open, setOpen] = useState(false)

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
    <div className="relative inline-block flow">
      <button
        onClick={() => setOpen(!open)}
        className={clsx(
          "cursor-pointer flex items-center justify-between gap-[0.5em] rounded-sm px-[1em] py-[0.5em] font-medium",
          "border border-white/30 backdrop-blur-md shadow-md",
          "transition-all duration-200 hover:scale-[1.02] hover:shadow-lg",
          colorClasses[color]
        )}
      >
        {label}
        {open ? (
          <ChevronUp className="w-[1em] h-[1em]" />
        ) : (
          <ChevronDown className="w-[1em] h-[1em]" />
        )}
      </button>

      {open && (
        <ul
          className={clsx(
            "absolute mt-[1em] rounded-sm border border-white/30 backdrop-blur-md shadow-lg",
            "z-50",
            "w-full", // match button width
            colorClasses[color]
          )}
        >
          {children}
        </ul>
      )}
    </div>
  )
}

export default DropdownMenu
