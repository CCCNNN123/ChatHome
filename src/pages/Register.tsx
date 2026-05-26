import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import { User, Lock, ArrowRight, CheckCircle } from 'lucide-react'

export default function RegisterPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const login = useAuthStore((s) => s.login)
  const navigate = useNavigate()

  const handleRegister = async () => {
    if (!username.trim() || !password.trim()) {
      setError('请输入用户名和密码')
      return
    }

    if (username.length < 3) {
      setError('用户名至少需要3个字符')
      return
    }

    if (password.length < 4) {
      setError('密码至少需要4个字符')
      return
    }

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }

    setLoading(true)
    setError('')
    try {
      const res = await api.register(username.trim(), password.trim())
      setSuccess(true)
      setTimeout(() => {
        login(res.user, res.token)
        localStorage.setItem('chathome_user', JSON.stringify({ ...res.user, token: res.token }))
        navigate('/')
      }, 1500)
    } catch (e: any) {
      setError(e.message || '注册失败')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleRegister()
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-primary-50 via-accent-50/30 to-purple-50/30">
        <div className="text-center animate-scale-in">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-10 w-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">注册成功</h2>
          <p className="text-gray-500">正在跳转到首页...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-primary-50 via-accent-50/30 to-purple-50/30">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-64 -right-64 h-[400px] w-[400px] rounded-full bg-gradient-to-br from-primary-200/40 to-accent-200/40 blur-3xl" />
        <div className="absolute -bottom-64 -left-64 h-[400px] w-[400px] rounded-full bg-gradient-to-br from-accent-200/40 to-purple-200/40 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-scale-in">
        <div className="relative rounded-3xl bg-white/80 backdrop-blur-xl p-8 shadow-elevated overflow-hidden border border-white/50">
          <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-gray-100/60 to-gray-200/60 rounded-bl-full" />
          
          <div className="relative z-10">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-gray-700 to-gray-800 shadow-[0_4px_14px_rgba(0,0,0,0.35)]">
                <span className="text-xl font-bold text-white">CH</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                注册账号
              </h1>
              <p className="mt-2 text-sm text-gray-500">
                创建你的 ChatHome 账号
              </p>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 focus-within:border-gray-400 focus-within:shadow-[0_0_15px_rgba(0,0,0,0.08)] transition-all duration-300">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
                    <User className="h-4 w-4 text-gray-600" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="用户名（至少3个字符）"
                    className="flex-1 bg-transparent text-gray-900 placeholder-gray-400 outline-none text-sm"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 focus-within:border-gray-400 focus-within:shadow-[0_0_15px_rgba(0,0,0,0.08)] transition-all duration-300">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
                    <Lock className="h-4 w-4 text-gray-600" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="密码（至少4个字符）"
                    className="flex-1 bg-transparent text-gray-900 placeholder-gray-400 outline-none text-sm"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 focus-within:border-gray-400 focus-within:shadow-[0_0_15px_rgba(0,0,0,0.08)] transition-all duration-300">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
                    <Lock className="h-4 w-4 text-gray-600" />
                  </div>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="确认密码"
                    className="flex-1 bg-transparent text-gray-900 placeholder-gray-400 outline-none text-sm"
                  />
                </div>
              </div>

              {error && (
                <p className="text-red-500 text-sm text-center animate-fade-in">{error}</p>
              )}

              <button
                onClick={handleRegister}
                disabled={loading}
                className="w-full rounded-2xl bg-gradient-to-r from-gray-800 to-gray-900 py-3.5 text-sm font-bold text-white shadow-[0_4px_15px_rgba(0,0,0,0.3)] transition-all duration-300 hover:shadow-[0_6px_20px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 active:translate-y-0"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    注册中...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    注册
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </button>

              <div className="flex items-center justify-center">
                <span className="text-sm text-gray-500">已有账号？</span>
                <button
                  onClick={() => navigate('/login')}
                  className="ml-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
                >
                  立即登录
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
