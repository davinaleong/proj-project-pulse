import { useState } from "react"
import clsx from "clsx"
import { getColorClasses, type ColorVariant } from "../../utils/colors"

export type LightSwitchVariant = "boolean" | "numeric" | "text" | "accepted"

export type LightSwitchInputProps = {
  id?: string
  name: string
  labelLeft?: string
  labelRight?: string
  className?: string
  value?: boolean
  defaultChecked?: boolean
  disabled?: boolean
  readOnly?: boolean
  onChange?: (value: boolean | string | number) => void
  variant?: LightSwitchVariant
  color?: ColorVariant
}

function LightSwitchInput({
  id,
  name,
  labelLeft = "Off",
  labelRight = "On",
  className,
  value,
  defaultChecked = false,
  disabled = false,
  readOnly = false,
  onChange,
  variant = "boolean",
  color = "primary",
}: LightSwitchInputProps) {
  const [checked, setChecked] = useState<boolean>(value ?? defaultChecked)
  const inputId = id || name

  function handleToggle() {
    if (disabled || readOnly) return
    const newChecked = !checked
    setChecked(newChecked)

    let output: boolean | string | number = newChecked
    switch (variant) {
      case "numeric":
        output = newChecked ? 1 : 0
        break
      case "text":
        output = newChecked ? "Yes" : "No"
        break
      case "accepted":
        output = newChecked ? "Accepted" : ""
        break
    }

    onChange?.(output)
  }

  return (
    <div
      className={clsx(
        "inline-flex items-center gap-[0.5em]",
        disabled && "opacity-60 cursor-not-allowed",
        className
      )}
    >
      {/* Left Label */}
      {labelLeft && (
        <span
          className={clsx(
            "text-sm font-medium select-none",
            disabled ? "text-gray-400" : "text-gray-700"
          )}
        >
          {labelLeft}
        </span>
      )}

      {/* Switch Control */}
      <button
        id={inputId}
        name={name}
        type="button"
        aria-pressed={checked}
        disabled={disabled}
        onClick={handleToggle}
        className={clsx(
          "relative w-[3em] h-[1.5em] rounded-full border shadow-inner transition-all duration-200 focus:outline-none focus:ring-2",
          checked ? getColorClasses(color) : "bg-gray-200 border-gray-300",
          disabled && "cursor-not-allowed"
        )}
      >
        <span
          className={clsx(
            "absolute top-[2px] left-[2px] w-[1.1em] h-[1.1em] rounded-full bg-white shadow transition-transform duration-200",
            checked ? "translate-x-[1.5em]" : "translate-x-0"
          )}
        ></span>
      </button>

      {/* Right Label */}
      {labelRight && (
        <span
          className={clsx(
            "text-sm font-medium select-none",
            disabled ? "text-gray-400" : "text-gray-700"
          )}
        >
          {labelRight}
        </span>
      )}
    </div>
  )
}

export default LightSwitchInput
