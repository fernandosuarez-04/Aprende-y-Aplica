import { Users, MessageSquare, MoreVertical } from 'lucide-react'


interface ChatHeaderProps {
  title: string
  description?: string
  participantsCount: number
  onlineCount: number
}

export function ChatHeader({
  title,
  description,
  participantsCount,
  onlineCount
}: ChatHeaderProps) {
  return (
    <div
      className="flex items-center justify-between px-5 py-4 border-b border-white/5"
      style={{
        background: '#1E2329' // Using NodeDashboard style or simple dark bg
      }}
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-11 h-11 rounded-full bg-[#2A3038] border border-white/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-white/60" />
          </div>
          <div
            className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#1E2329] bg-emerald-500"
          />
        </div>

        <div>
          <h3 className="font-bold text-sm text-white">
            {title}
          </h3>
          <p className="text-xs text-white/40">
            {participantsCount} participante{participantsCount !== 1 ? 's' : ''} • {onlineCount} en línea
          </p>
        </div>
      </div>

      <button className="p-2 rounded-full hover:bg-white/5 transition-colors text-white/40 hover:text-white">
        <MoreVertical className="w-4 h-4" />
      </button>
    </div>
  )
}
