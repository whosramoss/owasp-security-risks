import express from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import rateLimit from 'express-rate-limit'
import { randomUUID } from 'crypto'

const app = express()
app.use(express.json())

const SECRET_KEY = randomUUID() // strong random key generated at startup
const SALT_ROUNDS = 10
const users = {}

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many login attempts, please try again later'
})

const passwordCheck = (password) => {
    if (password.length < 8) return 'Password must be at least 8 characters'
    if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase character'
    if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase character'
    if (!/[!@$%^&*.?]/.test(password)) return 'Password must contain at least one special character'
    return null
}

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']
    if (!token) return res.status(401).json({ error: 'Token is required' })

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(401).json({ error: 'Invalid token' })
        req.username = decoded.username
        next()
    })
}

app.post('/register', async (req, res) => {
    const { username, password } = req.body

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' })
    }
    if (users[username]) {
        return res.status(400).json({ error: 'User already exists' })
    }

    const passwordError = passwordCheck(password)
    if (passwordError) {
        return res.status(400).json({ error: passwordError })
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)
    users[username] = { password: hashedPassword }
    res.status(201).json({ message: 'User created' })
})

// Rate limited login with hashed password comparison and token expiration
app.post('/login', loginLimiter, async (req, res) => {
    const { username, password } = req.body

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' })
    }

    const user = users[username]
    if (!user) {
        return res.status(401).json({ error: 'Invalid username or password' })
    }

    const match = await bcrypt.compare(password, user.password)
    if (!match) {
        return res.status(401).json({ error: 'Invalid username or password' })
    }

    const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' })
    res.json({ token })
})

// Password reset requires JWT + current password confirmation
app.post('/reset-password', verifyToken, async (req, res) => {
    const { currentPassword, newPassword } = req.body
    const { username } = req

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current and new password are required' })
    }

    const user = users[username]
    const match = await bcrypt.compare(currentPassword, user.password)
    if (!match) {
        return res.status(401).json({ error: 'Current password is incorrect' })
    }

    const passwordError = passwordCheck(newPassword)
    if (passwordError) {
        return res.status(400).json({ error: passwordError })
    }

    users[username].password = await bcrypt.hash(newPassword, SALT_ROUNDS)
    res.json({ message: 'Password updated successfully' })
})

app.listen(3000, () => console.log('Server is running on http://localhost:3000'))
