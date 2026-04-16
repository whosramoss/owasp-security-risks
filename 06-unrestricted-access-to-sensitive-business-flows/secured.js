import express from 'express'
import jwt from 'jsonwebtoken'
import rateLimit from 'express-rate-limit'
import { randomUUID } from 'crypto'

const app = express()
app.use(express.json())

const SECRET_KEY = randomUUID()
const purchaseHistory = new Map()

let product = {
    id: 1,
    name: 'Limited Edition Gaming Console',
    price: 399.99,
    stock: 100
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

const purchaseLimiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000,
    max: 3,
    message: 'You have exceeded the daily purchase limit'
})

app.post('/login', (req, res) => {
    const { username } = req.body
    const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' })
    res.json({ token })
})

// Secured: rate limited, quantity capped, one purchase per user per day
app.post('/api/purchase', verifyToken, purchaseLimiter, (req, res) => {
    const { quantity } = req.body
    const { username } = req

    if (purchaseHistory.has(username)) {
        return res.status(400).json({ error: 'You have already made a purchase today' })
    }

    if (quantity > 5) {
        return res.status(400).json({ error: 'Maximum 5 units per purchase' })
    }

    if (quantity > product.stock) {
        return res.status(400).json({ error: 'Not enough stock' })
    }

    const orderId = randomUUID()
    purchaseHistory.set(username, { orderId, quantity, date: new Date() })
    product.stock -= quantity

    res.json({ message: `Successfully purchased ${quantity} units`, orderId, remainingStock: product.stock })
})

app.listen(3000, () => console.log('Server is running on http://localhost:3000'))
