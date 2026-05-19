import { AlertTriangle, Boxes, Component, Factory, PackageCheck } from 'lucide-react'
import {
  formatCompactMoney,
  formatMoney,
  formatNumber,
  numberValue,
  type Material,
  type Transaction,
} from '../services/api'
import { useSteelTrackData } from '../services/useSteelTrackData'
import DataState from '../shared/DataState'
import DataTable from '../shared/DataTable'
import PageHeader from '../shared/PageHeader'
import StatCard from '../shared/StatCard'

const transactionAmount = (txn: Transaction) => numberValue(txn.totalAmount ?? txn.total_amount)

const DashboardPage = () => {
  const { data, isLoading, error } = useSteelTrackData()

  if (isLoading || error || !data) return <DataState isLoading={isLoading} error={error} />

  const inventoryValue = data.materials.reduce((sum, material) => sum + numberValue(material.qty) * numberValue(material.cost), 0)
  const structureValue = data.structures.reduce((sum, structure) => sum + numberValue(structure.qty) * numberValue(structure.cost), 0)
  const stockQty = data.materials.reduce((sum, material) => sum + numberValue(material.qty), 0)
  const structureQty = data.structures.reduce((sum, structure) => sum + numberValue(structure.qty), 0)
  const lowStock = data.materials.filter((material) => numberValue(material.qty) <= numberValue(material.low)).length
  const recentTransactions = [...data.transactions]
    .sort((a, b) => new Date(b.datetime || b.date || '').getTime() - new Date(a.datetime || a.date || '').getTime())
    .slice(0, 8)

  const topMaterials = [...data.materials]
    .sort((a, b) => numberValue(b.qty) * numberValue(b.cost) - numberValue(a.qty) * numberValue(a.cost))
    .slice(0, 6)

  return (
    <>
      <PageHeader
        eyebrow="Overview"
        title="Dashboard vận hành"
        description="Tổng quan vận hành kho vật tư, cấu kiện, công trình, nhà cung cấp và giao dịch từ dữ liệu thật."
      />

      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-5">
        <StatCard icon={Boxes} label="Tổng giá trị tồn" value={formatCompactMoney(inventoryValue + structureValue)} helper="Vật tư + cấu kiện" tone="blue" />
        <StatCard icon={PackageCheck} label="Tổng tồn kho" value={formatNumber(stockQty + structureQty)} helper={`${data.materials.length} vật tư · ${data.structures.length} cấu kiện`} tone="green" />
        <StatCard icon={AlertTriangle} label="Sắp hết hàng" value={formatNumber(lowStock)} helper="Theo ngưỡng tồn tối thiểu" tone="red" />
        <StatCard icon={Factory} label="Công trình" value={formatNumber(data.projects.length)} helper="Danh sách công trình hiện có" tone="purple" />
        <StatCard icon={Component} label="Cấu kiện" value={formatNumber(data.structures.length)} helper={formatNumber(structureQty) + ' tổng tồn'} tone="amber" />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.25fr_.75fr]">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-black text-white">Giao dịch gần đây</h2>
            <span className="text-xs font-bold uppercase tracking-[.16em] text-slate-500">{recentTransactions.length} dòng</span>
          </div>
          <DataTable
            rows={recentTransactions}
            columns={[
              { key: 'time', header: 'Thời gian', render: (row) => new Date(row.datetime || row.date || '').toLocaleDateString('vi-VN') },
              { key: 'type', header: 'Loại', render: (row) => row.type || '—' },
              { key: 'qty', header: 'SL', align: 'right', render: (row) => formatNumber(row.qty, 3) },
              { key: 'value', header: 'Giá trị', align: 'right', render: (row) => formatMoney(transactionAmount(row)) },
            ]}
          />
        </section>
        <section className="rounded-2xl border border-cyan-400/10 bg-[#061827] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-black text-white">Tình trạng hệ thống</h2>
            <span className="text-xs font-bold uppercase tracking-[.16em] text-slate-500">Live data</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ['Vật tư', data.materials.length, 'mã đang quản lý'],
              ['Nhà cung cấp', data.suppliers.length, 'đối tác'],
              ['Công trình', data.projects.length, 'dự án'],
              ['Cấu kiện', data.structures.length, 'loại cấu kiện'],
              ['Giao dịch', data.transactions.length, 'phiếu phát sinh'],
              ['Sắp hết', lowStock, 'mặt hàng cần chú ý'],
            ].map(([label, value, helper]) => (
              <div className="rounded-xl border border-cyan-400/10 bg-slate-950/35 p-3" key={label}>
                <small className="text-xs font-bold uppercase tracking-[.14em] text-slate-500">{label}</small>
                <strong className="mt-1 block text-2xl text-white">{formatNumber(value as number)}</strong>
                <span className="text-xs text-slate-500">{helper}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-black text-white">Top vật tư theo giá trị tồn</h2>
          <span className="text-xs font-bold uppercase tracking-[.16em] text-slate-500">Inventory insight</span>
        </div>
        <DataTable<Material>
          rows={topMaterials}
          columns={[
            { key: 'name', header: 'Vật tư', render: (row) => <strong className="text-slate-100">{row.name}</strong> },
            { key: 'cat', header: 'Nhóm', render: (row) => row.cat || '—' },
            { key: 'qty', header: 'Tồn', align: 'right', render: (row) => `${formatNumber(row.qty, 3)} ${row.unit || ''}` },
            { key: 'cost', header: 'Đơn giá', align: 'right', render: (row) => formatMoney(row.cost) },
            { key: 'value', header: 'Giá trị', align: 'right', render: (row) => formatMoney(numberValue(row.qty) * numberValue(row.cost)) },
          ]}
        />
      </div>
    </>
  )
}

export default DashboardPage
