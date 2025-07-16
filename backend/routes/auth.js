const express = require("express")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const pool = require("../config/database")
const { authenticateToken } = require("../middleware/auth")

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || "seu_jwt_secret_aqui"

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ error: "Email e senha são obrigatórios" });
    }

    // Usar destructuring do mysql2
    const [rows] = await pool.query("SELECT * FROM usuarios WHERE email = ?", [email]);

    if (!rows || rows.length === 0) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    const user = rows[0];

    // Verificar senha
    const senhaValida = await bcrypt.compare(senha, user.senha_hash);
    if (!senhaValida) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    // Gerar token JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, tipo: user.tipo_usuario },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Definir cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({
      message: "Login realizado com sucesso",
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        tipo_usuario: user.tipo_usuario,
        referencia_cliente: user.referencia_cliente,
      },
    });
  } catch (error) {
    console.error("Erro no login:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});


// Logout
router.post("/logout", (req, res) => {
  res.clearCookie("token")
  res.json({ message: "Logout realizado com sucesso" })
})

// Verificar autenticação
router.get("/me", authenticateToken, (req, res) => {
  res.json({ user: req.user })
})

module.exports = router
