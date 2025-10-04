import { useState } from "react"
import clsx from "clsx"
import { Square, CheckSquare } from "lucide-react"
import { getColorClasses, type ColorVariant } from "../../utils/colors"

export type CheckboxOption = {
  value: string
  label: string
}

export type CheckboxGroupProps = {
  id?: string
  name: string
  label?: string
  options: CheckboxOption[]
  value?: string[]
  defaultValue?: string[]
  onChange?: (value: string[]) => void
  className?: string
  disabled?: boolean
  readOnly?: boolean
  color?: ColorVariant
}

/**
 * CheckboxGroup Component
 * - Matches Input/LightSwitch styling
 * - Uses shared color utils for consistent variant themes
 * - Clean [] Label vertical layout
 */
function CheckboxGroup({
  id,
  name,
  label,
  options,
  value,
  defaultValue,
  onChange,
  className,
  disabled = false,
  readOnly = false,
  color = "primary",
}: CheckboxGroupProps) {
  const [selected, setSelected] = useState<string[]>(
    value ?? defaultValue ?? []
  )

  function toggleValue(val: string) {
    if (disabled || readOnly) return
    const updated = selected.includes(val)
      ? selected.filter((v) => v !== val)
      : [...selected, val]
    setSelected(updated)
    onChange?.(updated)
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

      <div className="flex flex-col gap-[0.5em]">
        {options.map((opt, idx) => {
          const isChecked = selected.includes(opt.value)
          const Icon = isChecked ? CheckSquare : Square

          return (
            <label
              key={idx}
              htmlFor={`${name}-${opt.value}`}
              className={clsx(
                "flex items-center gap-[0.5em] px-[0.75em] py-[0.4em] rounded-sm cursor-pointer select-none text-sm transition-all duration-150",
                "hover:-translate-y-[1px] focus-within:ring-2 focus-within:ring-pp-teal-500",
                isChecked
                  ? getColorClasses(color, "border font-medium")
                  : "text-gray-700 border border-transparent",
                disabled && "cursor-not-allowed hover:translate-y-0"
              )}
              onClick={() => toggleValue(opt.value)}
            >
              <input
                id={`${name}-${opt.value}`}
                name={name}
                type="checkbox"
                value={opt.value}
                checked={isChecked}
                disabled={disabled}
                readOnly={readOnly}
                onChange={() => toggleValue(opt.value)}
                className="hidden"
              />

              <Icon
                className={clsx(
                  "w-[1em] h-[1em]",
                  isChecked
                    ? getColorClasses(color, "text-inherit")
                    : "text-gray-400"
                )}
              />

              <span
                className={clsx(
                  "text-sm",
                  disabled ? "text-gray-400" : "text-gray-800"
                )}
              >
                {opt.label}
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

export default CheckboxGroup
