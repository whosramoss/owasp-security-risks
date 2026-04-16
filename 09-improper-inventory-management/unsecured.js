import express from 'express'

const app = express()
app.use(express.json())

// v1 API (production)
app.get('/api/v1/users/:id', (req, res) => {
    const userData = { id: req.params.id, name: 'John Doe', email: 'john@example.com' }
    res.json(userData)
})

// v2 API (beta) — exposed in production with sensitive data and no protection
app.get('/api/v2/users/:id', (req, res) => {
    const userData = {
        id: req.params.id,
        name: 'John Doe',
        email: 'john@example.com',
        ssn: '123-45-6789',          // sensitive data in beta
        creditCard: '1234-5678-9012-3456' // sensitive data in beta
    }
    res.json(userData)
})

// No documentation, no versioning strategy, no monitoring
app.use((req, res) => {
    res.status(404).send('Not Found')
})

app.listen(3000, () => console.log('Server is running on http://localhost:3000'))
