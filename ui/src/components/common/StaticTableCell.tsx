type StaticTableCellProps = {
  value: unknown
}

function StaticTableCell({ value }: StaticTableCellProps) {
  return <td className="px-[1em] py-[0.5em] text-sm">{String(value ?? "")}</td>
}

export default StaticTableCell
