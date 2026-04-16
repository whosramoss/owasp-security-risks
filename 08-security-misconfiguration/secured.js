import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
// import https from 'https'
// import { readFileSync } from 'fs'

const app = express()
app.use(express.json())
app.use(helmet()) // sets X-Content-Type-Options, X-Frame-Options, HSTS, etc.
app.use(cors({
    origin: 'https://example.com',
    methods: ['GET']
}))

const users = [
    { id: 1, username: 'alice', email: 'alice@example.com' },
    { id: 2, username: 'bob', email: 'bob@example.com' }
    // passwords are never stored here — use a DB with bcrypt hashes
]

// Secured: no sensitive fields, no stack traces, proper CORS and security headers
app.get('/api/users/:id', (req, res) => {
    const userId = parseInt(req.params.id)
    const user = users.find(u => u.id === userId)

    if (user) {
        res.json(user)
    } else {
        res.status(404).json({ error: 'User not found' })
    }
})

// Global error handler: never exposes internal details to the client
app.use((err, _req, res, _next) => {
    console.error(err) // log internally only
    res.status(500).json({ error: 'An unexpected error occurred' })
})

/* Enable HTTPS in production:
const options = {
    key: readFileSync('private-key.pem'),
    cert: readFileSync('certificate.pem')
}
https.createServer(options, app).listen(443, () => {
    console.log('HTTPS Server running on port 443')
})
*/
app.listen(3000, () => console.log('Server is running on http://localhost:3000'))
