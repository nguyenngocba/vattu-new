import type { ReactNode } from 'react'
import { X } from 'lucide-react'

type ModalProps = {
  title: string
  children: ReactNode
  footer: ReactNode
  onClose: () => void
  size?: 'md' | 'lg' | 'xl'
}

const sizeClass = {
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-6xl',
}

const Modal = ({ title, children, footer, onClose, size = 'md' }: ModalProps) => {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/55 p-4 backdrop-blur-sm">
      <section className={`w-full ${sizeClass[size]} overflow-hidden rounded-2xl border border-cyan-400/15 bg-[#061827] shadow-[0_28px_100px_rgba(0,0,0,.55)]`}>
        <header className="flex items-center justify-between border-b border-cyan-400/10 px-5 py-4">
          <h2 className="text-lg font-black text-white">{title}</h2>
          <button className="grid h-9 w-9 place-items-center rounded-xl border border-cyan-400/10 text-slate-400 hover:text-white" onClick={onClose}>
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="max-h-[70vh] overflow-auto p-5">{children}</div>
        <footer className="flex justify-end gap-2 border-t border-cyan-400/10 px-5 py-4">{footer}</footer>
      </section>
    </div>
  )
}

export default Modal
