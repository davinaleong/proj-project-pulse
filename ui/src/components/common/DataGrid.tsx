import { useState } from "react"
import clsx from "clsx"
import Button from "./Button"
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
} from "lucide-react"
import { getColorClasses, type ColorVariant } from "../../utils/colors"

export type DataGridColumn<T> = {
  key: keyof T
  label: string
  type?: string
  sortable?: boolean
  editable?: boolean
  required?: boolean
}

export type DataGridProps<T> = {
  caption?: string
  columns: DataGridColumn<T>[]
  data: T[]
  color?: ColorVariant
  pageSize?: number
  className?: string
  onSave?: (data: T[] | T) => void
  defaultOpen?: boolean
}

function DataGrid<T extends Record<string, unknown>>({
  caption,
  columns,
  data,
  color = "default",
  pageSize = 10,
  className,
  onSave,
  defaultOpen = true,
}: DataGridProps<T>) {
  const [gridData, setGridData] = useState<T[]>(data)
  const [originalData] = useState<T[]>(structuredClone(data)) // store original snapshot
  const [sortKey, setSortKey] = useState<keyof T | null>(null)
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")
  const [editing, setEditing] = useState<{ row: number; key: keyof T } | null>(
    null
  )
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(defaultOpen)

  const totalPages = Math.ceil(gridData.length / pageSize)
  const paginatedData = gridData.slice((page - 1) * pageSize, page * pageSize)

  function handleSort(key: keyof T) {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
    setGridData((prev) =>
      [...prev].sort((a, b) => {
        const av = a[key]
        const bv = b[key]
        if (av < bv) return sortDir === "asc" ? -1 : 1
        if (av > bv) return sortDir === "asc" ? 1 : -1
        return 0
      })
    )
  }

  function handleCellChange(rowIndex: number, key: keyof T, value: unknown) {
    const updated = [...gridData]
    updated[rowIndex] = { ...updated[rowIndex], [key]: value }
    setGridData(updated)
  }

  function handleBlur() {
    setEditing(null)
  }

  function handleRowSave(rowIndex: number) {
    if (!onSave) return
    onSave(gridData[rowIndex]) // send only this row
  }

  function handleRowCancel(rowIndex: number) {
    const reset = [...gridData]
    reset[rowIndex] = { ...originalData[rowIndex] } // restore from original data
    setGridData(reset)
    setEditing(null)
  }

  function renderPagination() {
    if (totalPages <= 1) return null

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
          <td colSpan={columns.length + 1}>
            <div className="flex justify-center items-center gap-[1em] py-[1em] text-sm">
              <Button
                variant="icon"
                color="default"
                icon={ChevronLeft}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              />
              {pages.map((p, idx) =>
                p === "..." ? (
                  <span key={idx} className="px-2 text-gray-500">
                    ...
                  </span>
                ) : (
                  <Button
                    key={idx}
                    variant="text"
                    color="default"
                    onClick={() => setPage(p as number)}
                    className={clsx(
                      "w-[2.5em] h-[2.5em]",
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
        "rounded-sm border shadow-sm transition-all duration-150 overflow-hidden",
        getColorClasses(color),
        className
      )}
    >
      {/* ✅ Caption */}
      {caption && (
        <div
          className="flex items-center justify-between px-[1em] py-[0.5em] border-b bg-gray-50 uppercase font-semibold text-sm cursor-pointer select-none hover:bg-gray-100"
          onClick={() => setOpen(!open)}
        >
          <span>{caption}</span>
          {open ? (
            <ChevronUp className="w-[1em] h-[1em] text-gray-500" />
          ) : (
            <ChevronDown className="w-[1em] h-[1em] text-gray-500" />
          )}
        </div>
      )}

      {/* ✅ Table */}
      {open && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
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
                      <span className="inline-flex items-center gap-1">
                        {col.label}
                        {sortKey === col.key &&
                          (sortDir === "asc" ? (
                            <ChevronUp className="w-3 h-3 inline" />
                          ) : (
                            <ChevronDown className="w-3 h-3 inline" />
                          ))}
                      </span>
                    </th>
                  ))}
                  <th className="px-[1em] py-[0.5em] text-left text-sm font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {paginatedData.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    {columns.map((col) => {
                      const isEditing =
                        editing?.row === rowIndex && editing.key === col.key
                      const value = row[col.key]

                      return (
                        <td
                          key={String(col.key)}
                          className="px-[1em] py-[0.5em] text-sm cursor-pointer"
                          onClick={() =>
                            col.editable &&
                            setEditing({ row: rowIndex, key: col.key })
                          }
                        >
                          {isEditing && col.editable ? (
                            <input
                              type={col.type || "text"}
                              defaultValue={
                                typeof value === "string" ||
                                typeof value === "number"
                                  ? value
                                  : value !== null && value !== undefined
                                  ? String(value)
                                  : ""
                              }
                              onBlur={(e) => {
                                handleCellChange(
                                  rowIndex,
                                  col.key,
                                  e.target.value
                                )
                                handleBlur()
                              }}
                              className="w-full rounded-sm border border-gray-300 px-[1em] py-[0.5em] shadow-inner focus:ring-2 focus:ring-pp-teal-500"
                              autoFocus
                            />
                          ) : (
                            String(value)
                          )}
                        </td>
                      )
                    })}

                    {/* ✅ Actions: Save + Cancel */}
                    <td className="px-[1em] py-[0.5em] text-center flex justify-center gap-[1em]">
                      <Button
                        variant="icon"
                        color="success"
                        icon={Check}
                        onClick={() => handleRowSave(rowIndex)}
                      />
                      <Button
                        variant="icon"
                        color="danger"
                        icon={X}
                        onClick={() => handleRowCancel(rowIndex)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>

              {renderPagination()}
            </table>
          </div>

          {onSave && (
            <div className="flex justify-end p-[1em] border-t bg-gray-50">
              <Button
                onClick={() => onSave(gridData)}
                color="success"
                variant="text"
              >
                Save All Changes
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default DataGrid
