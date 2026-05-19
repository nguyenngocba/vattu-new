type SelectOption = {
  value: string
  label: string
}

type SelectFieldProps = {
  label: string
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
}

const SelectField = ({ label, value, options, onChange }: SelectFieldProps) => {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-[.14em] text-slate-500">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-cyan-400/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none focus:border-blue-400/45"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  )
}

export default SelectField
