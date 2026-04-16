import express from 'express'
import jwt from 'jsonwebtoken'
import { randomUUID } from 'crypto'

const app = express()
app.use(express.json())

const SECRET_KEY = randomUUID()

const bookings = {
    1: { id: 1, approved: false, comment: '', price: 100 }
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

// Secured: only allows updating a specific allowlist of properties
app.post('/api/host/approve_booking/:id', verifyToken, (req, res) => {
    const bookingId = Number(req.params.id)
    const booking = bookings[bookingId]

    if (!booking) {
        return res.status(404).json({ error: 'Booking not found' })
    }

    const ALLOWED_FIELDS = ['approved', 'comment']
    for (const field of ALLOWED_FIELDS) {
        if (req.body[field] !== undefined) {
            booking[field] = req.body[field]
        }
    }

    // Return only non-sensitive fields to avoid data leakage
    res.json({
        id: booking.id,
        approved: booking.approved,
        comment: booking.comment
    })
})

app.listen(3000, () => console.log('Server is running on http://localhost:3000'))
