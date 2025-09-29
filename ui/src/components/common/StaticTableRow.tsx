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
  color = "default",
}: StaticTableRowProps<T>) {
  return (
    <tr
      className={clsx(
        "border-b border-gray-200",
        index % 2 === 0 ? "bg-white" : "bg-gray-50",
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
