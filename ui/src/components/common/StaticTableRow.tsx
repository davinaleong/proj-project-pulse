import clsx from "clsx"
import StaticTableCell from "./StaticTableCell"
import { getColorClasses, type ColorVariant } from "./../../utils/colors"

type StaticTableRowProps<T> = {
  row: T
  columns: { key: keyof T; label: string }[]
  index: number
  color?: ColorVariant
}

function StaticTableRow<T extends Record<string, unknown>>({
  row,
  columns,
  index,
  color = "transparent",
}: StaticTableRowProps<T>) {
  return (
    <tr
      className={clsx(
        // ✅ Base styling
        "border-b border-gray-200 transition-colors duration-150",
        index % 2 === 0 ? "bg-white" : "bg-gray-50",
        // ✅ Hover effect
        "hover:bg-pp-teal-50 hover:text-pp-teal-900 cursor-pointer",
        getColorClasses(color)
      )}
    >
      {columns.map((col) => (
        <StaticTableCell key={String(col.key)} value={row[col.key]} />
      ))}
    </tr>
  )
}

export default StaticTableRow
