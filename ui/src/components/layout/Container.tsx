// components/layout/Container.tsx
import clsx from "clsx"

type ContainerProps = {
  children: React.ReactNode
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

export default function Container({
  children,
  className,
  color = "default",
}: ContainerProps) {
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
    <div
      className={clsx(
        "w-full max-w-lg mx-auto rounded-sm border shadow-sm hover:shadow-md active:shadow-inner transition-all duration-150 px-[1.5em] py-[2em]",
        colorClasses[color],
        className
      )}
    >
      {children}
    </div>
  )
}
