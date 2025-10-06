import { useMemo } from "react"
import { type LucideIcon, User, Smile, Heart, Zap, Star } from "lucide-react"
import clsx from "clsx"

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

type AvatarBadgeProps = {
  name?: string
  imageUrl?: string
  size?: number // px, default 48
  color?: ColorVariant
  className?: string
}

function AvatarBadge({
  name,
  imageUrl,
  size = 48,
  color = "default",
  className,
}: AvatarBadgeProps) {
  // Extract initials from name
  const initials = useMemo(() => {
    if (!name) return null
    const parts = name.trim().split(" ")
    const first = parts[0]?.[0]?.toUpperCase() ?? ""
    const last =
      parts.length > 1 ? parts[parts.length - 1][0]?.toUpperCase() : ""
    return `${first}${last}`
  }, [name])

  // Fallback icons pool
  const fallbackIcons: LucideIcon[] = [User, Smile, Heart, Zap, Star]
  const FallbackIcon =
    fallbackIcons[Math.floor(Math.random() * fallbackIcons.length)]

  // Color variants
  const colorClasses: Record<ColorVariant, string> = {
    primary: "bg-pp-teal-50 text-pp-teal-900 border-pp-teal-200",
    secondary: "bg-pp-slate-50 text-pp-slate-900 border-pp-slate-200",
    danger: "bg-red-50 text-red-900 border-red-200",
    success: "bg-green-50 text-green-900 border-green-200",
    warning: "bg-yellow-50 text-yellow-900 border-yellow-200",
    info: "bg-blue-50 text-blue-900 border-blue-200",
    default: "bg-white text-gray-900 border-gray-200",
    transparent: "bg-transparent text-gray-900 border-gray-200",
    custom: "",
  }

  const baseStyle = clsx(
    "flex items-center justify-center rounded-full border shadow-sm aspect-square overflow-hidden",
    "select-none backdrop-blur-sm",
    "hover:shadow-md transition-all duration-150",
    colorClasses[color],
    className
  )

  return (
    <div
      className={baseStyle}
      style={{ width: size, height: size }}
      title={name || "Anonymous"}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={name || "Profile picture"}
          className="w-full h-full object-cover"
        />
      ) : initials ? (
        <span className="text-lg font-semibold">{initials}</span>
      ) : (
        <FallbackIcon className="w-1/2 h-1/2 opacity-70" />
      )}
    </div>
  )
}

export default AvatarBadge
