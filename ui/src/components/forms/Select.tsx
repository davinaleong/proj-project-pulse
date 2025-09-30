import { type ChangeEvent, useState } from "react"
import clsx from "clsx"

export type Option = {
  value: string
  label: string
}

export type OptionGroup = {
  label: string
  options: Option[]
}

export type SelectProps = {
  id?: string
  name: string
  label?: string
  required?: boolean
  className?: string
  value?: string
  onChange?: (e: ChangeEvent<HTMLSelectElement>) => void
  message?: string
  messageVariant?: "help" | "error" | "success"
  size?: number // number of visible rows
  disabled?: boolean
  readOnly?: boolean
  options: (Option | OptionGroup)[]
  searchable?: boolean
  placeholder?: string
}

function Select({
  id,
  name,
  label,
  required = false,
  className,
  value,
  onChange,
  message,
  messageVariant = "help",
  size = 5,
  disabled = false,
  readOnly = false,
  options,
  searchable = false,
  placeholder = "Search...",
}: SelectProps) {
  const selectId = id || name
  const [search, setSearch] = useState("")

  const messageClasses: Record<"help" | "error" | "success", string> = {
    help: "text-gray-500",
    error: "text-red-600",
    success: "text-green-600",
  }

  // ✅ Filter function
  const filterOptions = (
    opts: (Option | OptionGroup)[]
  ): (Option | OptionGroup)[] => {
    if (!searchable || !search.trim()) return opts

    const query = search.toLowerCase()

    return opts
      .map((opt) => {
        if ("options" in opt) {
          // it's a group
          const filtered = opt.options.filter((o) =>
            o.label.toLowerCase().includes(query)
          )
          return filtered.length > 0 ? { ...opt, options: filtered } : null
        }
        return opt.label.toLowerCase().includes(query) ? opt : null
      })
      .filter(Boolean) as (Option | OptionGroup)[]
  }

  const filteredOptions = filterOptions(options)

  return (
    <div className="flow">
      {label && (
        <label
          htmlFor={selectId}
          className={clsx(
            "block text-sm font-medium",
            disabled || readOnly ? "text-gray-400" : "text-gray-700"
          )}
        >
          {label}
        </label>
      )}

      {/* ✅ Search box */}
      {searchable && (
        <input
          type="text"
          placeholder={placeholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          disabled={disabled || readOnly}
          className={clsx(
            "block w-full rounded-sm px-[1em] py-[0.5em] shadow-inner text-sm",
            "focus:outline-none focus:ring-2 focus:ring-pp-teal-500",
            disabled || readOnly
              ? "bg-gray-200 text-gray-500 cursor-not-allowed opacity-70"
              : "bg-gray-100 text-gray-900"
          )}
        />
      )}

      {/* ✅ Native select */}
      <select
        id={selectId}
        name={name}
        required={required}
        value={value}
        onChange={onChange}
        size={size}
        disabled={disabled || readOnly}
        className={clsx(
          "block w-full rounded-sm px-[1em] py-[0.5em] shadow-inner",
          "focus:outline-none focus:ring-2 focus:ring-pp-teal-500",
          disabled || readOnly
            ? "bg-gray-200 text-gray-500 cursor-not-allowed opacity-70"
            : "bg-gray-100 text-gray-900",
          className
        )}
      >
        {filteredOptions.map((opt, idx) =>
          "options" in opt ? (
            <optgroup key={idx} label={opt.label}>
              {opt.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </optgroup>
          ) : (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          )
        )}
      </select>

      {/* ✅ Message */}
      {message && (
        <p className={clsx("text-sm", messageClasses[messageVariant])}>
          {message}
        </p>
      )}
    </div>
  )
}

export default Select
