"use client"

import { useState, useEffect } from "react"
import { Building, Eye, TrendingUp, MapPin, BarChart3, PieChartIcon as PieIcon } from "lucide-react"
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

const ClientDashboard = () => {
  const [stats, setStats] = useState(null)
  const [myProperties, setMyProperties] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const [statsRes, propertiesRes] = await Promise.all([
        api.get("/dashboard/stats"),
        api.get("/properties?limit=10"),
      ])

      setStats(statsRes.data)
      setMyProperties(propertiesRes.data.imoveis)
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

  const totalVisualizacoes = stats?.visualizacoes?.total_visualizacoes || 0
  const mediaVisualizacoes = stats?.visualizacoes?.media_visualizacoes || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Meus Imóveis</h1>
        <p className="text-gray-600">Acompanhe o desempenho dos seus imóveis</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Meus Imóveis</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.total_imoveis || 0}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Eye className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Visualizações</p>
              <p className="text-2xl font-bold text-gray-900">{totalVisualizacoes}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Média por Imóvel</p>
              <p className="text-2xl font-bold text-gray-900">{Math.round(mediaVisualizacoes)}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <MapPin className="h-6 w-6 text-purple-600" />
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
        {/* Bar Chart - Imóveis por Portal */}
        <div className="card">
          <div className="flex items-center mb-4">
            <BarChart3 className="h-5 w-5 text-gray-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Imóveis por Portal</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats?.por_portal || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="portal_origem" />
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

      {/* My Properties List */}
      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Meus Imóveis</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myProperties.map((property) => (
            <div
              key={property.id}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
            >
              <img
                src={property.foto_principal || "/placeholder.svg"}
                alt={property.titulo}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-lg font-semibold text-gray-900 truncate">{property.titulo}</h4>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      property.portal_origem === "chavesnamao"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {property.portal_origem === "chavesnamao" ? "Chaves na Mão" : "Canal Pro"}
                  </span>
                </div>

                <p className="text-gray-600 text-sm mb-2">
                  {property.bairro}, {property.cidade}
                </p>

                <div className="flex justify-between items-center mb-3">
                  <span className="text-2xl font-bold text-primary-600">
                    R$ {property.valor?.toLocaleString("pt-BR")}
                  </span>
                </div>

                <div className="flex justify-between text-sm text-gray-500 mb-3">
                  <span>{property.quartos} quartos</span>
                  <span>{property.banheiros} banheiros</span>
                  <span>{property.area_total}m²</span>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  <div className="flex items-center text-sm text-gray-600">
                    <Eye className="h-4 w-4 mr-1" />
                    {property.visualizacoes} visualizações
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      property.status === "ativo" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {property.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {myProperties.length === 0 && (
          <div className="text-center py-12">
            <Building className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum imóvel encontrado</h3>
            <p className="mt-1 text-sm text-gray-500">Você ainda não possui imóveis vinculados à sua conta.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ClientDashboard
