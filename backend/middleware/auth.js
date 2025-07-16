const jwt = require("jsonwebtoken")
const pool = require("../config/database")

const JWT_SECRET = process.env.JWT_SECRET || "seu_jwt_secret_aqui"

const authenticateToken = async (req, res, next) => {
  try {
    const token = req.cookies.token

    if (!token) {
      return res.status(401).json({ error: "Token de acesso requerido" })
    }

    const decoded = jwt.verify(token, JWT_SECRET)

    const [rows] = await pool.query(
      "SELECT id, nome, email, tipo_usuario, referencia_cliente FROM usuarios WHERE id = ?",
      [decoded.userId],
    )

    if (rows.length === 0) {
      return res.status(401).json({ error: "Usuário não encontrado" })
    }

    req.user = rows[0]
    next()
  } catch (error) {
    console.error("Erro na autenticação:", error)
    return res.status(403).json({ error: "Token inválido" })
  }
}


const requireMaster = (req, res, next) => {
  if (req.user.tipo_usuario !== "master") {
    return res.status(403).json({ error: "Acesso negado. Apenas administradores." })
  }
  next()
}

module.exports = { authenticateToken, requireMaster }
