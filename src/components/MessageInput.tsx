import { Send, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MessageInputProps {
  value: string
  onChange: (v: string) => void
  onSend: () => void
  disabled?: boolean
  placeholder?: string
}

export function MessageInput({
  value,
  onChange,
  onSend,
  disabled,
  placeholder = '输入消息...',
}: MessageInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (value.trim() && !disabled) onSend()
    }
  }

  return (
    <div className="border-t border-gray-200/50 bg-white/60 backdrop-blur-xl p-4">
      <div className="flex items-center gap-3 rounded-2xl border border-gray-200/60 bg-white/80 px-4 py-3 focus-within:border-gray-400 focus-within:shadow-[0_0_15px_rgba(0,0,0,0.05)] transition-all duration-300">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none"
        />
        <button
          onClick={onSend}
          disabled={disabled || !value.trim()}
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-300',
            value.trim() && !disabled
              ? 'bg-gradient-to-r from-gray-800 to-gray-900 text-white shadow-[0_2px_8px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)] hover:-translate-y-0.5'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          )}
        >
          {disabled ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  )
}
