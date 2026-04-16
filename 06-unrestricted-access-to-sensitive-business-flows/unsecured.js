import express from 'express'
import jwt from 'jsonwebtoken'
import { randomUUID } from 'crypto'

const app = express()
app.use(express.json())

const SECRET_KEY = randomUUID()

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

app.post('/login', (req, res) => {
    const { username } = req.body
    const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' })
    res.json({ token })
})

// Vulnerable: no purchase limit per user, no quantity cap — bot can buy all stock
app.post('/api/purchase', verifyToken, (req, res) => {
    const { quantity } = req.body

    if (quantity > product.stock) {
        return res.status(400).json({ error: 'Not enough stock' })
    }

    product.stock -= quantity
    res.json({ message: `Successfully purchased ${quantity} units`, remainingStock: product.stock })
})

app.listen(3000, () => console.log('Server is running on http://localhost:3000'))
