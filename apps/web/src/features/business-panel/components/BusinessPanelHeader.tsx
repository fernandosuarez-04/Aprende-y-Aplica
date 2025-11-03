'use client'

import { Menu } from 'lucide-react'
import { UserDropdown } from '@/core/components/UserDropdown'

interface BusinessPanelHeaderProps {
  onMenuClick: () => void
  title: string
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

export function BusinessPanelHeader({ onMenuClick, title, isCollapsed, onToggleCollapse }: BusinessPanelHeaderProps) {
  return (
    <header className="bg-gradient-to-r from-carbon-800/95 to-carbon-700/95 backdrop-blur-md shadow-lg border-b border-carbon-600/50 w-full sticky top-0 z-30">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side */}
          <div className="flex items-center gap-4">
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-lg text-carbon-300 hover:text-white hover:bg-carbon-700 transition-colors"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center">
              <h1 
                className="text-xl font-bold bg-clip-text text-transparent"
                style={{
                  backgroundImage: `linear-gradient(to right, var(--org-primary-button-color, #3b82f6), var(--org-secondary-button-color, #10b981))`
                }}
              >
                {title}
              </h1>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            {/* User Menu */}
            <UserDropdown />
          </div>
        </div>
      </div>
    </header>
  )
}

