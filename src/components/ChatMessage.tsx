import { cn } from '@/lib/utils'
import type { Message } from '@/types'

interface ChatMessageProps {
  message: Message
  isOwn: boolean
}

export function ChatMessage({ message, isOwn }: ChatMessageProps) {
  return (
    <div
      className={cn(
        'flex gap-4 animate-fade-in mb-4',
        isOwn ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      <div
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-semibold',
          isOwn
            ? 'bg-gradient-to-br from-gray-700 to-gray-800 text-white shadow-[0_3px_10px_rgba(0,0,0,0.3)]'
            : 'bg-gradient-to-br from-gray-200 to-gray-300 text-gray-700'
        )}
      >
        {message.username.charAt(0).toUpperCase()}
      </div>
      <div className={cn('flex flex-col max-w-[70%]', isOwn ? 'items-end' : 'items-start')}>
        <span className="text-xs text-gray-500 mb-1.5">
          {message.username}
        </span>
        <div
          className={cn(
            'rounded-2xl px-4 py-3 text-sm leading-relaxed',
            isOwn
              ? 'rounded-tr-md bg-gradient-to-br from-gray-700 to-gray-800 text-white shadow-[0_4px_14px_rgba(0,0,0,0.25)]'
              : 'rounded-tl-md bg-white/95 backdrop-blur-sm border border-gray-200 text-gray-800 shadow-[0_2px_8px_rgba(0,0,0,0.03)]'
          )}
        >
          {message.content}
        </div>
      </div>
    </div>
  )
}
