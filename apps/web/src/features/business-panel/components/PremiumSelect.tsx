'use client'

import * as Select from '@radix-ui/react-select'
import { ChevronDown, Check } from 'lucide-react'
import { useState } from 'react'

interface Option {
  value: string
  label: string
}

interface PremiumSelectProps {
  value: string
  onChange?: (value: string) => void
  onValueChange?: (value: string) => void
  options: Option[]
  placeholder?: string
  icon?: React.ReactNode
  className?: string
}

export function PremiumSelect({
  value,
  onChange,
  onValueChange,
  options,
  placeholder = 'Seleccionar...',
  icon,
  className = ''
}: PremiumSelectProps) {
  const [open, setOpen] = useState(false)
  const selectedOption = options.find(opt => opt.value === value)
  
  // Usar onValueChange si está disponible, sino onChange
  const handleValueChange = onValueChange || onChange || (() => {})

  return (
    <Select.Root value={value} onValueChange={handleValueChange} onOpenChange={setOpen}>
      <Select.Trigger
        className={`group relative w-full pl-10 pr-9 py-2.5 bg-carbon-900/20 border border-carbon-700/5 rounded-lg font-body text-white text-sm focus:outline-none focus:ring-0 focus:border-primary/40 hover:border-carbon-600/10 hover:bg-carbon-900/30 transition-all duration-200 cursor-pointer flex items-center justify-between ${className}`}
      >
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          {icon && (
            <span className="flex-shrink-0 text-carbon-500 group-hover:text-carbon-400 transition-colors">
              {icon}
            </span>
          )}
          <Select.Value className="truncate text-carbon-100">
            {selectedOption?.label || placeholder}
          </Select.Value>
        </div>
        <Select.Icon className="flex-shrink-0">
          <ChevronDown 
            className={`w-4 h-4 text-carbon-500 group-hover:text-carbon-400 transition-all duration-200 ${open ? 'rotate-180' : ''}`} 
          />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          position="popper"
          sideOffset={6}
          className="min-w-[var(--radix-select-trigger-width)] bg-carbon-900/98 backdrop-blur-xl border border-carbon-700/20 rounded-lg shadow-2xl overflow-hidden"
          style={{ zIndex: 9999 }}
        >
          <Select.Viewport className="p-1.5">
            {options.map((option, index) => (
              <Select.Item
                key={option.value}
                value={option.value}
                className="relative flex items-center px-3 py-2.5 font-body text-sm text-carbon-100 rounded-md cursor-pointer outline-none hover:bg-primary/8 focus:bg-primary/8 data-[highlighted]:bg-primary/8 data-[state=checked]:bg-primary/10 data-[state=checked]:text-white transition-colors duration-150"
              >
                <Select.ItemText className="flex-1">{option.label}</Select.ItemText>
                <Select.ItemIndicator className="absolute right-3 flex items-center">
                  <Check className="w-4 h-4 text-primary" />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  )
}

