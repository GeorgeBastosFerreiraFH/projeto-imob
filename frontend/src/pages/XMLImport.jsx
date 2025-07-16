"use client"

import { useState } from "react"
import { Upload, FileText, LinkIcon, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { useForm } from "react-hook-form"
import api from "../services/api"
import toast from "react-hot-toast"

const XMLImport = () => {
  const [importResults, setImportResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("upload")

  const {
    register: registerFile,
    handleSubmit: handleFileSubmit,
    reset: resetFile,
    formState: { isSubmitting: isFileSubmitting },
  } = useForm()

  const {
    register: registerUrl,
    handleSubmit: handleUrlSubmit,
    reset: resetUrl,
    formState: { isSubmitting: isUrlSubmitting },
  } = useForm()

  const handleFileUpload = async (data) => {
    try {
      setLoading(true)
      const formData = new FormData()
      formData.append("xmlFile", data.xmlFile[0])

      const response = await api.post("/xml/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      setImportResults(response.data)
      toast.success("XML processado com sucesso!")
      resetFile()
    } catch (error) {
      console.error("Erro ao processar XML:", error)
      toast.error(error.response?.data?.error || "Erro ao processar XML")
    } finally {
      setLoading(false)
    }
  }

  const handleUrlImport = async (data) => {
    try {
      setLoading(true)
      const response = await api.post("/xml/process-url", data)

      setImportResults(response.data)
      toast.success("XML processado com sucesso!")
      resetUrl()
    } catch (error) {
      console.error("Erro ao processar XML via URL:", error)
      toast.error(error.response?.data?.error || "Erro ao processar XML via URL")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Importar XML</h1>
        <p className="text-gray-600">Importe imóveis dos portais Chaves na Mão e Canal Pro via arquivos XML</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("upload")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "upload"
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <Upload className="h-4 w-4 inline mr-2" />
            Upload de Arquivo
          </button>
          <button
            onClick={() => setActiveTab("url")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "url"
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <LinkIcon className="h-4 w-4 inline mr-2" />
            Importar via URL
          </button>
        </nav>
      </div>

      {/* Upload Tab */}
      {activeTab === "upload" && (
        <div className="card">
          <form onSubmit={handleFileSubmit(handleFileUpload)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Arquivo XML</label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                    >
                      <span>Selecione um arquivo</span>
                      <input
                        id="file-upload"
                        type="file"
                        accept=".xml"
                        {...registerFile("xmlFile", { required: "Arquivo XML é obrigatório" })}
                        className="sr-only"
                      />
                    </label>
                    <p className="pl-1">ou arraste e solte</p>
                  </div>
                  <p className="text-xs text-gray-500">XML até 10MB</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-blue-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Informações importantes:</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <ul className="list-disc pl-5 space-y-1">
                      <li>O sistema detecta automaticamente se o XML é do Chaves na Mão ou Canal Pro</li>
                      <li>Imóveis serão vinculados automaticamente aos clientes com referência correspondente</li>
                      <li>Imóveis existentes serão atualizados com as novas informações</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button type="submit" disabled={isFileSubmitting || loading} className="btn-primary flex items-center">
                {isFileSubmitting || loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Processar XML
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* URL Tab */}
      {activeTab === "url" && (
        <div className="card">
          <form onSubmit={handleUrlSubmit(handleUrlImport)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL do XML</label>
              <input
                type="url"
                {...registerUrl("url", {
                  required: "URL é obrigatória",
                  pattern: {
                    value: /^https?:\/\/.+/,
                    message: "URL deve começar com http:// ou https://",
                  },
                })}
                className="input-field"
                placeholder="https://exemplo.com/imoveis.xml"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Portal de origem</label>
              <select {...registerUrl("portal", { required: "Portal é obrigatório" })} className="input-field">
                <option value="">Selecione o portal</option>
                <option value="chavesnamao">Chaves na Mão</option>
                <option value="canalpro">Canal Pro</option>
              </select>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-yellow-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Importação via URL:</h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Certifique-se de que a URL está acessível publicamente</li>
                      <li>O arquivo XML deve estar no formato correto do portal selecionado</li>
                      <li>Esta funcionalidade pode ser automatizada via cron jobs</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button type="submit" disabled={isUrlSubmitting || loading} className="btn-primary flex items-center">
                {isUrlSubmitting || loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processando...
                  </>
                ) : (
                  <>
                    <LinkIcon className="h-4 w-4 mr-2" />
                    Importar via URL
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Results */}
      {importResults && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Resultado da Importação</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-800">Total Processados</p>
                  <p className="text-2xl font-bold text-blue-900">{importResults.results.total_processados}</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">Inseridos/Atualizados</p>
                  <p className="text-2xl font-bold text-green-900">
                    {importResults.results.inseridos + importResults.results.atualizados}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <XCircle className="h-8 w-8 text-red-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">Erros</p>
                  <p className="text-2xl font-bold text-red-900">{importResults.results.erros}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Novos imóveis inseridos:</span>
              <span className="font-semibold text-green-600">{importResults.results.inseridos}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Imóveis atualizados:</span>
              <span className="font-semibold text-blue-600">{importResults.results.atualizados}</span>
            </div>
          </div>

          {importResults.errors && importResults.errors.length > 0 && (
            <div className="mt-6">
              <h4 className="text-md font-medium text-red-800 mb-2">Erros encontrados:</h4>
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <ul className="text-sm text-red-700 space-y-1">
                  {importResults.errors.map((error, index) => (
                    <li key={index}>
                      <strong>Código {error.codigo}:</strong> {error.error}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">{importResults.message}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default XMLImport
