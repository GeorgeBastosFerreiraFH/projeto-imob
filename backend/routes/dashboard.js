const express = require("express");
const pool = require("../config/database");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Dashboard geral (estatísticas)
router.get("/stats", authenticateToken, async (req, res) => {
  try {
    let whereClause = "";
    let queryParams = [];

    if (req.user.tipo_usuario === "cliente") {
      whereClause = "WHERE id_usuario = ?";
      queryParams = [req.user.id];
    }

    // Total de imóveis
    const [totalResult] = await pool.query(`SELECT COUNT(*) as total FROM imoveis ${whereClause}`, queryParams);
    const total = totalResult.length > 0 ? totalResult[0].total : 0;

    // Imóveis por portal
    const [portalResult] = await pool.query(
      `
      SELECT portal_origem, COUNT(*) as count 
      FROM imoveis ${whereClause}
      GROUP BY portal_origem
    `,
      queryParams
    );

    // Imóveis por tipo
    const [tipoResult] = await pool.query(
      `
      SELECT tipo, COUNT(*) as count 
      FROM imoveis ${whereClause}
      GROUP BY tipo 
      ORDER BY count DESC
    `,
      queryParams
    );

    // Imóveis por cidade
    const [cidadeResult] = await pool.query(
      `
      SELECT cidade, COUNT(*) as count 
      FROM imoveis ${whereClause}
      GROUP BY cidade 
      ORDER BY count DESC 
      LIMIT 10
    `,
      queryParams
    );

    // Valor médio por tipo
    // Note que concatenar cláusulas WHERE exige cuidado para evitar erros
    // Se já existe WHERE, adicionamos AND, senão WHERE
    let valorMedioQuery = `
      SELECT tipo, AVG(valor) as valor_medio, COUNT(*) as count
      FROM imoveis
    `;
    if (whereClause) {
      valorMedioQuery += ` ${whereClause} AND valor > 0`;
    } else {
      valorMedioQuery += ` WHERE valor > 0`;
    }
    valorMedioQuery += `
      GROUP BY tipo
      ORDER BY valor_medio DESC
    `;
    const [valorMedioResult] = await pool.query(valorMedioQuery, queryParams);

    // Estatísticas de visualizações (apenas para clientes)
    let visualizacoes = null;
    if (req.user.tipo_usuario === "cliente") {
      const [vizResult] = await pool.query(
        `
        SELECT SUM(visualizacoes) as total_visualizacoes, AVG(visualizacoes) as media_visualizacoes
        FROM imoveis WHERE id_usuario = ?
      `,
        [req.user.id]
      );
      visualizacoes = vizResult.length > 0 ? vizResult[0] : null;
    }

    res.json({
      total_imoveis: total,
      por_portal: portalResult,
      por_tipo: tipoResult,
      por_cidade: cidadeResult,
      valor_medio_por_tipo: valorMedioResult,
      visualizacoes: visualizacoes,
    });
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Imóveis recentes
router.get("/recent", authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    let whereClause = "";
    let queryParams = [];

    if (req.user.tipo_usuario === "cliente") {
      whereClause = "WHERE i.id_usuario = ?";
      queryParams.push(req.user.id);
    }

    queryParams.push(limit);

    const [rows] = await pool.query(
      `
      SELECT i.*, u.nome as proprietario_nome
      FROM imoveis i
      LEFT JOIN usuarios u ON i.id_usuario = u.id
      ${whereClause}
      ORDER BY i.created_at DESC
      LIMIT ?
    `,
      queryParams
    );

    res.json(rows);
  } catch (error) {
    console.error("Erro ao buscar imóveis recentes:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Top imóveis por visualizações
router.get("/top-views", authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    let whereClause = "";
    let queryParams = [];

    if (req.user.tipo_usuario === "cliente") {
      whereClause = "WHERE i.id_usuario = ?";
      queryParams.push(req.user.id);
    }

    queryParams.push(limit);

    const [rows] = await pool.query(
      `
      SELECT i.*, u.nome as proprietario_nome
      FROM imoveis i
      LEFT JOIN usuarios u ON i.id_usuario = u.id
      ${whereClause}
      ORDER BY i.visualizacoes DESC
      LIMIT ?
    `,
      queryParams
    );

    res.json(rows);
  } catch (error) {
    console.error("Erro ao buscar top imóveis:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Estatísticas mensais (para gráficos de linha)
router.get("/monthly-stats", authenticateToken, async (req, res) => {
  try {
    let whereClause = "";
    let queryParams = [];

    if (req.user.tipo_usuario === "cliente") {
      whereClause = "WHERE id_usuario = ?";
      queryParams.push(req.user.id);
    }

    // MySQL não tem DATE_TRUNC, usa DATE_FORMAT para agrupar por mês:
    const [rows] = await pool.query(
      `
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as mes,
        COUNT(*) as total_imoveis,
        AVG(valor) as valor_medio
      FROM imoveis
      ${whereClause}
      GROUP BY mes
      ORDER BY mes DESC
      LIMIT 12
    `,
      queryParams
    );

    res.json(rows);
  } catch (error) {
    console.error("Erro ao buscar estatísticas mensais:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

module.exports = router;
