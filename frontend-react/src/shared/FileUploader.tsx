import { Paperclip } from 'lucide-react'
import { useState } from 'react'
import { type UploadedFile, uploadTempFiles } from '../services/api'

type FileUploaderProps = {
  type: string
  files: UploadedFile[]
  onChange: (files: UploadedFile[]) => void
}

const FileUploader = ({ type, files, onChange }: FileUploaderProps) => {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const upload = async (fileList: FileList | null) => {
    if (!fileList?.length) return
    setUploading(true)
    setError('')
    try {
      const uploaded = await uploadTempFiles(fileList, type)
      onChange([...files, ...uploaded])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload file thất bại')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="rounded-xl border border-cyan-400/10 bg-slate-950/35 p-3">
      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-cyan-400/20 px-3 py-3 text-sm font-bold text-slate-300 hover:border-blue-400/40">
        <Paperclip className="h-4 w-4" />
        {uploading ? 'Đang tải file...' : 'Thêm file đính kèm'}
        <input
          type="file"
          multiple
          className="hidden"
          onChange={(event) => {
            upload(event.target.files)
            event.target.value = ''
          }}
        />
      </label>
      {error ? <div className="mt-3 rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-200">{error}</div> : null}
      {files.length ? (
        <div className="mt-3 grid gap-2">
          {files.map((file) => (
            <div key={file.path} className="flex items-center justify-between gap-3 rounded-lg bg-cyan-400/5 px-3 py-2 text-xs text-slate-300">
              <a href={file.path} target="_blank" className="min-w-0 truncate text-blue-200" rel="noreferrer">{file.name}</a>
              <button type="button" className="text-red-300" onClick={() => onChange(files.filter((item) => item.path !== file.path))}>Bỏ</button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export default FileUploader
