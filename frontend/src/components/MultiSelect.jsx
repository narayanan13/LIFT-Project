import React, { useState, useRef, useEffect } from 'react'

export default function MultiSelect({
  options = [],
  value = [],
  onChange,
  placeholder = 'Select...',
  labelKey = 'name',
  valueKey = 'id',
  disabled = false
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef(null)

  const selectedItems = options.filter(opt => value.includes(opt[valueKey]))
  const filteredOptions = options.filter(opt =>
    opt[labelKey].toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleOption = (optionValue) => {
    if (value.includes(optionValue)) {
      onChange(value.filter(v => v !== optionValue))
    } else {
      onChange([...value, optionValue])
    }
  }

  const removeItem = (e, itemValue) => {
    e.stopPropagation()
    onChange(value.filter(v => v !== itemValue))
  }

  return (
    <div ref={containerRef} className="relative">
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`min-h-[42px] p-2 border rounded bg-white flex flex-wrap gap-1 items-center cursor-pointer ${
          disabled ? 'bg-gray-100 cursor-not-allowed' : ''
        }`}
      >
        {selectedItems.length === 0 && (
          <span className="text-gray-400">{placeholder}</span>
        )}
        {selectedItems.map(item => (
          <span
            key={item[valueKey]}
            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
          >
            {item[labelKey]}
            {!disabled && (
              <button
                type="button"
                onClick={(e) => removeItem(e, item[valueKey])}
                className="text-blue-600 hover:text-blue-800"
              >
                x
              </button>
            )}
          </span>
        ))}
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded shadow-lg max-h-60 overflow-auto">
          <div className="p-2 border-b">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full p-2 border rounded text-sm"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-gray-500 text-center">No options found</div>
            ) : (
              filteredOptions.map(option => (
                <div
                  key={option[valueKey]}
                  onClick={() => toggleOption(option[valueKey])}
                  className={`p-2 cursor-pointer hover:bg-gray-100 flex items-center gap-2 ${
                    value.includes(option[valueKey]) ? 'bg-blue-50' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={value.includes(option[valueKey])}
                    onChange={() => {}}
                    className="pointer-events-none"
                  />
                  <span>{option[labelKey]}</span>
                  {option.email && (
                    <span className="text-gray-400 text-sm">({option.email})</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
