const express = require("express");
const pool = require("../config/database");
const { authenticateToken, requireMaster } = require("../middleware/auth");

const router = express.Router();

// Listar imóveis (com filtros baseados no tipo de usuário)
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, cidade, tipo, portal } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT i.*, u.nome as proprietario_nome
      FROM imoveis i
      LEFT JOIN usuarios u ON i.id_usuario = u.id
    `;

    const whereConditions = [];
    const queryParams = [];

    // Se for cliente, mostrar apenas seus imóveis
    if (req.user.tipo_usuario === "cliente") {
      whereConditions.push(`i.id_usuario = ?`);
      queryParams.push(req.user.id);
    }

    // Filtros adicionais
    if (search) {
      whereConditions.push(`(i.titulo LIKE ? OR i.descricao LIKE ?)`);
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    if (cidade) {
      whereConditions.push(`i.cidade = ?`);
      queryParams.push(cidade);
    }

    if (tipo) {
      whereConditions.push(`i.tipo = ?`);
      queryParams.push(tipo);
    }

    if (portal) {
      whereConditions.push(`i.portal_origem = ?`);
      queryParams.push(portal);
    }

    if (whereConditions.length > 0) {
      query += " WHERE " + whereConditions.join(" AND ");
    }

    query += ` ORDER BY i.created_at DESC LIMIT ? OFFSET ?`;
    queryParams.push(Number(limit), Number(offset));

    const [rows] = await pool.query(query, queryParams);

    // Contar total para paginação
    let countQuery = "SELECT COUNT(*) as count FROM imoveis i";
    const countParams = [];

    if (req.user.tipo_usuario === "cliente") {
      countQuery += " WHERE i.id_usuario = ?";
      countParams.push(req.user.id);
    }

    const [countResult] = await pool.query(countQuery, countParams);
    const total = countResult.length > 0 ? countResult[0].count : 0;

    res.json({
      imoveis: rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Erro ao listar imóveis:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

module.exports = router;
