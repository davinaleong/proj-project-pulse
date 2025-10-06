// SearchBar.tsx
import { Search } from "lucide-react"
import clsx from "clsx"
import Button from "./Button"
import { getColorClasses, type ColorVariant } from "../../utils/colors"

type SearchBarProps = {
  onSearch: (query: string) => void
  placeholder?: string
  className?: string
  color?: ColorVariant
}

export default function SearchBar({
  onSearch,
  placeholder = "Search",
  className,
  color = "default",
}: SearchBarProps) {
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
        getColorClasses(color),
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
