import clsx from "clsx"
import { getColorClasses, type ColorVariant } from "./../../utils/colors"

type StaticTableCellProps = {
  value: unknown
  color?: ColorVariant
}

function StaticTableCell({ value, color = "default" }: StaticTableCellProps) {
  return (
    <td
      className={clsx(
        "px-[1em] py-[0.5em] text-sm border border-gray-100",
        getColorClasses(color)
      )}
    >
      {String(value ?? "")}
    </td>
  )
}

export default StaticTableCell
