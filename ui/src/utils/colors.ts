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

const colorClasses: Record<ColorVariant, string> = {
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

/**
 * Get Tailwind classes for a given color variant.
 *
 * @param color - One of the supported color variants
 * @param extra - Optional extra classes to merge
 */
export function getColorClasses(
  color: ColorVariant = "default",
  extra?: string
) {
  return clsx(colorClasses[color], extra)
}
