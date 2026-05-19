import type { LucideIcon } from 'lucide-react'

type StatCardProps = {
  icon: LucideIcon
  label: string
  value: string
  helper: string
  tone?: 'blue' | 'green' | 'amber' | 'purple' | 'red'
}

const toneMap = {
  blue: 'from-blue-500/20 text-blue-300 shadow-blue-500/15',
  green: 'from-emerald-500/20 text-emerald-300 shadow-emerald-500/15',
  amber: 'from-amber-500/20 text-amber-300 shadow-amber-500/15',
  purple: 'from-violet-500/20 text-violet-300 shadow-violet-500/15',
  red: 'from-red-500/20 text-red-300 shadow-red-500/15',
}

const StatCard = ({ icon: Icon, label, value, helper, tone = 'blue' }: StatCardProps) => {
  return (
    <article className="rounded-2xl border border-cyan-400/10 bg-[#061827] p-5 shadow-[0_18px_60px_rgba(0,0,0,.22)] transition hover:border-cyan-300/30 hover:shadow-[0_0_38px_rgba(31,122,255,.14)]">
      <div className="flex items-start justify-between gap-4">
        <div className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${toneMap[tone]} shadow-lg`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="h-8 w-20 rounded-full bg-gradient-to-r from-transparent via-cyan-300/20 to-transparent opacity-70" />
      </div>
      <p className="mt-5 text-xs font-black uppercase tracking-[.16em] text-slate-400">{label}</p>
      <strong className="mt-2 block text-3xl font-black text-white">{value}</strong>
      <span className="mt-2 block text-sm text-slate-500">{helper}</span>
    </article>
  )
}

export default StatCard
