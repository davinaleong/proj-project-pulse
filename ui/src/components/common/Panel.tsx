// Panel.tsx
import { useState, type JSX } from "react"
import clsx from "clsx"
import { ChevronDown, ChevronRight } from "lucide-react"
import { getColorClasses, type ColorVariant } from "../../utils/colors"

type PanelProps = {
  title?: string
  titleLevel?: 0 | 1 | 2 | 3 | 4 | 5 | 6
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
  defaultOpen?: boolean
  color?: ColorVariant
}

export default function Panel({
  title,
  titleLevel = 0,
  children,
  footer,
  className,
  defaultOpen = true,
  color = "default",
}: PanelProps) {
  const [open, setOpen] = useState(defaultOpen)

  // Heading tag logic: 0 → span, 1–6 → h1–h6
  const HeadingTag: keyof JSX.IntrinsicElements =
    titleLevel === 0
      ? "span"
      : (`h${titleLevel}` as keyof JSX.IntrinsicElements)

  return (
    <section
      role="region"
      aria-label={title || "Panel"}
      className={clsx(
        "flex flex-col rounded-sm border shadow-sm hover:shadow-md active:shadow-inner transition-all duration-150",
        "px-[1em] py-[0.75em]",
        getColorClasses(color),
        className
      )}
    >
      {title && (
        <header
          className="flex items-center justify-between mb-[0.5em] border-b border-gray-200 pb-[0.5em] cursor-pointer select-none"
          onClick={() => setOpen(!open)}
        >
          <HeadingTag className="font-semibold text-base">{title}</HeadingTag>
          {open ? (
            <ChevronDown className="w-[1em] h-[1em] text-gray-500" />
          ) : (
            <ChevronRight className="w-[1em] h-[1em] text-gray-500" />
          )}
        </header>
      )}

      {open && (
        <>
          <div className="flex-1">{children}</div>
          {footer && (
            <footer className="mt-[0.75em] border-t border-gray-200 pt-[0.5em] text-sm text-gray-600">
              {footer}
            </footer>
          )}
        </>
      )}
    </section>
  )
}
