import { useState } from 'react'
import { LockKeyhole, UserRound } from 'lucide-react'
import { login } from '../services/api'
import { useAuthStore } from '../stores/authStore'

const LoginPage = () => {
  const setUser = useAuthStore((state) => state.setUser)
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const user = await login(username, password)
      setUser(user)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng nhập không thành công')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="grid min-h-screen place-items-center overflow-hidden bg-[#020b14] p-6 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(31,122,255,.22),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(16,185,129,.12),transparent_30%)]" />
      <form onSubmit={submit} className="relative w-full max-w-md rounded-3xl border border-cyan-400/15 bg-[#061827]/95 p-7 shadow-[0_30px_120px_rgba(0,0,0,.6)]">
        <p className="text-xs font-black uppercase tracking-[.22em] text-cyan-300">SteelTrack Next</p>
        <h1 className="mt-3 text-3xl font-black">Đăng nhập</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">Frontend React mới dùng tài khoản backend cũ. Hệ cũ vẫn chạy độc lập.</p>

        <label className="mt-6 block">
          <span className="mb-2 block text-xs font-black uppercase tracking-[.14em] text-slate-500">Tài khoản</span>
          <div className="flex items-center gap-2 rounded-xl border border-cyan-400/10 bg-slate-950/60 px-4 py-3">
            <UserRound className="h-4 w-4 text-slate-500" />
            <input value={username} onChange={(event) => setUsername(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
          </div>
        </label>

        <label className="mt-4 block">
          <span className="mb-2 block text-xs font-black uppercase tracking-[.14em] text-slate-500">Mật khẩu</span>
          <div className="flex items-center gap-2 rounded-xl border border-cyan-400/10 bg-slate-950/60 px-4 py-3">
            <LockKeyhole className="h-4 w-4 text-slate-500" />
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
          </div>
        </label>

        {error ? <div className="mt-4 rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">{error}</div> : null}

        <button disabled={submitting || !username || !password} className="mt-6 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white disabled:opacity-50">
          {submitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
      </form>
    </main>
  )
}

export default LoginPage
