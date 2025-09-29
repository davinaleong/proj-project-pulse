import { useState } from "react"
import clsx from "clsx"
import Button from "./Button"
import Input from "../forms/Input"
import StaticTableRow from "./StaticTableRow"
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"

type Column<T> = {
  key: keyof T
  label: string
  sortable?: boolean
}

type StaticTableProps<T> = {
  columns: Column<T>[]
  data: T[]
  className?: string
  enableSearch?: boolean
  enablePagination?: boolean
  sortable?: boolean
  pageSize?: number
  caption?: string
  defaultOpen?: boolean
}

function StaticTable<T extends Record<string, unknown>>({
  columns,
  data,
  className,
  enableSearch = false,
  enablePagination = false,
  sortable = false,
  pageSize = 5,
  caption,
  defaultOpen = true,
}: StaticTableProps<T>) {
  const [search, setSearch] = useState("")
  const [sortKey, setSortKey] = useState<keyof T | null>(null)
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(defaultOpen)

  // ✅ Filtering
  const filteredData = enableSearch
    ? data.filter((row) =>
        Object.values(row)
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase())
      )
    : data

  // ✅ Sorting
  const sortedData =
    sortable && sortKey
      ? [...filteredData].sort((a, b) => {
          const av = a[sortKey]
          const bv = b[sortKey]
          if (av < bv) return sortDir === "asc" ? -1 : 1
          if (av > bv) return sortDir === "asc" ? 1 : -1
          return 0
        })
      : filteredData

  // ✅ Pagination
  const totalPages = enablePagination
    ? Math.ceil(sortedData.length / pageSize)
    : 1

  const paginatedData = enablePagination
    ? sortedData.slice((page - 1) * pageSize, page * pageSize)
    : sortedData

  function handleSort(key: keyof T) {
    if (!sortable) return
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  function renderPagination() {
    if (!enablePagination || totalPages <= 1) return null

    const pages: (number | string)[] = []
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) {
        pages.push(i)
      } else if (
        (i === 2 && page > 3) ||
        (i === totalPages - 1 && page < totalPages - 2)
      ) {
        pages.push("...")
      }
    }

    return (
      <tfoot>
        <tr>
          <td colSpan={columns.length}>
            <div className="flex justify-center items-center gap-[0.5em] py-[1em] text-sm">
              <Button
                variant="icon"
                color="default"
                icon={ChevronLeft}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="w-[2.5em] h-[2.5em] flex items-center justify-center rounded-sm"
                disabled={page === 1}
              />

              {pages.map((p, idx) =>
                p === "..." ? (
                  <span key={idx} className="px-[0.5em] text-gray-500">
                    &hellip;
                  </span>
                ) : (
                  <Button
                    key={idx}
                    variant="text"
                    color="default"
                    onClick={() => setPage(p as number)}
                    className={clsx(
                      "w-[2.5em] h-[2.5em] flex items-center justify-center rounded-sm",
                      p === page
                        ? "bg-pp-teal-50 border-pp-teal-200"
                        : "bg-white border-gray-200"
                    )}
                  >
                    {p}
                  </Button>
                )
              )}

              <Button
                variant="icon"
                color="default"
                icon={ChevronRight}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="w-[2.5em] h-[2.5em] flex items-center justify-center rounded-sm"
                disabled={page === totalPages}
              />
            </div>
          </td>
        </tr>
      </tfoot>
    )
  }

  return (
    <div
      className={clsx(
        "overflow-x-auto rounded-sm border border-gray-200 shadow-sm hover:shadow-md active:shadow-inner transition-all duration-150",
        className
      )}
    >
      {caption && (
        <div
          className="flex items-center justify-between px-[1em] py-[0.5em] bg-gray-100 border-b border-gray-200 cursor-pointer select-none"
          onClick={() => setOpen(!open)}
        >
          <span className="font-semibold text-sm">{caption}</span>
          {open ? (
            <ChevronUp className="w-[1em] h-[1em] text-gray-500" />
          ) : (
            <ChevronDown className="w-[1em] h-[1em] text-gray-500" />
          )}
        </div>
      )}

      {open && (
        <>
          {enableSearch && open && (
            <div className="p-[0.5em] border-b border-gray-200 bg-gray-50">
              <Input
                type="search"
                name="search"
                placeholder="Search..."
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSearch(e.target.value)
                }
              />
            </div>
          )}

          <table className="w-full border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {columns.map((col) => (
                  <th
                    key={String(col.key)}
                    onClick={() => col.sortable && handleSort(col.key)}
                    className={clsx(
                      "px-[1em] py-[0.5em] text-left text-sm font-semibold cursor-pointer select-none",
                      col.sortable && "hover:underline"
                    )}
                  >
                    <span className="inline-flex items-center gap-[0.5em]">
                      {col.label}
                      {sortable &&
                        sortKey === col.key &&
                        (sortDir === "asc" ? (
                          <ChevronUp className="w-[1em] h-[1em] inline" />
                        ) : (
                          <ChevronDown className="w-[1em] h-[1em] inline" />
                        ))}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-[1em] py-[1em] text-center text-gray-500"
                  >
                    No records found
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, i) => (
                  <StaticTableRow
                    key={i}
                    row={row}
                    columns={columns}
                    index={i}
                  />
                ))
              )}
            </tbody>

            {renderPagination()}
          </table>
        </>
      )}
    </div>
  )
}

export default StaticTable
