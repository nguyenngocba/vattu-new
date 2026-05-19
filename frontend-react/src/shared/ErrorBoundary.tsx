import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = {
  children: ReactNode
}

type State = {
  error: Error | null
}

class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('React runtime error:', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <main className="grid min-h-screen place-items-center bg-[#020b14] p-6 text-white">
        <section className="w-full max-w-2xl rounded-3xl border border-red-400/20 bg-[#061827] p-6 shadow-[0_28px_100px_rgba(0,0,0,.45)]">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-red-300">Runtime error</p>
          <h1 className="mt-3 text-2xl font-black">Màn hình React gặp lỗi</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            App cũ không bị ảnh hưởng. Hãy tải lại trang; nếu lỗi lặp lại, dùng nội dung bên dưới để debug.
          </p>
          <pre className="mt-4 max-h-64 overflow-auto rounded-xl border border-red-400/10 bg-slate-950/70 p-4 text-xs text-red-100">
            {this.state.error.message}
          </pre>
          <button className="mt-5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white" onClick={() => window.location.reload()}>
            Tải lại
          </button>
        </section>
      </main>
    )
  }
}

export default ErrorBoundary
