import { create } from 'zustand'
import type { AIMessage, Document } from '@/types'

interface AIState {
  messages: AIMessage[]
  isStreaming: boolean
  knowledgeDocs: Document[]
  selectedKnowledgeIds: number[]
  addMessage: (msg: AIMessage) => void
  updateLastAssistant: (chunk: string) => void
  setStreaming: (v: boolean) => void
  clearMessages: () => void
  setKnowledgeDocs: (docs: Document[]) => void
  addKnowledgeDoc: (doc: Document) => void
  removeKnowledgeDoc: (id: number) => void
  toggleKnowledgeId: (id: number) => void
}

export const useAIStore = create<AIState>((set) => ({
  messages: [],
  isStreaming: false,
  knowledgeDocs: [],
  selectedKnowledgeIds: [],
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  updateLastAssistant: (chunk) =>
    set((s) => {
      const msgs = [...s.messages]
      const last = msgs[msgs.length - 1]
      if (last && last.role === 'assistant') {
        msgs[msgs.length - 1] = { ...last, content: last.content + chunk }
      } else {
        msgs.push({ role: 'assistant', content: chunk, timestamp: new Date().toISOString() })
      }
      return { messages: msgs }
    }),
  setStreaming: (v) => set({ isStreaming: v }),
  clearMessages: () => set({ messages: [] }),
  setKnowledgeDocs: (docs) => set({ knowledgeDocs: docs }),
  addKnowledgeDoc: (doc) => set((s) => ({ knowledgeDocs: [...s.knowledgeDocs, doc] })),
  removeKnowledgeDoc: (id) => set((s) => ({ knowledgeDocs: s.knowledgeDocs.filter((d) => d.id !== id) })),
  toggleKnowledgeId: (id) =>
    set((s) => ({
      selectedKnowledgeIds: s.selectedKnowledgeIds.includes(id)
        ? s.selectedKnowledgeIds.filter((i) => i !== id)
        : [...s.selectedKnowledgeIds, id],
    })),
}))