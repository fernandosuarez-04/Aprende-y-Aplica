import { EMOJI_CATEGORIES, type EmojiCategory } from './types'

interface EmojiPickerProps {
  activeCategory: EmojiCategory
  onCategoryChange: (category: EmojiCategory) => void
  onEmojiSelect: (emoji: string) => void
  primaryColor: string
  isDark: boolean
}

export function EmojiPicker({
  activeCategory,
  onCategoryChange,
  onEmojiSelect,
  primaryColor,
  isDark
}: EmojiPickerProps) {
  return (
    <div
      className="absolute bottom-10 right-0 rounded-xl shadow-xl z-50 w-80 overflow-hidden border"
      style={{
        backgroundColor: isDark ? '#1E2329' : '#FFFFFF',
        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
      }}
    >
      {/* Tabs de categorías */}
      <div
        className="flex items-center border-b px-2"
        style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
      >
        {(Object.keys(EMOJI_CATEGORIES) as EmojiCategory[]).map((categoryKey) => {
          const category = EMOJI_CATEGORIES[categoryKey]
          const isActive = activeCategory === categoryKey
          return (
            <button
              key={categoryKey}
              onClick={() => onCategoryChange(categoryKey)}
              className="flex-1 py-2 px-1 flex items-center justify-center transition-colors relative"
              style={{
                color: isActive
                  ? primaryColor
                  : (isDark ? '#FFFFFF' : '#64748B'),
                backgroundColor: isActive
                  ? (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)')
                  : 'transparent'
              }}
            >
              <span className="text-base">{category.icon}</span>
              {isActive && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ backgroundColor: primaryColor }}
                />
              )}
            </button>
          )
        })}
      </div>

      {/* Grid de emojis */}
      <div className="p-3 max-h-64 overflow-y-auto">
        <div className="grid grid-cols-10 gap-1">
          {EMOJI_CATEGORIES[activeCategory].emojis.map((emoji, index) => (
            <button
              key={index}
              onClick={() => onEmojiSelect(emoji)}
              className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-base"
              title={emoji}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
