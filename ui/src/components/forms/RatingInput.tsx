import { useState } from "react"
import clsx from "clsx"
import {
  Star,
  StarOff,
  Smile,
  Frown,
  Circle,
  CircleDot,
  XCircle,
} from "lucide-react"
import { getColorClasses, type ColorVariant } from "../../utils/colors"

export type RatingVariant = "stars" | "smiley" | "circle"

export type RatingInputProps = {
  id?: string
  name: string
  label?: string
  steps?: 3 | 5 | 10
  variant?: RatingVariant
  allowReset?: boolean
  defaultValue?: number
  value?: number
  onChange?: (value: number) => void
  className?: string
  disabled?: boolean
  readOnly?: boolean
  color?: ColorVariant
}

/**
 * RatingInput component
 * - 3/5/10 step rating system
 * - Variants: stars, smiley, circles
 * - Optional reset toggle
 * - Outputs step value (1-based)
 */
function RatingInput({
  id,
  name,
  label,
  steps = 5,
  variant = "stars",
  allowReset = true,
  defaultValue = 0,
  value,
  onChange,
  className,
  disabled = false,
  readOnly = false,
  color = "primary",
}: RatingInputProps) {
  const [rating, setRating] = useState<number>(value ?? defaultValue)
  const [hovered, setHovered] = useState<number>(0)
  const inputId = id || name

  function handleClick(step: number) {
    if (disabled || readOnly) return
    const newRating = allowReset && step === rating ? 0 : step
    setRating(newRating)
    onChange?.(newRating)
  }

  const colorClass = getColorClasses(color, "cursor-pointer transition-all")

  // Choose icons based on variant
  function getIcon(step: number) {
    const active = step <= (hovered || rating)
    switch (variant) {
      case "smiley":
        return active ? (
          <Smile className="w-[1.25em] h-[1.25em]" />
        ) : (
          <Frown className="w-[1.25em] h-[1.25em]" />
        )
      case "circle":
        return active ? (
          <CircleDot className="w-[1.1em] h-[1.1em]" />
        ) : (
          <Circle className="w-[1.1em] h-[1.1em]" />
        )
      default:
        return active ? (
          <Star className="w-[1.25em] h-[1.25em]" />
        ) : (
          <StarOff className="w-[1.25em] h-[1.25em]" />
        )
    }
  }

  return (
    <div
      className={clsx(
        "rounded-sm border shadow-sm p-[1em] bg-white flex flex-col gap-[0.5em]",
        getColorClasses("default"),
        disabled && "opacity-60 cursor-not-allowed",
        className
      )}
    >
      {label && (
        <label
          htmlFor={inputId}
          className={clsx(
            "block text-sm font-medium",
            disabled ? "text-gray-400" : "text-gray-700"
          )}
        >
          {label}
        </label>
      )}

      <div className="flex items-center gap-[0.5em]">
        {Array.from({ length: steps }, (_, i) => {
          const step = i + 1
          return (
            <button
              key={step}
              type="button"
              aria-label={`Rate ${step}`}
              onClick={() => handleClick(step)}
              onMouseEnter={() => setHovered(step)}
              onMouseLeave={() => setHovered(0)}
              disabled={disabled}
              className={clsx(
                "p-[0.25em] rounded-sm hover:-translate-y-[1px] focus:outline-none focus:ring-2 focus:ring-pp-teal-500",
                colorClass,
                step <= (hovered || rating)
                  ? getColorClasses(color, "text-pp-teal-600")
                  : "text-gray-400"
              )}
            >
              {getIcon(step)}
            </button>
          )
        })}

        {allowReset && rating > 0 && (
          <button
            type="button"
            aria-label="Reset rating"
            onClick={() => handleClick(rating)}
            className={clsx(
              "p-[0.25em] rounded-sm text-gray-500 hover:text-red-600 transition-all",
              disabled && "cursor-not-allowed"
            )}
          >
            <XCircle className="w-[1em] h-[1em]" />
          </button>
        )}
      </div>

      <input id={inputId} type="hidden" name={name} value={rating} readOnly />
    </div>
  )
}

export default RatingInput
