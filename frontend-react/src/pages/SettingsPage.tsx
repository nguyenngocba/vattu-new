import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { formatNumber, saveCategories, saveUnits, type User } from '../services/api'
import { useSteelTrackData } from '../services/useSteelTrackData'
import DataState from '../shared/DataState'
import DataTable from '../shared/DataTable'
import Modal from '../shared/Modal'
import PageHeader from '../shared/PageHeader'

const SettingsPage = () => {
  const { data, isLoading, error } = useSteelTrackData()
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<'categories' | 'units' | null>(null)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  if (isLoading || error || !data) return <DataState isLoading={isLoading} error={error} />

  const openEdit = (type: 'categories' | 'units') => {
    setEditing(type)
    setDraft((type === 'categories' ? data.categories || [] : data.units || []).join('\n'))
  }

  const submit = async () => {
    if (!editing) return
    const values = draft.split('\n').map((item) => item.trim()).filter(Boolean)
    setSaving(true)
    setNotice(null)
    try {
      if (editing === 'categories') await saveCategories(values)
      if (editing === 'units') await saveUnits(values)
      await queryClient.invalidateQueries({ queryKey: ['steeltrack-data'] })
      setNotice({ type: 'success', text: editing === 'categories' ? 'Đã lưu danh mục vật tư.' : 'Đã lưu đơn vị tính.' })
      setEditing(null)
    } catch (err) {
      setNotice({ type: 'error', text: err instanceof Error ? err.message : 'Không lưu được cấu hình' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="Hệ thống"
        description="Theo dõi người dùng và chỉnh danh mục vật tư, đơn vị tính dùng chung cho toàn hệ thống."
      />
      <div className="grid gap-4 md:grid-cols-5">
        {[
          ['Vật tư', data.materials.length],
          ['Công trình', data.projects.length],
          ['Nhà cung cấp', data.suppliers.length],
          ['Cấu kiện', data.structures.length],
          ['Users', data.users?.length || 0],
        ].map(([label, value]) => (
          <div className="rounded-2xl border border-cyan-400/10 bg-[#061827] p-4" key={label}>
            <small className="text-slate-500">{label}</small>
            <strong className="block text-2xl text-white">{formatNumber(value as number)}</strong>
          </div>
        ))}
      </div>
      {notice ? (
        <div className={`mt-4 rounded-xl border px-4 py-3 text-sm font-bold ${notice.type === 'success' ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200' : 'border-red-400/20 bg-red-500/10 text-red-200'}`}>
          {notice.text}
        </div>
      ) : null}

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-black text-white">Người dùng</h2>
            <span className="text-xs font-bold uppercase tracking-[.16em] text-slate-500">Tài khoản hệ thống</span>
          </div>
          <DataTable<User>
            rows={data.users || []}
            columns={[
              { key: 'name', header: 'Tên', render: (row) => <strong className="text-slate-100">{row.name}</strong> },
              { key: 'username', header: 'Tài khoản', render: (row) => row.username },
              { key: 'role', header: 'Vai trò', render: (row) => row.role },
            ]}
          />
        </section>

        <section className="grid gap-4">
          <div className="rounded-2xl border border-cyan-400/10 bg-[#061827] p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-white">Danh mục vật tư</h2>
              <button className="rounded-xl border border-cyan-400/10 px-3 py-2 text-sm font-black text-slate-300" onClick={() => openEdit('categories')}>Sửa</button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {(data.categories || []).map((item) => <span key={item} className="rounded-full bg-blue-500/12 px-3 py-1 text-xs font-bold text-blue-200">{item}</span>)}
            </div>
          </div>

          <div className="rounded-2xl border border-cyan-400/10 bg-[#061827] p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-white">Đơn vị tính</h2>
              <button className="rounded-xl border border-cyan-400/10 px-3 py-2 text-sm font-black text-slate-300" onClick={() => openEdit('units')}>Sửa</button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {(data.units || []).map((item) => <span key={item} className="rounded-full bg-emerald-500/12 px-3 py-1 text-xs font-bold text-emerald-200">{item}</span>)}
            </div>
          </div>
        </section>
      </div>

      {editing ? (
        <Modal
          title={editing === 'categories' ? 'Sửa danh mục vật tư' : 'Sửa đơn vị tính'}
          onClose={() => setEditing(null)}
          footer={(
            <>
              <button className="rounded-xl border border-cyan-400/10 px-4 py-2 text-sm font-black text-slate-300" onClick={() => setEditing(null)}>Hủy</button>
              <button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white disabled:opacity-50" disabled={saving} onClick={submit}>Lưu</button>
            </>
          )}
        >
          <p className="mb-3 text-sm text-slate-400">Mỗi dòng là một giá trị. Lưu sẽ thay toàn bộ danh sách hiện tại.</p>
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            className="min-h-72 w-full rounded-xl border border-cyan-400/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none"
          />
        </Modal>
      ) : null}
    </>
  )
}

export default SettingsPage
