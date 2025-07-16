const express = require("express")
const multer = require("multer")
const { XMLParser } = require("fast-xml-parser")
const pool = require("../config/database")
const { authenticateToken, requireMaster } = require("../middleware/auth")

const router = express.Router()

// Configurar multer para upload de arquivos
const upload = multer({
  dest: "uploads/",
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "text/xml" || file.mimetype === "application/xml" || file.originalname.endsWith(".xml")) {
      cb(null, true)
    } else {
      cb(new Error("Apenas arquivos XML são permitidos"))
    }
  },
})

// Parser XML
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
})

// Função para processar XML do Chaves na Mão
const processChavesNaMaoXML = async (xmlData) => {
  const imoveis = []

  // Assumindo estrutura do XML do Chaves na Mão
  const properties = xmlData.imoveis?.imovel || []
  const propertyArray = Array.isArray(properties) ? properties : [properties]

  for (const prop of propertyArray) {
    const imovel = {
      codigo_imovel: prop.referencia || prop.codigo,
      titulo: prop.titulo || `${prop.tipo} em ${prop.cidade}`,
      descricao: prop.descricao || "",
      valor: Number.parseFloat(prop.valor) || 0,
      tipo: prop.tipo || "Não informado",
      cidade: prop.cidade || "",
      bairro: prop.bairro || "",
      endereco: prop.endereco || "",
      area_total: Number.parseFloat(prop.area) || null,
      quartos: Number.parseInt(prop.quartos) || null,
      banheiros: Number.parseInt(prop.banheiros) || null,
      vagas: Number.parseInt(prop.vagas) || null,
      foto_principal: prop.foto_principal || "/placeholder.svg?height=300&width=400",
      fotos_adicionais: prop.fotos ? (Array.isArray(prop.fotos) ? prop.fotos : [prop.fotos]) : [],
      portal_origem: "chavesnamao",
      xml_data: prop,
    }

    // Tentar vincular ao cliente pela referência
    const clienteResult = await pool.query(
      "SELECT id FROM usuarios WHERE referencia_cliente = ? AND tipo_usuario = ?",
      [imovel.codigo_imovel, "cliente"],
    )

    if (clienteResult.rows.length > 0) {
      imovel.id_usuario = clienteResult.rows[0].id
    }

    imoveis.push(imovel)
  }

  return imoveis
}

// Função para processar XML do Canal Pro
const processCanalProXML = async (xmlData) => {
  const imoveis = []

  // Assumindo estrutura do XML do Canal Pro
  const properties = xmlData.ListaImoveis?.Imovel || []
  const propertyArray = Array.isArray(properties) ? properties : [properties]

  for (const prop of propertyArray) {
    const imovel = {
      codigo_imovel: prop.CodigoImovel,
      titulo: prop.TituloImovel || `${prop.TipoImovel} em ${prop.Cidade}`,
      descricao: prop.DescricaoImovel || "",
      valor: Number.parseFloat(prop.PrecoVenda || prop.PrecoLocacao) || 0,
      tipo: prop.TipoImovel || "Não informado",
      cidade: prop.Cidade || "",
      bairro: prop.Bairro || "",
      endereco: `${prop.Endereco || ""}, ${prop.Numero || ""}`,
      area_total: Number.parseFloat(prop.AreaTotal) || null,
      quartos: Number.parseInt(prop.QtdQuartos) || null,
      banheiros: Number.parseInt(prop.QtdBanheiros) || null,
      vagas: Number.parseInt(prop.QtdVagas) || null,
      foto_principal: prop.URLFoto || "/placeholder.svg?height=300&width=400",
      fotos_adicionais: prop.Fotos ? (Array.isArray(prop.Fotos) ? prop.Fotos : [prop.Fotos]) : [],
      portal_origem: "canalpro",
      xml_data: prop,
    }

    // Tentar vincular ao cliente pelo código do imóvel
    const clienteResult = await pool.query(
      "SELECT id FROM usuarios WHERE referencia_cliente = ? AND tipo_usuario = ?",
      [imovel.codigo_imovel, "cliente"],
    )

    if (clienteResult.rows.length > 0) {
      imovel.id_usuario = clienteResult.rows[0].id
    }

    imoveis.push(imovel)
  }

  return imoveis
}

// Função para salvar imóveis no banco
const saveProperties = async (imoveis) => {
  const results = {
    inserted: 0,
    updated: 0,
    errors: [],
  }

  for (const imovel of imoveis) {
    try {
      // Verificar se imóvel já existe
      const existingProperty = await pool.query(
        "SELECT id FROM imoveis WHERE codigo_imovel = ? AND portal_origem = ?",
        [imovel.codigo_imovel, imovel.portal_origem],
      )

      if (existingProperty.rows.length > 0) {
        // Atualizar imóvel existente
        await pool.query(
          `
          UPDATE imoveis 
          SET titulo = ?, descricao = ?, valor = ?, tipo = ?, cidade = ?,
              bairro = ?, endereco = ?, area_total = ?, quartos = ?,
              banheiros = ?, vagas = ?, foto_principal = ?, fotos_adicionais = ?,
              id_usuario = ?, xml_data = ?, updated_at = CURRENT_TIMESTAMP
          WHERE codigo_imovel = ? AND portal_origem = ?
        `,
          [
            imovel.titulo,
            imovel.descricao,
            imovel.valor,
            imovel.tipo,
            imovel.cidade,
            imovel.bairro,
            imovel.endereco,
            imovel.area_total,
            imovel.quartos,
            imovel.banheiros,
            imovel.vagas,
            imovel.foto_principal,
            imovel.fotos_adicionais,
            imovel.id_usuario,
            JSON.stringify(imovel.xml_data),
            imovel.codigo_imovel,
            imovel.portal_origem,
          ],
        )
        results.updated++
      } else {
        // Inserir novo imóvel
        await pool.query(
          `
          INSERT INTO imoveis (
            codigo_imovel, titulo, descricao, valor, tipo, cidade,
            bairro, endereco, area_total, quartos, banheiros, vagas,
            foto_principal, fotos_adicionais, portal_origem, id_usuario, xml_data
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            imovel.codigo_imovel,
            imovel.titulo,
            imovel.descricao,
            imovel.valor,
            imovel.tipo,
            imovel.cidade,
            imovel.bairro,
            imovel.endereco,
            imovel.area_total,
            imovel.quartos,
            imovel.banheiros,
            imovel.vagas,
            imovel.foto_principal,
            JSON.stringify(imovel.fotos_adicionais),
            imovel.portal_origem,
            imovel.id_usuario,
            JSON.stringify(imovel.xml_data),
          ]
        )
        results.inserted++
      }
    } catch (error) {
      console.error(`Erro ao processar imóvel ${imovel.codigo_imovel}:`, error)
      results.errors.push({
        codigo: imovel.codigo_imovel,
        error: error.message,
      })
    }
  }

  return results
}

// Upload e processamento de XML
router.post("/upload", authenticateToken, requireMaster, upload.single("xmlFile"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Arquivo XML é obrigatório" })
    }

    const fs = require("fs")
    const xmlContent = fs.readFileSync(req.file.path, "utf8")
    const xmlData = parser.parse(xmlContent)

    let imoveis = []

    // Detectar tipo de portal baseado na estrutura do XML
    if (xmlData.imoveis || xmlData.chavesnamao) {
      // XML do Chaves na Mão
      imoveis = await processChavesNaMaoXML(xmlData)
    } else if (xmlData.ListaImoveis || xmlData.canalpro) {
      // XML do Canal Pro
      imoveis = await processCanalProXML(xmlData)
    } else {
      return res.status(400).json({ error: "Formato de XML não reconhecido" })
    }

    // Salvar imóveis no banco
    const results = await saveProperties(imoveis)

    // Limpar arquivo temporário
    fs.unlinkSync(req.file.path)

    res.json({
      message: "XML processado com sucesso",
      results: {
        total_processados: imoveis.length,
        inseridos: results.inserted,
        atualizados: results.updated,
        erros: results.errors.length,
      },
      errors: results.errors,
    })
  } catch (error) {
    console.error("Erro ao processar XML:", error)
    res.status(500).json({ error: "Erro ao processar arquivo XML" })
  }
})

// Processar XML via URL (para automação)
router.post("/process-url", authenticateToken, requireMaster, async (req, res) => {
  try {
    const { url, portal } = req.body

    if (!url || !portal) {
      return res.status(400).json({ error: "URL e portal são obrigatórios" })
    }

    const axios = require("axios")
    const response = await axios.get(url)
    const xmlData = parser.parse(response.data)

    let imoveis = []

    if (portal === "chavesnamao") {
      imoveis = await processChavesNaMaoXML(xmlData)
    } else if (portal === "canalpro") {
      imoveis = await processCanalProXML(xmlData)
    } else {
      return res.status(400).json({ error: "Portal não suportado" })
    }

    const results = await saveProperties(imoveis)

    res.json({
      message: "XML processado com sucesso via URL",
      results: {
        total_processados: imoveis.length,
        inseridos: results.inserted,
        atualizados: results.updated,
        erros: results.errors.length,
      },
      errors: results.errors,
    })
  } catch (error) {
    console.error("Erro ao processar XML via URL:", error)
    res.status(500).json({ error: "Erro ao processar XML via URL" })
  }
})

module.exports = router
