import express from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import rateLimit from 'express-rate-limit'
import { randomUUID } from 'crypto'

const app = express()
app.use(express.json())

const users = {}
const invites = []

const SECRET_KEY = randomUUID()
const SALT_ROUNDS = 10
const DEFAULT_ROLE = 'user'

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many login attempts, please try again later'
})

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']
    if (!token) return res.status(401).json({ error: 'Token is required' })

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(401).json({ error: 'Invalid token' })
        req.username = decoded.username
        req.role = decoded.role
        next()
    })
}

// Middleware that enforces admin-only access
const isAdmin = (req, res, next) => {
    if (req.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied: admin role required' })
    }
    next()
}

app.post('/register', async (req, res) => {
    const { username, password } = req.body
    if (!username || !password) return res.status(400).json({ error: 'Username and password are required' })
    if (users[username]) return res.status(400).json({ error: 'User already exists' })

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)
    users[username] = { password: hashedPassword, role: DEFAULT_ROLE }
    res.status(201).json({ message: 'User created' })
})

app.post('/login', loginLimiter, async (req, res) => {
    const { username, password } = req.body
    const user = users[username]
    if (!user) return res.status(401).json({ error: 'Invalid username or password' })

    const match = await bcrypt.compare(password, user.password)
    if (!match) return res.status(401).json({ error: 'Invalid username or password' })

    const token = jwt.sign({ username, role: user.role }, SECRET_KEY, { expiresIn: '1h' })
    res.json({ token })
})

// Secured: only admins can create invites
app.post('/api/invites/new', verifyToken, isAdmin, (req, res) => {
    const { username } = req.body
    const newInvite = { username, date: new Date() }
    invites.push(newInvite)
    res.status(201).json(newInvite)
})

// Secured: only admins can list all users
app.get('/api/users/all', verifyToken, isAdmin, (_, res) => {
    res.json(Object.keys(users).map(u => ({ username: u, role: users[u].role })))
})

app.listen(3000, () => console.log('Server is running on http://localhost:3000'))
