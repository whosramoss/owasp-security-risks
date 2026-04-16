import express from 'express'
import sqlite3 from 'sqlite3'

const app = express()
app.use(express.json())

const db = new sqlite3.Database(':memory:')
db.run('CREATE TABLE businesses (id INTEGER PRIMARY KEY, name TEXT, address TEXT, enriched_data TEXT)')

// Vulnerabilities:
// 1. No input validation or sanitization
// 2. SQL injection via string interpolation
// 3. No timeout for external API calls
// 4. No size limit on third-party response
// 5. Third-party data used without sanitization
app.post('/api/business', async (req, res) => {
    const { name, address } = req.body

    try {
        const response = { data: { some: 'data' } } // simulate 3rd party API response

        // SQL injection: an attacker can inject via name or address
        db.run(
            `INSERT INTO businesses (name, address, enriched_data) VALUES ('${name}', '${address}', '${JSON.stringify(response.data)}')`,
            err => {
                if (err) {
                    res.status(500).json({ error: 'Failed to save business' })
                } else {
                    res.status(201).json({ message: 'Business added successfully' })
                }
            }
        )
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

app.listen(3000, () => console.log('Server is running on http://localhost:3000'))
