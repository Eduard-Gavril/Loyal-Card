import { useState, useEffect } from 'react'

const NAMED_CODES = [
  { code: '+40', label: 'RO (+40)' },
  { code: '+39', label: 'IT (+39)' },
]

interface PhoneInputProps {
  value: string
  onChange: (fullNumber: string) => void
  placeholder?: string
}

export default function PhoneInput({ value, onChange, placeholder }: PhoneInputProps) {
  const [selectValue, setSelectValue] = useState('+40')  // '+40' | '+39' | 'other'
  const [customPrefix, setCustomPrefix] = useState('+')
  const [localNumber, setLocalNumber] = useState('')

  const activePrefix = selectValue === 'other' ? customPrefix : selectValue

  useEffect(() => {
    if (!value) return
    const match = NAMED_CODES.find(c => value.startsWith(c.code))
    if (match) {
      setSelectValue(match.code)
      setLocalNumber(value.slice(match.code.length))
    } else if (value.startsWith('+')) {
      setSelectValue('other')
      const digitsOnly = value.replace(/^\+(\d+?)(\d{7,})$/, (_, p, n) => {
        setCustomPrefix('+' + p)
        return n
      })
      if (digitsOnly !== value) setLocalNumber(digitsOnly)
      else setLocalNumber(value)
    } else {
      setLocalNumber(value)
    }
  }, [])

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    setSelectValue(val)
    const prefix = val === 'other' ? customPrefix : val
    onChange(prefix + localNumber)
  }

  const handleCustomPrefixChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value
    if (!val.startsWith('+')) val = '+' + val.replace(/\+/g, '')
    val = '+' + val.slice(1).replace(/\D/g, '')
    setCustomPrefix(val)
    onChange(val + localNumber)
  }

  const handleLocalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let num = e.target.value.replace(/\D/g, '')
    if (num.length > 10) num = num.slice(0, 10)
    setLocalNumber(num)
    // Strip leading trunk 0 only for E.164 emit (0712... → +40712...)
    const emitted = num.startsWith('0') ? num.slice(1) : num
    onChange(activePrefix + emitted)
  }

  const localPlaceholder = placeholder ?? (selectValue === '+40' ? '0712 345 678' : '712 345 678')

  return (
    <div className="cs-phone">
      <div className="cs-phone-pre">
        <select
          value={selectValue}
          onChange={handleSelectChange}
          className="cs-phone-sel"
          aria-label="Country code"
        >
          {NAMED_CODES.map(c => (
            <option key={c.code} value={c.code}>
              {c.label}
            </option>
          ))}
          <option value="other">Other</option>
        </select>
        {selectValue === 'other' && (
          <input
            type="text"
            value={customPrefix}
            onChange={handleCustomPrefixChange}
            className="cs-phone-custom"
            placeholder="+1"
            maxLength={5}
          />
        )}
      </div>

      <input
        type="tel"
        value={localNumber}
        onChange={handleLocalChange}
        placeholder={localPlaceholder}
        className="cs-phone-num"
        inputMode="numeric"
        maxLength={10}
      />
    </div>
  )
}
