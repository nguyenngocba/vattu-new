type DataStateProps = {
  isLoading: boolean
  error: unknown
}

const DataState = ({ isLoading, error }: DataStateProps) => {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-cyan-400/10 bg-[#061827] p-6 text-sm text-slate-400">
        Đang tải dữ liệu từ backend cũ...
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-6 text-sm text-red-200">
        Không tải được dữ liệu: {error instanceof Error ? error.message : 'Lỗi không xác định'}
      </div>
    )
  }

  return null
}

export default DataState
