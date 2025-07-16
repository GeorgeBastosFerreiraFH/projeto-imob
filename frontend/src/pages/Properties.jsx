"use client"

import { useState, useEffect } from "react"
import { Search, Eye, Trash2, MapPin, Home, Calendar } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import api from "../services/api"
import toast from "react-hot-toast"

const Properties = () => {
  const { user } = useAuth()
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    search: "",
    cidade: "",
    tipo: "",
    portal: "",
    page: 1,
    limit: 12,
  })
  const [pagination, setPagination] = useState({})
  const [selectedProperty, setSelectedProperty] = useState(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    loadProperties()
  }, [filters])

  const loadProperties = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })

      const response = await api.get(`/properties?${params}`)
      setProperties(response.data.imoveis)
      setPagination(response.data.pagination)
    } catch (error) {
      console.error("Erro ao carregar imóveis:", error)
      toast.error("Erro ao carregar imóveis")
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1, // Reset page when filtering
    }))
  }

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({
      ...prev,
      page: newPage,
    }))
  }

  const handleViewProperty = async (property) => {
    try {
      const response = await api.get(`/properties/${property.id}`)
      setSelectedProperty(response.data)
      setShowModal(true)
    } catch (error) {
      console.error("Erro ao carregar detalhes do imóvel:", error)
      toast.error("Erro ao carregar detalhes do imóvel")
    }
  }

  const handleDeleteProperty = async (propertyId) => {
    if (!window.confirm("Tem certeza que deseja excluir este imóvel?")) return

    try {
      await api.delete(`/properties/${propertyId}`)
      toast.success("Imóvel excluído com sucesso!")
      loadProperties()
    } catch (error) {
      console.error("Erro ao excluir imóvel:", error)
      toast.error("Erro ao excluir imóvel")
    }
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("pt-BR")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {user?.tipo_usuario === "master" ? "Todos os Imóveis" : "Meus Imóveis"}
          </h1>
          <p className="text-gray-600">{pagination.total || 0} imóveis encontrados</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Título ou descrição..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
            <select
              value={filters.cidade}
              onChange={(e) => handleFilterChange("cidade", e.target.value)}
              className="input-field"
            >
              <option value="">Todas as cidades</option>
              <option value="São Paulo">São Paulo</option>
              <option value="Rio de Janeiro">Rio de Janeiro</option>
              <option value="Belo Horizonte">Belo Horizonte</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select
              value={filters.tipo}
              onChange={(e) => handleFilterChange("tipo", e.target.value)}
              className="input-field"
            >
              <option value="">Todos os tipos</option>
              <option value="Apartamento">Apartamento</option>
              <option value="Casa">Casa</option>
              <option value="Cobertura">Cobertura</option>
              <option value="Kitnet">Kitnet</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Portal</label>
            <select
              value={filters.portal}
              onChange={(e) => handleFilterChange("portal", e.target.value)}
              className="input-field"
            >
              <option value="">Todos os portais</option>
              <option value="chavesnamao">Chaves na Mão</option>
              <option value="canalpro">Canal Pro</option>
            </select>
          </div>
        </div>
      </div>

      {/* Properties Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {properties.map((property) => (
            <div
              key={property.id}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="relative">
                <img
                  src={property.foto_principal || "/placeholder.svg?height=200&width=300"}
                  alt={property.titulo}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-2 right-2">
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
              </div>

              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">{property.titulo}</h3>

                <div className="flex items-center text-gray-600 mb-2">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span className="text-sm">
                    {property.bairro}, {property.cidade}
                  </span>
                </div>

                <div className="flex items-center text-gray-600 mb-3">
                  <Home className="h-4 w-4 mr-1" />
                  <span className="text-sm">{property.tipo}</span>
                </div>

                <div className="flex justify-between items-center mb-3">
                  <span className="text-xl font-bold text-primary-600">{formatCurrency(property.valor)}</span>
                </div>

                <div className="flex justify-between text-sm text-gray-500 mb-3">
                  <span>{property.quartos || 0} quartos</span>
                  <span>{property.banheiros || 0} banheiros</span>
                  <span>{property.area_total || 0}m²</span>
                </div>

                {user?.tipo_usuario === "master" && property.proprietario_nome && (
                  <div className="text-sm text-gray-600 mb-3">
                    <strong>Cliente:</strong> {property.proprietario_nome}
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  <div className="flex items-center text-sm text-gray-600">
                    <Eye className="h-4 w-4 mr-1" />
                    {property.visualizacoes} views
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleViewProperty(property)}
                      className="p-1 text-blue-600 hover:text-blue-800"
                      title="Ver detalhes"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    {user?.tipo_usuario === "master" && (
                      <button
                        onClick={() => handleDeleteProperty(property.id)}
                        className="p-1 text-red-600 hover:text-red-800"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && properties.length === 0 && (
        <div className="text-center py-12">
          <Home className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum imóvel encontrado</h3>
          <p className="mt-1 text-sm text-gray-500">Tente ajustar os filtros ou importe novos imóveis via XML.</p>
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center items-center space-x-2">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Anterior
          </button>

          <span className="px-3 py-2 text-sm text-gray-700">
            Página {pagination.page} de {pagination.pages}
          </span>

          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.pages}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Próxima
          </button>
        </div>
      )}

      {/* Property Details Modal */}
      {showModal && selectedProperty && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setShowModal(false)}
            />

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Detalhes do Imóvel</h3>
                  <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                    <span className="sr-only">Fechar</span>✕
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <img
                      src={selectedProperty.foto_principal || "/placeholder.svg?height=300&width=400"}
                      alt={selectedProperty.titulo}
                      className="w-full h-64 object-cover rounded-lg"
                    />
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xl font-semibold text-gray-900">{selectedProperty.titulo}</h4>
                      <p className="text-2xl font-bold text-primary-600 mt-2">
                        {formatCurrency(selectedProperty.valor)}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Tipo:</span>
                        <p>{selectedProperty.tipo}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Código:</span>
                        <p>{selectedProperty.codigo_imovel}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Cidade:</span>
                        <p>{selectedProperty.cidade}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Bairro:</span>
                        <p>{selectedProperty.bairro}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Quartos:</span>
                        <p>{selectedProperty.quartos || 0}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Banheiros:</span>
                        <p>{selectedProperty.banheiros || 0}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Área:</span>
                        <p>{selectedProperty.area_total || 0}m²</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Vagas:</span>
                        <p>{selectedProperty.vagas || 0}</p>
                      </div>
                    </div>

                    <div>
                      <span className="font-medium text-gray-700">Portal:</span>
                      <span
                        className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
                          selectedProperty.portal_origem === "chavesnamao"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {selectedProperty.portal_origem === "chavesnamao" ? "Chaves na Mão" : "Canal Pro"}
                      </span>
                    </div>

                    {selectedProperty.proprietario_nome && (
                      <div>
                        <span className="font-medium text-gray-700">Cliente:</span>
                        <p>{selectedProperty.proprietario_nome}</p>
                        <p className="text-sm text-gray-500">{selectedProperty.proprietario_email}</p>
                      </div>
                    )}

                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Eye className="h-4 w-4 mr-1" />
                        {selectedProperty.visualizacoes} visualizações
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(selectedProperty.created_at)}
                      </div>
                    </div>
                  </div>
                </div>

                {selectedProperty.descricao && (
                  <div className="mt-6">
                    <h5 className="font-medium text-gray-700 mb-2">Descrição:</h5>
                    <p className="text-gray-600 text-sm">{selectedProperty.descricao}</p>
                  </div>
                )}

                {selectedProperty.endereco && (
                  <div className="mt-4">
                    <h5 className="font-medium text-gray-700 mb-2">Endereço:</h5>
                    <p className="text-gray-600 text-sm">{selectedProperty.endereco}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Properties
