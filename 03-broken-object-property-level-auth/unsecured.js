import express from 'express'

const app = express()
app.use(express.json())

const bookings = {
    1: { id: 1, approved: false, comment: '', price: 100 }
}

// Vulnerable: allows the client to update ANY property, including sensitive ones like price
app.post('/api/host/approve_booking/:id', (req, res) => {
    const bookingId = Number(req.params.id)
    const booking = bookings[bookingId]

    if (!booking) {
        return res.status(404).json({ error: 'Booking not found' })
    }

    Object.assign(booking, req.body) // merges all request body properties into booking

    res.json(booking)
})

app.listen(3000, () => console.log('Server is running on http://localhost:3000'))
