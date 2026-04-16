import express from 'express'

const app = express()
app.use(express.json())
// Missing: helmet (security headers), cors (origin restriction)

const users = [
    { id: 1, username: 'alice', email: 'alice@example.com', password: 'password123' },
    { id: 2, username: 'bob', email: 'bob@example.com', password: 'qwerty456' }
]

// Exposes sensitive fields (password) in the response
app.get('/api/users/:id', (req, res) => {
    const userId = parseInt(req.params.id)
    const user = users.find(u => u.id === userId)

    if (user) {
        res.json(user) // includes password!
    } else {
        throw new Error(`User with id ${userId} not found`)
    }
})

// Leaks stack trace to the client
app.use((err, req, res, next) => {
    console.error(err.stack)
    res.status(500).json({ error: err.message, stack: err.stack })
})

// HTTP instead of HTTPS
app.listen(3000, () => console.log('Server is running on http://localhost:3000'))
