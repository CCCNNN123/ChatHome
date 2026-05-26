import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { useAuthStore } from "@/store/authStore"
import { useEffect } from "react"
import Login from "@/pages/Login"
import Register from "@/pages/Register"
import Home from "@/pages/Home"
import ChatRoom from "@/pages/ChatRoom"
import AIAssistant from "@/pages/AIAssistant"
import KnowledgeBase from "@/pages/KnowledgeBase"

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  const login = useAuthStore((s) => s.login)

  useEffect(() => {
    const stored = localStorage.getItem('chathome_user')
    if (stored) {
      try {
        const data = JSON.parse(stored)
        if (data.user && data.token) {
          login(data.user, data.token)
        } else if (data.id && data.token) {
          login(data, data.token)
        }
      } catch {
        localStorage.removeItem('chathome_user')
      }
    }
  }, [login])

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-accent-50/20 to-purple-50/20">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat/:roomId"
            element={
              <ProtectedRoute>
                <ChatRoom />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ai"
            element={
              <ProtectedRoute>
                <AIAssistant />
              </ProtectedRoute>
            }
          />
          <Route
            path="/knowledge"
            element={
              <ProtectedRoute>
                <KnowledgeBase />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  )
}
