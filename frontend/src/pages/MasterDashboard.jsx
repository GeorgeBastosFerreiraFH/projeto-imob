"use client"

import { useState, useEffect } from "react"
import { Building, Users, TrendingUp, Eye, BarChart3, PieChartIcon as PieIcon, Upload, Plus } from "lucide-react"
import { Link } from "react-router-dom"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from "recharts"
import api from "../services/api"
import toast from "react-hot-toast"

const MasterDashboard = () => {
  const [stats, setStats] = useState(null)
  const [recentProperties, setRecentProperties] = useState([])
  const [topProperties, setTopProperties] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const [statsRes, recentRes, topRes] = await Promise.all([
        api.get("/dashboard/stats"),
        api.get("/dashboard/recent?limit=5"),
        api.get("/dashboard/top-views?limit=5"),
      ])

      setStats(statsRes.data)
      setRecentProperties(recentRes.data)
      setTopProperties(topRes.data)
    } catch (error) {
      console.error("Erro ao carregar dados do dashboard:", error)
      toast.error("Erro ao carregar dados do dashboard")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"]

  const pieChartData =
    stats?.por_tipo?.map((item, index) => ({
      name: item.tipo,
      value: Number.parseInt(item.count),
      color: COLORS[index % COLORS.length],
    })) || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Painel Administrativo</h1>
        <div className="flex space-x-3">
          <Link to="/dashboard/xml-import" className="btn-primary flex items-center">
            <Upload className="h-4 w-4 mr-2" />
            Importar XML
          </Link>
          <Link to="/dashboard/users" className="btn-secondary flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            Novo Cliente
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total de Imóveis</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.total_imoveis || 0}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Chaves na Mão</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.por_portal?.find((p) => p.portal_origem === "chavesnamao")?.count || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Canal Pro</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.por_portal?.find((p) => p.portal_origem === "canalpro")?.count || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Eye className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Cidades</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.por_cidade?.length || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart - Imóveis por Cidade */}
        <div className="card">
          <div className="flex items-center mb-4">
            <BarChart3 className="h-5 w-5 text-gray-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Imóveis por Cidade</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats?.por_cidade?.slice(0, 8) || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="cidade" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart - Imóveis por Tipo */}
        <div className="card">
          <div className="flex items-center mb-4">
            <PieIcon className="h-5 w-5 text-gray-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Imóveis por Tipo</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={pieChartData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {pieChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Properties and Top Views */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Properties */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Imóveis Recentes</h3>
            <Link to="/dashboard/properties" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              Ver todos
            </Link>
          </div>
          <div className="space-y-3">
            {recentProperties.map((property) => (
              <div key={property.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                <img
                  src={property.foto_principal || "/placeholder.svg"}
                  alt={property.titulo}
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{property.titulo}</p>
                  <p className="text-xs text-gray-500">
                    {property.cidade} • {property.portal_origem}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">R$ {property.valor?.toLocaleString("pt-BR")}</p>
                  <p className="text-xs text-gray-500">{property.proprietario_nome || "Sem cliente"}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Properties by Views */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Mais Visualizados</h3>
            <Link to="/dashboard/properties" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              Ver todos
            </Link>
          </div>
          <div className="space-y-3">
            {topProperties.map((property) => (
              <div key={property.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                <img
                  src={property.foto_principal || "/placeholder.svg"}
                  alt={property.titulo}
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{property.titulo}</p>
                  <p className="text-xs text-gray-500">
                    {property.cidade} • {property.portal_origem}
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center text-sm text-gray-600">
                    <Eye className="h-4 w-4 mr-1" />
                    {property.visualizacoes}
                  </div>
                  <p className="text-xs text-gray-500">{property.proprietario_nome || "Sem cliente"}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MasterDashboard
