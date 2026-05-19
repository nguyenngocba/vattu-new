import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { deleteProject, formatMoney, formatNumber, makeId, numberValue, saveProject, type Project } from '../services/api'
import { useSteelTrackData } from '../services/useSteelTrackData'
import DataState from '../shared/DataState'
import DataTable from '../shared/DataTable'
import FormField from '../shared/FormField'
import Modal from '../shared/Modal'
import PageHeader from '../shared/PageHeader'
import { useUiStore } from '../stores/uiStore'
import ExcelImportModal from '../shared/ExcelImportModal'
import { exportWorkbook } from '../services/excel'

type ProjectDraft = {
  id: string
  name: string
  budget: string
  spent: string
}

const emptyProject = (): ProjectDraft => ({
  id: makeId('P'),
  name: '',
  budget: '0',
  spent: '0',
})

const ProjectsPage = () => {
  const { data, isLoading, error } = useSteelTrackData()
  const selectEntity = useUiStore((state) => state.selectEntity)
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState<ProjectDraft | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  if (isLoading || error || !data) return <DataState isLoading={isLoading} error={error} />

  const rows = [...data.projects].sort((a, b) => a.name.localeCompare(b.name, 'vi')).slice(0, 60)
  const openEdit = (project: Project) => setDraft({
    id: project.id,
    name: project.name,
    budget: String(project.budget || 0),
    spent: String(project.spent || 0),
  })
  const submit = async () => {
    if (!draft?.name.trim()) return
    setSaving(true)
    setNotice(null)
    try {
      await saveProject({ id: draft.id, name: draft.name, budget: numberValue(draft.budget), spent: numberValue(draft.spent) })
      await queryClient.invalidateQueries({ queryKey: ['steeltrack-data'] })
      setDraft(null)
      setNotice({ type: 'success', text: 'Đã lưu công trình.' })
    } catch (err) {
      setNotice({ type: 'error', text: err instanceof Error ? err.message : 'Không lưu được công trình' })
    } finally {
      setSaving(false)
    }
  }
  const remove = async (project: Project) => {
    if (!window.confirm(`Xóa công trình "${project.name}"?`)) return
    setNotice(null)
    try {
      await deleteProject(project.id)
      await queryClient.invalidateQueries({ queryKey: ['steeltrack-data'] })
      setNotice({ type: 'success', text: 'Đã xóa công trình.' })
    } catch (err) {
      setNotice({ type: 'error', text: err instanceof Error ? err.message : 'Không xóa được công trình' })
    }
  }
  const importProjects = async (items: Project[]) => {
    setSaving(true)
    setNotice(null)
    try {
      for (const item of items) await saveProject(item)
      await queryClient.invalidateQueries({ queryKey: ['steeltrack-data'] })
      setImportOpen(false)
      setNotice({ type: 'success', text: `Đã import ${formatNumber(items.length)} công trình.` })
    } catch (err) {
      setNotice({ type: 'error', text: err instanceof Error ? err.message : 'Import công trình thất bại' })
    } finally {
      setSaving(false)
    }
  }
  const exportProjects = async () => {
    setNotice(null)
    try {
      await exportWorkbook(
        `danh_sach_cong_trinh_${new Date().toISOString().slice(0, 10)}.xlsx`,
        'Công trình',
        data.projects.map((project) => ({
          'Mã công trình': project.id,
          'Tên công trình': project.name,
          'Ngân sách': numberValue(project.budget),
          'Đã dùng': numberValue(project.spent),
          'Tỷ lệ dùng': numberValue(project.budget) ? (numberValue(project.spent) / numberValue(project.budget)) * 100 : 0,
        })),
      )
      setNotice({ type: 'success', text: 'Đã xuất Excel công trình.' })
    } catch (err) {
      setNotice({ type: 'error', text: err instanceof Error ? err.message : 'Xuất Excel thất bại' })
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Projects"
        title="Công trình"
        description={`Đang hiển thị ${rows.length}/${data.projects.length} công trình từ backend cũ.`}
        actions={(
          <>
            <button className="rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-2 text-sm font-black text-cyan-200" onClick={() => setImportOpen(true)}>Import Excel</button>
            <button className="rounded-xl border border-cyan-400/10 px-4 py-2 text-sm font-black text-slate-300" onClick={exportProjects}>Export Excel</button>
            <button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white" onClick={() => setDraft(emptyProject())}>+ Thêm công trình</button>
          </>
        )}
      />
      <DataTable<Project>
        rows={rows}
        onRowClick={(row) => selectEntity('project', row.id)}
        columns={[
          { key: 'name', header: 'Công trình', render: (row) => <strong className="text-violet-200">{row.name}</strong> },
          { key: 'budget', header: 'Ngân sách', align: 'right', render: (row) => formatMoney(row.budget) },
          { key: 'spent', header: 'Đã dùng', align: 'right', render: (row) => formatMoney(row.spent) },
          {
            key: 'progress',
            header: 'Tỷ lệ',
            align: 'right',
            render: (row) => `${formatNumber(numberValue(row.budget) ? (numberValue(row.spent) / numberValue(row.budget)) * 100 : 0, 1)}%`,
          },
          {
            key: 'actions',
            header: 'Thao tác',
            align: 'right',
            render: (row) => (
              <div className="flex justify-end gap-2" onClick={(event) => event.stopPropagation()}>
                <button className="rounded-lg border border-cyan-400/10 px-3 py-1 text-xs font-black text-slate-300" onClick={() => openEdit(row)}>Sửa</button>
                <button className="rounded-lg border border-red-400/20 px-3 py-1 text-xs font-black text-red-300" onClick={() => remove(row)}>Xóa</button>
              </div>
            ),
          },
        ]}
      />
      {notice ? (
        <div className={`mt-4 rounded-xl border px-4 py-3 text-sm font-bold ${notice.type === 'success' ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200' : 'border-red-400/20 bg-red-500/10 text-red-200'}`}>
          {notice.text}
        </div>
      ) : null}
      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <section className="rounded-2xl border border-cyan-400/10 bg-[#061827] p-5">
          <h2 className="mb-4 text-lg font-black text-white">Cảnh báo ngân sách</h2>
          <div className="space-y-3">
            {rows
              .filter((project) => numberValue(project.budget) > 0)
              .sort((a, b) => (numberValue(b.spent) / numberValue(b.budget)) - (numberValue(a.spent) / numberValue(a.budget)))
              .slice(0, 6)
              .map((project) => {
                const rate = numberValue(project.budget) ? numberValue(project.spent) / numberValue(project.budget) * 100 : 0
                return (
                  <div className="rounded-xl border border-cyan-400/10 bg-slate-950/35 p-3" key={project.id}>
                    <div className="flex items-center justify-between gap-3">
                      <strong className="text-sm text-slate-100">{project.name}</strong>
                      <span className={rate > 100 ? 'text-sm font-black text-red-300' : 'text-sm font-black text-cyan-200'}>{formatNumber(rate, 1)}%</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-slate-900">
                      <div className={`h-2 rounded-full ${rate > 100 ? 'bg-red-400' : 'bg-blue-400'}`} style={{ width: `${Math.min(rate, 100)}%` }} />
                    </div>
                    <p className="mt-2 text-xs text-slate-500">{formatMoney(project.spent)} / {formatMoney(project.budget)}</p>
                  </div>
                )
              })}
          </div>
        </section>
        <section>
          <h2 className="mb-3 text-lg font-black text-white">Giao dịch công trình gần đây</h2>
          <DataTable
            rows={[...data.transactions]
              .filter((txn) => txn.projectId || txn.project_id)
              .sort((a, b) => new Date(b.datetime || b.date || '').getTime() - new Date(a.datetime || a.date || '').getTime())
              .slice(0, 8)}
            columns={[
              { key: 'date', header: 'Ngày', render: (row) => new Date(row.datetime || row.date || '').toLocaleDateString('vi-VN') },
              { key: 'type', header: 'Loại', render: (row) => row.type || '—' },
              { key: 'project', header: 'Công trình', render: (row) => data.projects.find((project) => project.id === (row.projectId || row.project_id))?.name || row.projectId || row.project_id || '—' },
              { key: 'qty', header: 'SL', align: 'right', render: (row) => formatNumber(row.qty, 3) },
            ]}
          />
        </section>
      </div>
      {draft ? (
        <Modal
          title={rows.some((row) => row.id === draft.id) ? 'Sửa công trình' : 'Thêm công trình'}
          onClose={() => setDraft(null)}
          footer={(
            <>
              <button className="rounded-xl border border-cyan-400/10 px-4 py-2 text-sm font-black text-slate-300" onClick={() => setDraft(null)}>Hủy</button>
              <button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white disabled:opacity-50" disabled={saving || !draft.name.trim()} onClick={submit}>Lưu</button>
            </>
          )}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Tên công trình" value={draft.name} onChange={(name) => setDraft({ ...draft, name })} />
            <FormField label="Ngân sách" type="number" value={draft.budget} onChange={(budget) => setDraft({ ...draft, budget })} />
            <FormField label="Đã dùng" type="number" value={draft.spent} onChange={(spent) => setDraft({ ...draft, spent })} />
          </div>
        </Modal>
      ) : null}
      {importOpen ? <ExcelImportModal type="projects" data={data} saving={saving} onClose={() => setImportOpen(false)} onCommit={(items) => importProjects(items as Project[])} /> : null}
    </>
  )
}

export default ProjectsPage
