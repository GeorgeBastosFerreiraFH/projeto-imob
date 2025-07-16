const express = require("express")
const cors = require("cors")
const cookieParser = require("cookie-parser")
const dotenv = require("dotenv")

// Importar rotas
const authRoutes = require("./routes/auth")
const userRoutes = require("./routes/users")
const propertyRoutes = require("./routes/properties")
const xmlRoutes = require("./routes/xml")
const dashboardRoutes = require("./routes/dashboard")

// Importar cron jobs
const { setupCronJobs } = require("./scripts/cron-xml-import")

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Middlewares
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
)
app.use(express.json())
app.use(cookieParser())

// Rotas
app.use("/api/auth", authRoutes)
app.use("/api/users", userRoutes)
app.use("/api/properties", propertyRoutes)
app.use("/api/xml", xmlRoutes)
app.use("/api/dashboard", dashboardRoutes)

// Rota de teste
app.get("/api/health", (req, res) => {
  res.json({ message: "API funcionando!", timestamp: new Date().toISOString() })
})

// Middleware de erro global
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: "Algo deu errado!" })
})

// Configurar cron jobs para importação automática
if (process.env.NODE_ENV === "production") {
  setupCronJobs()
  console.log("Cron jobs ativados para produção")
}

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`)
})
