const cron = require("node-cron")
const axios = require("axios")
const { XMLParser } = require("fast-xml-parser")
const pool = require("../config/database")

// URLs dos XMLs para importação automática
const XML_URLS = [
  {
    url: "https://exemplo.com/chavesnamao.xml",
    portal: "chavesnamao",
    active: false, // Ativar quando tiver URLs reais
  },
  {
    url: "https://exemplo.com/canalpro.xml",
    portal: "canalpro",
    active: false, // Ativar quando tiver URLs reais
  },
]

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
})

// Função para processar XML do Chaves na Mão
const processChavesNaMaoXML = async (xmlData) => {
  const imoveis = []
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

// Função principal de importação
const importFromUrl = async (urlConfig) => {
  try {
    console.log(`Iniciando importação de ${urlConfig.portal} - ${urlConfig.url}`)

    const response = await axios.get(urlConfig.url, { timeout: 30000 })
    const xmlData = parser.parse(response.data)

    let imoveis = []

    if (urlConfig.portal === "chavesnamao") {
      imoveis = await processChavesNaMaoXML(xmlData)
    } else if (urlConfig.portal === "canalpro") {
      imoveis = await processCanalProXML(xmlData)
    }

    const results = await saveProperties(imoveis)

    console.log(`Importação concluída para ${urlConfig.portal}:`, {
      total_processados: imoveis.length,
      inseridos: results.inserted,
      atualizados: results.updated,
      erros: results.errors.length,
    })

    // Log no banco de dados (opcional)
    await pool.query(
      `
      INSERT INTO logs_importacao (portal, url, total_processados, inseridos, atualizados, erros, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
    `,
      [urlConfig.portal, urlConfig.url, imoveis.length, results.inserted, results.updated, results.errors.length],
    )
  } catch (error) {
    console.error(`Erro na importação de ${urlConfig.portal}:`, error)
  }
}

// Configurar cron jobs
const setupCronJobs = () => {
  // Executar a cada 6 horas (00:00, 06:00, 12:00, 18:00)
  cron.schedule("0 */6 * * *", async () => {
    console.log("Iniciando importação automática de XMLs...")

    for (const urlConfig of XML_URLS) {
      if (urlConfig.active) {
        await importFromUrl(urlConfig)
        // Aguardar 1 minuto entre importações para não sobrecarregar
        await new Promise((resolve) => setTimeout(resolve, 60000))
      }
    }

    console.log("Importação automática concluída.")
  })

  console.log("Cron jobs configurados para importação automática de XMLs")
}

module.exports = { setupCronJobs, importFromUrl }
