import type { ReactNode } from 'react'

type Column<T> = {
  key: string
  header: string
  align?: 'left' | 'right' | 'center'
  render: (row: T, index: number) => ReactNode
}

type DataTableProps<T> = {
  rows: T[]
  columns: Column<T>[]
  emptyText?: string
  onRowClick?: (row: T) => void
}

const alignClass = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
}

const DataTable = <T,>({ rows, columns, emptyText = 'Chưa có dữ liệu', onRowClick }: DataTableProps<T>) => {
  return (
    <div className="overflow-hidden rounded-2xl border border-cyan-400/10 bg-[#061827]">
      <div className="overflow-auto">
        <table className="w-full min-w-[760px] border-separate border-spacing-0">
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`border-b border-cyan-400/10 bg-cyan-400/5 px-4 py-3 text-xs font-black uppercase tracking-[.12em] text-cyan-200 ${alignClass[column.align ?? 'left']}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((row, index) => (
                <tr
                  key={index}
                  className={`group ${onRowClick ? 'cursor-pointer' : ''}`}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`border-b border-cyan-400/5 px-4 py-3 text-sm text-slate-300 transition group-hover:bg-blue-500/8 ${alignClass[column.align ?? 'left']}`}
                    >
                      {column.render(row, index)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-sm text-slate-500">
                  {emptyText}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default DataTable
