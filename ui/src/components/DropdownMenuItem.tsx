// DropdownMenuItem.tsx
import { type LucideIcon } from "lucide-react"

type DropdownMenuItemProps = {
  variant?: "text" | "image" | "icon"
  children?: React.ReactNode
  src?: string
  icon?: LucideIcon
  onClick?: () => void
}

function DropdownMenuItem({
  variant = "text",
  children,
  src,
  icon: Icon,
  onClick,
}: DropdownMenuItemProps) {
  return (
    <li>
      <button
        onClick={onClick}
        className="cursor-pointer flex items-center gap-[0.5em] w-full rounded-md px-[1em] py-[0.5em] hover:bg-white/20 transition"
      >
        {variant === "text" && children}
        {variant === "image" && src && (
          <img src={src} alt="" className="w-[1em] h-[1em] object-contain" />
        )}
        {variant === "icon" && Icon && <Icon className="w-[1em] h-[1em]" />}
        {variant !== "text" && children}
      </button>
    </li>
  )
}

export default DropdownMenuItem
