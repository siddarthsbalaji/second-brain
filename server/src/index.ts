import'dotenv/config'
import express from'express'
import cors from'cors'
import rateLimit from'express-rate-limit'
import authRoutes from'./routes/auth'
import calendarRoutes from'./routes/calendar'
import eventRoutes from'./routes/events'
import journalRoutes from'./routes/journal'
import noteRoutes from'./routes/notes'
import searchRoutes from'./routes/search'
import taskRoutes from'./routes/tasks'
import folderRoutes from'./routes/folders'
import habitRoutes from'./routes/habits'
import attachmentRoutes from'./routes/attachments'
import path from'path'
import { errorHandler } from'./middleware/errorHandler'
if (!process.env.JWT_SECRET||process.env.JWT_SECRET.length<32) {
  console.error('JWT_SECRET must be set in .env and be at least 32 characters (e.g. openssl rand -base64 32).')
  process.exit(1)
}
const app=express()
const PORT=process.env.PORT||5000
const frontendOrigins =
  process.env.FRONTEND_ORIGINS?.split(',')
    .map((s) => s.trim())
    .filter(Boolean) ?? ['http://localhost:5173']
app.use(
  cors({
    origin: frontendOrigins,
    methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type','Authorization'],
  })
)
app.use('/uploads', express.static(path.join(process.cwd(),'uploads')))
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true,
  legacyHeaders: false,
})

app.use('/api', apiLimiter)
app.use(express.json())
app.get('/health', (_req, res)=>{
  res.json({ status:'ok' })
})
app.use('/api/auth', authRoutes)
app.use('/api/tasks', taskRoutes)
app.use('/api/events', eventRoutes)
app.use('/api/calendar', calendarRoutes)
app.use('/api/folders', folderRoutes)
app.use('/api/notes', noteRoutes)
app.use('/api/journal', journalRoutes)
app.use('/api/search', searchRoutes)
app.use('/api/habits', habitRoutes)
app.use('/api/attachments', attachmentRoutes)
app.use(errorHandler)
const server=app.listen(PORT, ()=>{
 console.log(`Server successfully started on port ${PORT}`)
})
server.on('error', (err: any)=>{
 if (err.code==='EADDRINUSE') {
 console.error(`Port ${PORT} is already in use. Please kill the existing process or use a different port.`)
 } else {
 console.error('Server failed to start:', err)
 }
 process.exit(1)
})
// Graceful shutdown for nodemon restarts and termination signals
process.once('SIGUSR2', () => {
  process.exit(0)
})
process.on('SIGINT', () => {
  process.exit(0)
})
process.on('SIGTERM', () => {
  process.exit(0)
})
