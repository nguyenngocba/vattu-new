type FormFieldProps = {
  label: string
  value: string
  type?: string
  placeholder?: string
  onChange: (value: string) => void
}

const FormField = ({ label, value, type = 'text', placeholder, onChange }: FormFieldProps) => {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-[.14em] text-slate-500">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-cyan-400/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-blue-400/45"
      />
    </label>
  )
}

export default FormField
