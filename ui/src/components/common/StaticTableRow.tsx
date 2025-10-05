import React from "react"
import clsx from "clsx"
import { type Column } from "./StaticTable"
import { getColorClasses, type ColorVariant } from "./../../utils/colors"

type StaticTableRowProps<T extends Record<string, unknown>> = {
  row: T
  columns: Column<T>[]
  index: number
  color?: ColorVariant
}

function StaticTableRow<T extends Record<string, unknown>>({
  row,
  columns,
  index,
  color = "default",
}: StaticTableRowProps<T>) {
  const colorClasses = getColorClasses(color)

  return (
    <tr
      className={clsx(
        // ✅ Keep previous style
        "border-b border-gray-100 transition-colors duration-150",
        index % 2 === 0 ? "bg-white" : "bg-gray-50",
        "hover:bg-gray-100",

        // ✅ Add subtle left border or accent tint using color variant
        color !== "default" && "border-l-4",
        colorClasses
      )}
    >
      {columns.map((col) => {
        const cellValue = row[col.key]

        return (
          <td
            key={String(col.key)}
            className="px-[1em] py-[0.5em] text-sm align-middle text-gray-800"
          >
            {React.isValidElement(cellValue)
              ? cellValue
              : typeof cellValue === "string" ||
                typeof cellValue === "number" ||
                typeof cellValue === "boolean"
              ? String(cellValue)
              : ""}
          </td>
        )
      })}
    </tr>
  )
}

export default StaticTableRow
