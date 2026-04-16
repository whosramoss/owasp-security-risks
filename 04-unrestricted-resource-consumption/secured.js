import express from 'express'
import { graphqlHTTP } from 'express-graphql'
import { buildSchema } from 'graphql'
import sharp from 'sharp'
import rateLimit from 'express-rate-limit'

const app = express()

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests, please try again later'
})

const graphqlBatchLimit = (limit) => (req, res, next) => {
    if (Array.isArray(req.body) && req.body.length > limit) {
        return res.status(400).json({
            errors: [{ message: `Batch operations are limited to ${limit} per request.` }]
        })
    }
    next()
}

const processThumbnail = async (base64Image) => {
    if (base64Image.length > 1_000_000) {
        throw new Error('Image too large: maximum size is ~750KB')
    }

    const buff = Buffer.from(base64Image, 'base64')
    await sharp(buff).resize(200, 200).toBuffer()
    return 'http://example.com/thumbnail.jpg'
}

const schema = buildSchema(`
    type Mutation {
        uploadPic(name: String!, base64Pic: String!): PicUploadResult
    }

    type PicUploadResult {
        url: String
    }

    type Query {
        dummy: String
    }
`)

const root = {
    uploadPic: async ({ base64Pic }) => {
        const url = await processThumbnail(base64Pic)
        return { url }
    },
    dummy: () => 'dummy'
}

// Rate limiting + batch limiting protect against resource exhaustion
app.use('/graphql', apiLimiter, graphqlBatchLimit(10), graphqlHTTP({
    schema,
    rootValue: root,
    graphiql: true
}))

app.listen(3000, () => console.log('Server is running on http://localhost:3000'))
