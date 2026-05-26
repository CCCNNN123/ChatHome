import { useState, useEffect, useRef } from 'react'
import { api } from '@/services/api'
import { Sidebar } from '@/components/Sidebar'
import { useAIStore } from '@/store/aiStore'
import { Upload, FileText, Trash2, CloudUpload, File } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Document } from '@/types'

export default function KnowledgeBasePage() {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const {
    knowledgeDocs,
    setKnowledgeDocs,
    addKnowledgeDoc,
    removeKnowledgeDoc,
  } = useAIStore()

  useEffect(() => {
    loadDocs()
  }, [])

  const loadDocs = async () => {
    try {
      const res = await api.getKnowledgeDocs()
      setKnowledgeDocs(res.documents)
    } catch (e) {
      console.error('Failed to load docs:', e)
    }
  }

  const handleUpload = async (file: File) => {
    setUploading(true)
    try {
      const doc = await api.uploadKnowledgeDoc(file)
      addKnowledgeDoc(doc)
    } catch (e: any) {
      alert('上传失败: ' + e.message)
    } finally {
      setUploading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleUpload(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDelete = async (doc: Document) => {
    if (!confirm(`确定要删除文档 "${doc.filename}" 吗？`)) return
    try {
      await api.deleteKnowledgeDoc(doc.id)
      removeKnowledgeDoc(doc.id)
    } catch (e: any) {
      alert('删除失败: ' + e.message)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      const ext = file.name.split('.').pop()?.toLowerCase()
      if (['txt', 'pdf', 'md', 'csv', 'json'].includes(ext || '')) {
        handleUpload(file)
      } else {
        alert('支持的文件类型: txt, pdf, md, csv, json')
      }
    }
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-primary-50 via-accent-50/20 to-purple-50/20">
      <Sidebar />
      <main className="ml-16 flex-1 p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            知识库
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            上传文档，让 AI 基于你的资料进行智能问答
          </p>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={cn(
            'mb-8 rounded-2xl border-2 border-dashed p-12 text-center transition-all duration-300 cursor-pointer',
            dragOver
              ? 'border-gray-400 bg-gradient-to-br from-gray-50/80 to-gray-100/80'
              : 'border-gray-300 bg-white/80 hover:border-gray-400 hover:bg-gray-50'
          )}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.pdf,.md,.csv,.json"
            onChange={handleFileSelect}
            className="hidden"
          />
          {uploading ? (
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-gray-700 to-gray-800 animate-bounce-soft shadow-[0_4px_14px_rgba(0,0,0,0.3)]">
                <CloudUpload className="h-8 w-8 text-white" />
              </div>
              <p className="text-sm font-semibold text-gray-700">上传中...</p>
              <div className="w-32 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full w-1/2 bg-gradient-to-r from-gray-600 to-gray-700 rounded-full animate-pulse" />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className={`flex h-20 w-20 items-center justify-center rounded-2xl transition-all duration-300 ${
                  dragOver 
                    ? 'bg-gradient-to-br from-gray-700 to-gray-800 shadow-[0_4px_16px_rgba(0,0,0,0.4)]' 
                    : 'bg-gradient-to-br from-gray-100 to-gray-200'
                }`}>
                  <Upload className={`h-10 w-10 transition-colors duration-300 ${
                    dragOver ? 'text-white' : 'text-gray-600'
                  }`} />
                </div>
                {dragOver && (
                  <div className="absolute -inset-1 rounded-3xl border-2 border-dashed border-gray-400 animate-pulse" />
                )}
              </div>
              <div>
                <p className="text-base font-semibold text-gray-900">
                  {dragOver ? '释放文件开始上传' : '拖拽文件到此处或点击上传'}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  支持 txt, pdf, md, csv, json 文件
                </p>
              </div>
            </div>
          )}
        </div>

        {knowledgeDocs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-dashed border-surface-300 bg-surface-50">
              <File className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">暂无文档</h3>
            <p className="mt-2 text-sm text-gray-500">上传文档以构建你的专属知识库</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {knowledgeDocs.map((doc, index) => (
              <div
                key={doc.id}
                className="group relative overflow-hidden rounded-2xl border border-surface-200 bg-white transition-all duration-300 hover:border-primary-300 hover:shadow-medium hover:-translate-y-0.5"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-gray-700 to-gray-800 shadow-[0_4px_12px_rgba(0,0,0,0.25)]">
                      <FileText className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 truncate max-w-[160px]">
                        {doc.filename}
                      </h4>
                      <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                        <span>{doc.chunk_count} 个分块</span>
                        <span className="w-1 h-1 rounded-full bg-gray-300" />
                        <span>{new Date(doc.created_at).toLocaleDateString('zh-CN')}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(doc)
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 opacity-0 transition-all duration-300 hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
