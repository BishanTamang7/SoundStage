import React from 'react'

const PasswordField = ({
  id,
  label,
  name,
  value,
  visible,
  onChange,
  onToggle,
  inputClassName = '',
}) => (
  <div className="flex flex-col gap-2">
    <label className="text-sm font-bold text-[#312E81]" htmlFor={id}>
      {label}
    </label>
    <div className="relative">
      <input
        id={id}
        name={name}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        className={`w-full rounded-lg border border-[#D1D5DB] bg-white px-4 py-3 pr-16 text-sm text-[#312E81] outline-none transition focus:border-[#7C3AED] ${inputClassName}`}
      />
      <button
        className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#4F46E5]"
        type="button"
        onClick={onToggle}
      >
        {visible ? 'Hide' : 'Show'}
      </button>
    </div>
  </div>
)

export default PasswordField
