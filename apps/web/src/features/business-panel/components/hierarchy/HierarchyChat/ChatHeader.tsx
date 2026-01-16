import { Users, MessageSquare, MoreVertical } from 'lucide-react'
import type { HierarchyChatParticipant, HierarchyChatType } from '@/features/business-panel/types/hierarchy.types'

interface ChatHeaderProps {
  chatType: HierarchyChatType
  title: string
  participants: HierarchyChatParticipant[]
  primaryColor: string
  accentColor: string
}

export function ChatHeader({
  chatType,
  title,
  participants,
  primaryColor,
  accentColor
}: ChatHeaderProps) {
  return (
    <div
      className="flex items-center justify-between px-5 py-4"
      style={{
        background: `linear-gradient(135deg, ${primaryColor} 0%, ${accentColor} 100%)`
      }}
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
            {chatType === 'horizontal' ? (
              <Users className="w-5 h-5 text-white" />
            ) : (
              <MessageSquare className="w-5 h-5 text-white" />
            )}
          </div>
          <div
            className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 bg-emerald-500"
            style={{ borderColor: primaryColor }}
          />
        </div>

        <div>
          <h3 className="font-semibold text-sm" style={{ color: '#FFFFFF' }}>
            {title}
          </h3>
          <p className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
            {participants.length} participante{participants.length !== 1 ? 's' : ''} • En línea
          </p>
        </div>
      </div>

      <button className="p-2 rounded-full hover:bg-white/10 transition-colors">
        <MoreVertical className="w-4 h-4 text-white" />
      </button>
    </div>
  )
}
