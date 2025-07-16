"use client"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { Toaster } from "react-hot-toast"
import { AuthProvider } from "./contexts/AuthContext"
import { useAuth } from "./contexts/AuthContext"

// Componentes
import Login from "./pages/Login"
import MasterDashboard from "./pages/MasterDashboard"
import ClientDashboard from "./pages/ClientDashboard"
import Properties from "./pages/Properties"
import Users from "./pages/Users"
import XMLImport from "./pages/XMLImport"
import Layout from "./components/Layout"


// Componente para rotas protegidas
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole && user.tipo_usuario !== requiredRole) {
    return <Navigate to="/" replace />
  }

  return children
}

// Componente para redirecionamento baseado no tipo de usuário
const DashboardRedirect = () => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (user.tipo_usuario === "master") {
    return <Navigate to="/dashboard/master" replace />
  } else if (user.tipo_usuario === "cliente") {
    return <Navigate to="/dashboard/client" replace />
  }

  return <Navigate to="/login" replace />
}

// Componente principal do App
function AppContent() {
  return (
    <Router>
      <div className="App">
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#363636",
              color: "#fff",
            },
          }}
        />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<DashboardRedirect />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route
              path="master"
              element={
                <ProtectedRoute requiredRole="master">
                  <MasterDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="client"
              element={
                <ProtectedRoute requiredRole="cliente">
                  <ClientDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="properties"
              element={
                <ProtectedRoute>
                  <Properties />
                </ProtectedRoute>
              }
            />

            <Route
              path="users"
              element={
                <ProtectedRoute requiredRole="master">
                  <Users />
                </ProtectedRoute>
              }
            />

            <Route
              path="xml-import"
              element={
                <ProtectedRoute requiredRole="master">
                  <XMLImport />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </div>
    </Router>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
