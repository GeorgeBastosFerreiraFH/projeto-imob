const express = require("express")
const bcrypt = require("bcrypt")
const pool = require("../config/database")
const { authenticateToken, requireMaster } = require("../middleware/auth")

const router = express.Router()

// Listar usuários (apenas master)
router.get("/", authenticateToken, requireMaster, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, nome, email, tipo_usuario, referencia_cliente, created_at
      FROM usuarios 
      ORDER BY created_at DESC
    `)

    res.json(result.rows)
  } catch (error) {
    console.error("Erro ao listar usuários:", error)
    res.status(500).json({ error: "Erro interno do servidor" })
  }
})

// Criar usuário (apenas master)
router.post("/", authenticateToken, requireMaster, async (req, res) => {
  try {
    const { nome, email, senha, tipo_usuario, referencia_cliente } = req.body

    if (!nome || !email || !senha || !tipo_usuario) {
      return res.status(400).json({ error: "Todos os campos obrigatórios devem ser preenchidos" })
    }

    // Verificar se email já existe
    const emailExists = await pool.query("SELECT id FROM usuarios WHERE email = ?", [email])
    if (emailExists.rows.length > 0) {
      return res.status(400).json({ error: "Email já cadastrado" })
    }

    // Hash da senha
    const senhaHash = await bcrypt.hash(senha, 10)

    const result = await pool.query(
      `
      INSERT INTO usuarios (nome, email, senha_hash, tipo_usuario, referencia_cliente)
      VALUES (?, ?, ?, ?, ?)
      RETURNING id, nome, email, tipo_usuario, referencia_cliente, created_at
    `,
      [nome, email, senhaHash, tipo_usuario, referencia_cliente],
    )

    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error("Erro ao criar usuário:", error)
    res.status(500).json({ error: "Erro interno do servidor" })
  }
})

// Atualizar usuário (apenas master)
router.put("/:id", authenticateToken, requireMaster, async (req, res) => {
  try {
    const { id } = req.params
    const { nome, email, referencia_cliente } = req.body

    const result = await pool.query(
      `
      UPDATE usuarios 
      SET nome = ?, email = ?, referencia_cliente = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      RETURNING id, nome, email, tipo_usuario, referencia_cliente, updated_at
    `,
      [nome, email, referencia_cliente, id],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Usuário não encontrado" })
    }

    res.json(result.rows[0])
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error)
    res.status(500).json({ error: "Erro interno do servidor" })
  }
})

// Deletar usuário (apenas master)
router.delete("/:id", authenticateToken, requireMaster, async (req, res) => {
  try {
    const { id } = req.params

    const result = await pool.query("DELETE FROM usuarios WHERE id = ? RETURNING id", [id])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Usuário não encontrado" })
    }

    res.json({ message: "Usuário deletado com sucesso" })
  } catch (error) {
    console.error("Erro ao deletar usuário:", error)
    res.status(500).json({ error: "Erro interno do servidor" })
  }
})

module.exports = router
