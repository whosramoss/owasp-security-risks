import express from 'express'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import swaggerUi from 'swagger-ui-express'
import swaggerDocument from '../utils/swagger.json' with { type: 'json' }

const app = express()
app.use(express.json())
app.use(helmet())

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
})
app.use(apiLimiter)

// API documentation — makes versioning explicit and trackable
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

const apiVersions = {
    v1: '1.0.0',
    v2: '2.0.0-beta'
}

const versionCheck = (req, res, next) => {
    const version = req.path.split('/')[2]
    if (!apiVersions[version]) {
        return res.status(400).json({ error: 'Invalid API version' })
    }
    next()
}

// v1: stable production version
app.get('/api/v1/users/:id', versionCheck, (req, res) => {
    const userData = { id: req.params.id, name: 'John Doe', email: 'john@example.com' }
    res.json(userData)
})

// v2: only available outside production, sensitive data masked even here
if (process.env.NODE_ENV !== 'production') {
    app.get('/api/v2/users/:id', versionCheck, (req, res) => {
        const last4 = req.params.id.slice(-4).padStart(4, '0')
        const userData = {
            id: req.params.id,
            name: 'John Doe',
            email: 'john@example.com',
            ssn: `XXX-XX-${last4}`,
            creditCard: `XXXX-XXXX-XXXX-${last4}`
        }
        res.json(userData)
    })
}

// Request logging for inventory awareness
app.use((req, _res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`)
    next()
})

app.use((_req, res) => {
    res.status(404).json({ error: 'Not Found' })
})

const port = process.env.PORT || 3000
app.listen(port, () => console.log(`Server is running on http://localhost:${port}`))
