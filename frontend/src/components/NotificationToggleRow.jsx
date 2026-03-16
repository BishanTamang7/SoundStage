import React from 'react'

const NotificationToggleRow = ({
  label,
  description,
  checked,
  onChange,
  disabled = false,
  className = '',
}) => (
  <label
    className={`flex items-start justify-between gap-4 rounded-xl border p-4 transition ${
      disabled
        ? 'cursor-not-allowed border-[#E5E7EB] opacity-70'
        : 'cursor-pointer border-[#E5E7EB] hover:border-[#C4B5FD]'
    } ${className}`}
  >
    <div>
      <p className="text-sm font-bold text-[#312E81]">{label}</p>
      <p className="mt-1 text-sm text-[#6B7280]">{description}</p>
    </div>
    <span
      className={`relative mt-1 inline-flex h-7 w-12 items-center rounded-full transition ${
        checked ? 'bg-[#7C3AED]' : 'bg-[#D1D5DB]'
      }`}
    >
      <input className="sr-only" type="checkbox" checked={checked} onChange={onChange} disabled={disabled} />
      <span
        className={`inline-block h-5 w-5 rounded-full bg-white shadow transition ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </span>
  </label>
)

export default NotificationToggleRow
