// SearchBar.tsx
import { Search } from "lucide-react"
import clsx from "clsx"
import Button from "./Button"

type SearchBarProps = {
  onSearch: (query: string) => void
  placeholder?: string
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

export default function SearchBar({
  onSearch,
  placeholder = "Search",
  className,
  color = "default",
}: SearchBarProps) {
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

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const query = (formData.get("search") as string)?.trim()
    onSearch(query)
  }

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      aria-label="Site Search"
      className={clsx(
        "flex items-center gap-[0.5em] rounded-sm border shadow-sm hover:shadow-md active:shadow-inner transition-all duration-150 px-[1em] py-[0.5em] w-full max-w-md",
        colorClasses[color],
        className
      )}
    >
      <label htmlFor="search-input" className="sr-only">
        Search
      </label>
      <input
        type="search"
        id="search-input"
        name="search"
        placeholder={placeholder}
        className="flex-1 bg-transparent outline-none text-inherit placeholder-gray-400"
        autoComplete="off"
      />

      {/* Reuse Button component */}
      <Button
        type="submit"
        variant="bare"
        onClick={() => {}}
        icon={Search}
        color={color}
      />
    </form>
  )
}
