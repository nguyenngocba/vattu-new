import { useMemo, useState } from 'react'
import { formatCompactMoney, formatMoney, formatNumber, numberValue, type Transaction } from '../services/api'
import { useSteelTrackData } from '../services/useSteelTrackData'
import DataState from '../shared/DataState'
import DataTable from '../shared/DataTable'
import PageHeader from '../shared/PageHeader'

const txnAmount = (txn: Transaction) => numberValue(txn.totalAmount ?? txn.total_amount)
const txnProjectId = (txn: Transaction) => txn.projectId ?? txn.project_id ?? ''
const txnSupplierId = (txn: Transaction) => txn.supplierId ?? txn.supplier_id ?? ''
const txnDate = (txn: Transaction) => (txn.datetime || txn.date || '').slice(0, 10)
const monthKey = (txn: Transaction) => (txn.datetime || txn.date || '').slice(0, 7)

const AnalyticsPage = () => {
  const { data, isLoading, error } = useSteelTrackData()
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const filteredTransactions = useMemo(() => {
    const transactions = data?.transactions || []
    return transactions.filter((txn) => {
      const date = txnDate(txn)
      if (fromDate && date < fromDate) return false
      if (toDate && date > toDate) return false
      return true
    })
  }, [data?.transactions, fromDate, toDate])

  if (isLoading || error || !data) return <DataState isLoading={isLoading} error={error} />

  const importValue = filteredTransactions
    .filter((txn) => txn.type === 'purchase' || txn.type === 'produce')
    .reduce((sum, txn) => sum + txnAmount(txn), 0)
  const exportValue = filteredTransactions
    .filter((txn) => txn.type === 'usage' || txn.type === 'structure_export')
    .reduce((sum, txn) => sum + txnAmount(txn), 0)
  const returnValue = filteredTransactions
    .filter((txn) => txn.type === 'return' || txn.type === 'structure_return')
    .reduce((sum, txn) => sum + txnAmount(txn), 0)
  const transferCount = filteredTransactions.filter((txn) => txn.type === 'transfer_sw' || txn.type === 'return_from_sw').length

  const monthRows = Object.values(filteredTransactions.reduce<Record<string, { month: string; importValue: number; exportValue: number; returnValue: number; count: number }>>((map, txn) => {
    const key = monthKey(txn) || 'Không ngày'
    map[key] ||= { month: key, importValue: 0, exportValue: 0, returnValue: 0, count: 0 }
    map[key].count += 1
    if (txn.type === 'purchase' || txn.type === 'produce') map[key].importValue += txnAmount(txn)
    if (txn.type === 'usage' || txn.type === 'structure_export') map[key].exportValue += txnAmount(txn)
    if (txn.type === 'return' || txn.type === 'structure_return') map[key].returnValue += txnAmount(txn)
    return map
  }, {})).sort((a, b) => b.month.localeCompare(a.month)).slice(0, 18)

  const categoryRows = Object.values(data.materials.reduce<Record<string, { cat: string; count: number; qty: number; value: number; low: number }>>((map, material) => {
    const cat = material.cat || 'Khác'
    map[cat] ||= { cat, count: 0, qty: 0, value: 0, low: 0 }
    map[cat].count += 1
    map[cat].qty += numberValue(material.qty)
    map[cat].value += numberValue(material.qty) * numberValue(material.cost)
    if (numberValue(material.qty) <= numberValue(material.low)) map[cat].low += 1
    return map
  }, {})).sort((a, b) => b.value - a.value)

  const projectRows = data.projects
    .map((project) => ({
      ...project,
      usageValue: filteredTransactions.filter((txn) => txnProjectId(txn) === project.id).reduce((sum, txn) => sum + txnAmount(txn), 0),
      budgetRate: numberValue(project.budget) ? (numberValue(project.spent) / numberValue(project.budget)) * 100 : 0,
    }))
    .sort((a, b) => b.budgetRate - a.budgetRate)
    .slice(0, 10)

  const supplierRows = data.suppliers
    .map((supplier) => ({
      ...supplier,
      orderCount: filteredTransactions.filter((txn) => txnSupplierId(txn) === supplier.id && txn.type === 'purchase').length,
      importValue: filteredTransactions.filter((txn) => txnSupplierId(txn) === supplier.id && txn.type === 'purchase').reduce((sum, txn) => sum + txnAmount(txn), 0),
    }))
    .filter((supplier) => supplier.orderCount > 0 || supplier.importValue > 0)
    .sort((a, b) => b.importValue - a.importValue)
    .slice(0, 10)

  const maxMonthValue = Math.max(...monthRows.map((row) => Math.max(row.importValue, row.exportValue, row.returnValue)), 1)

  return (
    <>
      <PageHeader
        eyebrow="Analytics"
        title="Báo cáo & phân tích"
        description="Báo cáo React dùng dữ liệu thật từ backend cũ, có lọc thời gian và phân tích theo giao dịch, vật tư, công trình, nhà cung cấp."
      />

      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-cyan-400/10 bg-[#061827] p-3">
        <label className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Từ ngày</label>
        <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} className="rounded-xl border border-cyan-400/10 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none" />
        <label className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Đến ngày</label>
        <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} className="rounded-xl border border-cyan-400/10 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none" />
        <button className="rounded-xl border border-cyan-400/10 px-4 py-2 text-sm font-black text-slate-300" onClick={() => { setFromDate(''); setToDate('') }}>Xóa lọc</button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-cyan-400/10 bg-[#061827] p-5"><small className="text-slate-500">Giá trị nhập/sản xuất</small><strong className="block text-3xl text-emerald-200">{formatCompactMoney(importValue)}</strong><span className="text-xs text-slate-500">{formatMoney(importValue)}</span></div>
        <div className="rounded-2xl border border-cyan-400/10 bg-[#061827] p-5"><small className="text-slate-500">Giá trị xuất</small><strong className="block text-3xl text-blue-200">{formatCompactMoney(exportValue)}</strong><span className="text-xs text-slate-500">{formatMoney(exportValue)}</span></div>
        <div className="rounded-2xl border border-cyan-400/10 bg-[#061827] p-5"><small className="text-slate-500">Giá trị trả</small><strong className="block text-3xl text-amber-200">{formatCompactMoney(returnValue)}</strong><span className="text-xs text-slate-500">{formatMoney(returnValue)}</span></div>
        <div className="rounded-2xl border border-cyan-400/10 bg-[#061827] p-5"><small className="text-slate-500">Giao dịch CK</small><strong className="block text-3xl text-cyan-200">{formatNumber(transferCount)}</strong><span className="text-xs text-slate-500">Chuyển/trả kho CK</span></div>
      </div>

      <section className="mt-5 rounded-2xl border border-cyan-400/10 bg-[#061827] p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-black text-white">Biến động theo tháng</h2>
          <span className="text-xs font-bold uppercase tracking-[.16em] text-slate-500">{formatNumber(filteredTransactions.length)} giao dịch</span>
        </div>
        <div className="grid gap-3">
          {monthRows.map((row) => (
            <div className="grid gap-2 md:grid-cols-[86px_1fr_120px]" key={row.month}>
              <strong className="text-sm text-slate-200">{row.month}</strong>
              <div className="grid gap-1">
                <div className="h-2 rounded-full bg-slate-950/80"><div className="h-2 rounded-full bg-emerald-400" style={{ width: `${Math.max(3, row.importValue / maxMonthValue * 100)}%` }} /></div>
                <div className="h-2 rounded-full bg-slate-950/80"><div className="h-2 rounded-full bg-blue-400" style={{ width: `${Math.max(3, row.exportValue / maxMonthValue * 100)}%` }} /></div>
                <div className="h-2 rounded-full bg-slate-950/80"><div className="h-2 rounded-full bg-amber-400" style={{ width: `${Math.max(3, row.returnValue / maxMonthValue * 100)}%` }} /></div>
              </div>
              <span className="text-right text-xs text-slate-500">{formatNumber(row.count)} phiếu</span>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <section>
          <h2 className="mb-3 text-lg font-black text-white">Tồn kho theo nhóm vật tư</h2>
          <DataTable
            rows={categoryRows}
            columns={[
              { key: 'cat', header: 'Nhóm', render: (row) => <strong className="text-slate-100">{row.cat}</strong> },
              { key: 'count', header: 'SL mã', align: 'right', render: (row) => formatNumber(row.count) },
              { key: 'qty', header: 'Tồn', align: 'right', render: (row) => formatNumber(row.qty, 3) },
              { key: 'value', header: 'Giá trị', align: 'right', render: (row) => formatMoney(row.value) },
              { key: 'low', header: 'Sắp hết', align: 'right', render: (row) => formatNumber(row.low) },
            ]}
          />
        </section>
        <section>
          <h2 className="mb-3 text-lg font-black text-white">Công trình theo ngân sách</h2>
          <DataTable
            rows={projectRows}
            columns={[
              { key: 'name', header: 'Công trình', render: (row) => <strong className="text-violet-200">{row.name}</strong> },
              { key: 'budget', header: 'Ngân sách', align: 'right', render: (row) => formatMoney(row.budget) },
              { key: 'spent', header: 'Đã dùng', align: 'right', render: (row) => formatMoney(row.spent) },
              { key: 'rate', header: 'Tỷ lệ', align: 'right', render: (row) => <span className={row.budgetRate > 100 ? 'font-black text-red-300' : 'text-slate-300'}>{formatNumber(row.budgetRate, 1)}%</span> },
            ]}
          />
        </section>
      </div>

      <section className="mt-5">
        <h2 className="mb-3 text-lg font-black text-white">Top nhà cung cấp theo giá trị nhập</h2>
        <DataTable
          rows={supplierRows}
          columns={[
            { key: 'name', header: 'Nhà cung cấp', render: (row) => <strong className="text-emerald-200">{row.name}</strong> },
            { key: 'phone', header: 'Điện thoại', render: (row) => row.phone || '—' },
            { key: 'orders', header: 'Số lần nhập', align: 'right', render: (row) => formatNumber(row.orderCount) },
            { key: 'value', header: 'Giá trị nhập', align: 'right', render: (row) => formatMoney(row.importValue) },
          ]}
        />
      </section>
    </>
  )
}

export default AnalyticsPage
