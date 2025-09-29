import clsx from "clsx"
import StaticTableCell from "./StaticTableCell"

type StaticTableRowProps<T> = {
  row: T
  columns: { key: keyof T; label: string }[]
  index: number
}

function StaticTableRow<T extends Record<string, unknown>>({
  row,
  columns,
  index,
}: StaticTableRowProps<T>) {
  return (
    <tr
      className={clsx(
        "border-b border-gray-100",
        index % 2 === 0 ? "bg-white" : "bg-gray-50"
      )}
    >
      {columns.map((col) => (
        <StaticTableCell key={String(col.key)} value={row[col.key]} />
      ))}
    </tr>
  )
}

export default StaticTableRow
