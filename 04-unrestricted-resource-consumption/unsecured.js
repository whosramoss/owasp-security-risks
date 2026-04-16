import express from 'express'
import { graphqlHTTP } from 'express-graphql'
import { buildSchema } from 'graphql'
import sharp from 'sharp'

const app = express()

const processThumbnail = async (base64Image) => {
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
        // No size validation — any image size is processed
        const url = await processThumbnail(base64Pic)
        return { url }
    },
    dummy: () => 'dummy'
}

// No rate limiting, no batch limit — susceptible to DoS via huge batches or large payloads
app.use('/graphql', graphqlHTTP({
    schema,
    rootValue: root,
    graphiql: true
}))

app.listen(3000, () => console.log('Server is running on http://localhost:3000'))
