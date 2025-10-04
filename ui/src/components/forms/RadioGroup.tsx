import { useState } from "react"
import clsx from "clsx"
import { type LucideIcon, Circle, CheckCircle } from "lucide-react"

export type RadioOption = {
  value: string
  label: string
  icon?: LucideIcon // optional Lucide icon
}

export type RadioGroupProps = {
  id?: string
  name: string
  label?: string // group label/title
  options: RadioOption[]
  defaultValue?: string
  value?: string
  onChange?: (value: string) => void
  className?: string
  disabled?: boolean
  readOnly?: boolean
  color?:
    | "primary"
    | "secondary"
    | "danger"
    | "success"
    | "info"
    | "warning"
    | "default"
}

/**
 * RadioGroup Component
 * - Matches LightSwitch style
 * - Uses custom radio input designs with Lucide icons
 * - Supports optional group label/title
 */
function RadioGroup({
  id,
  name,
  label,
  options,
  defaultValue,
  value,
  onChange,
  className,
  disabled = false,
  readOnly = false,
  color = "primary",
}: RadioGroupProps) {
  const [selected, setSelected] = useState<string>(value ?? defaultValue ?? "")

  const colorClasses: Record<string, string> = {
    primary: "text-pp-teal-600 border-pp-teal-400",
    secondary: "text-gray-700 border-gray-400",
    danger: "text-red-600 border-red-400",
    success: "text-green-600 border-green-400",
    warning: "text-yellow-600 border-yellow-400",
    info: "text-blue-600 border-blue-400",
    default: "text-gray-700 border-gray-400",
  }

  function handleChange(val: string) {
    if (disabled || readOnly) return
    setSelected(val)
    onChange?.(val)
  }

  return (
    <fieldset
      id={id}
      className={clsx(
        "rounded-sm border border-gray-200 shadow-sm p-[1em] bg-white",
        disabled && "opacity-60 cursor-not-allowed",
        className
      )}
    >
      {label && (
        <legend
          className={clsx(
            "text-sm font-medium px-[0.5em]",
            disabled ? "text-gray-400" : "text-gray-700"
          )}
        >
          {label}
        </legend>
      )}

      <div className="flex flex-wrap gap-[0.75em]">
        {options.map((opt, idx) => {
          const isChecked = selected === opt.value
          const Icon = opt.icon ?? (isChecked ? CheckCircle : Circle)

          return (
            <label
              key={idx}
              htmlFor={`${name}-${opt.value}`}
              className={clsx(
                "inline-flex items-center gap-[0.5em] px-[1em] py-[0.5em] rounded-sm border text-sm font-medium cursor-pointer select-none transition-all duration-150",
                "shadow-sm hover:shadow-md active:shadow-inner hover:-translate-y-[1px]",
                isChecked
                  ? colorClasses[color]
                  : "text-gray-700 border-gray-200",
                disabled && "cursor-not-allowed hover:translate-y-0"
              )}
              onClick={() => handleChange(opt.value)}
            >
              <input
                id={`${name}-${opt.value}`}
                name={name}
                type="radio"
                value={opt.value}
                checked={isChecked}
                disabled={disabled}
                readOnly={readOnly}
                onChange={() => handleChange(opt.value)}
                className="hidden"
              />

              <Icon
                className={clsx(
                  "w-[1em] h-[1em]",
                  isChecked
                    ? colorClasses[color].split(" ")[0]
                    : "text-gray-400"
                )}
              />

              <span>{opt.label}</span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

export default RadioGroup
