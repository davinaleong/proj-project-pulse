import { type ChangeEvent } from "react"
import clsx from "clsx"

// --- Color conversion helpers ---
function hexToRgba(hex: string, alpha = 1): string {
  const bigint = parseInt(hex.slice(1), 16)
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function hexToHsla(hex: string, alpha = 1): string {
  const bigint = parseInt(hex.slice(1), 16)
  let r = (bigint >> 16) & 255
  let g = (bigint >> 8) & 255
  let b = bigint & 255

  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0,
    s = 0
  const l = (max + min) / 2 // ✅ use const here

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }
    h /= 6
  }

  return `hsla(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(
    l * 100
  )}%, ${alpha})`
}

// Very simple OKLab conversion (not perceptually exact but sufficient demo)
function hexToOklab(hex: string, alpha = 1): string {
  const bigint = parseInt(hex.slice(1), 16)
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255
  return `oklab(${(r / 255).toFixed(2)} ${(g / 255).toFixed(2)} ${(
    b / 255
  ).toFixed(2)} / ${alpha})`
}

// --- Component ---
type ColorInputProps = {
  id?: string
  name: string
  label?: string
  value?: string
  onChange?: (
    val: string,
    formats: { hex: string; rgba: string; hsla: string; oklab: string }
  ) => void
  required?: boolean
  disabled?: boolean
  readOnly?: boolean
  className?: string
  message?: string
  messageVariant?: "help" | "error" | "success"
  format?: "hex" | "rgba" | "hsla" | "oklab"
}

function ColorInput({
  id,
  name,
  label,
  value = "#000000",
  onChange,
  required = false,
  disabled = false,
  readOnly = false,
  className,
  message,
  messageVariant = "help",
  format = "hex",
}: ColorInputProps) {
  const inputId = id || name

  const messageClasses: Record<"help" | "error" | "success", string> = {
    help: "text-gray-500",
    error: "text-red-600",
    success: "text-green-600",
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const hex = e.target.value
    const formats = {
      hex,
      rgba: hexToRgba(hex),
      hsla: hexToHsla(hex),
      oklab: hexToOklab(hex),
    }
    onChange?.(formats[format], formats)
  }

  return (
    <div className="flow">
      {label && (
        <label
          htmlFor={inputId}
          className={clsx(
            "block text-sm font-medium",
            disabled || readOnly ? "text-gray-400" : "text-gray-700"
          )}
        >
          {label}
        </label>
      )}

      <input
        id={inputId}
        name={name}
        type="color"
        value={value}
        onChange={handleChange}
        required={required}
        disabled={disabled}
        readOnly={readOnly}
        className={clsx(
          "block w-full h-[2.5em] rounded-sm bg-gray-100 px-[1em] py-[0.5em] shadow-inner focus:outline-none focus:ring-2 focus:ring-pp-teal-500",
          disabled || readOnly ? "cursor-not-allowed opacity-70" : "",
          className
        )}
      />

      {message && (
        <p className={clsx("text-sm", messageClasses[messageVariant])}>
          {message}
        </p>
      )}
    </div>
  )
}

export default ColorInput
