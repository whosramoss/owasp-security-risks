import express from 'express'
import { URL } from 'url'

const app = express()
app.use(express.json())

const ALLOWED_DOMAINS = ['example.com', 'placehold.co']
const ALLOWED_SCHEMES = ['https']

const isUrlAllowed = (url) => {
    try {
        const parsed = new URL(url)
        return (
            ALLOWED_SCHEMES.includes(parsed.protocol.slice(0, -1)) &&
            ALLOWED_DOMAINS.includes(parsed.hostname)
        )
    } catch {
        return false
    }
}

// Secured: validates URL against an allowlist of trusted domains and schemes
app.post('/api/profile/upload_picture', async (req, res) => {
    const { picture_url } = req.body

    if (!picture_url || typeof picture_url !== 'string') {
        return res.status(400).json({ error: 'Invalid picture_url' })
    }

    if (!isUrlAllowed(picture_url)) {
        return res.status(403).json({ error: 'URL not allowed: must use HTTPS from a trusted domain' })
    }

    try {
        const response = await fetch(picture_url, {
            redirect: 'error',
            signal: AbortSignal.timeout(5000)
        })

        if (!response.ok) {
            return res.status(400).json({ error: 'Failed to fetch the image' })
        }

        const contentType = response.headers.get('content-type')
        if (!contentType || !contentType.startsWith('image/')) {
            return res.status(400).json({ error: 'URL does not point to a valid image' })
        }

        res.json({ message: 'Profile picture uploaded successfully' })
    } catch (error) {
        res.status(400).json({ error: `Failed to fetch the image: ${error.message}` })
    }
})

app.listen(3000, () => console.log('Server is running on http://localhost:3000'))
