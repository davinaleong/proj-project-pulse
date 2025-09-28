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
    <div className="relative inline-block">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={clsx(
          "cursor-pointer flex items-center justify-between gap-[0.5em] rounded-sm px-[1em] py-[0.5em] font-medium",
          "border shadow-sm hover:shadow-md active:shadow-inner",
          "transition-all duration-150 hover:-translate-y-[1px]",
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

      {/* Dropdown Menu */}
      {open && (
        <ul
          className={clsx(
            "absolute mt-2 rounded-sm border shadow-md",
            "z-50 w-full",
            "overflow-hidden divide-y divide-gray-200", // menu item separation
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
