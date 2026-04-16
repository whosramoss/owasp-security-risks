# [API-4]: Unrestricted Resource Consumption

## What is it?

Unrestricted Resource Consumption occurs when an API does not limit the volume or frequency of requests, allowing an attacker to excessively consume server resources (CPU, memory, bandwidth, third-party API costs). This can lead to denial of service (DoS) attacks or unexpected financial costs.

Unlike rate limiting for authentication (which prevents brute force), rate limiting here protects the API's computational and operational resources.

## Vulnerable Example

```js
// No rate limiting and no size validation
app.use(
  "/graphql",
  graphqlHTTP({
    schema,
    rootValue: root,
    graphiql: true,
  }),
);

const processThumbnail = async (base64Image) => {
  const buff = Buffer.from(base64Image, "base64");
  await sharp(buff).resize(200, 200).toBuffer(); // processes any size
};
```

An attacker can send thousands of batch requests with huge images, exhausting CPU and memory.

## Secure Example

```js
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 })

const graphqlBatchLimit = (limit) => (req, res, next) => {
    if (Array.isArray(req.body) && req.body.length > limit) {
        return res.status(400).json({ errors: [{ message: `Max ${limit} operations per request` }] })
    }
    next()
}

// Image size limit
if (base64Image.length > 1_000_000) throw new Error('Image too large')

app.use('/graphql', apiLimiter, graphqlBatchLimit(10), graphqlHTTP({ ... }))
```

## Applied Fixes

- **General rate limiting**: maximum of 100 requests per IP every 15 minutes.
- **GraphQL batch limit**: maximum of 10 operations per batch request.
- **Payload size validation**: images larger than ~750KB are rejected before processing.

## How to test the vulnerability

1. Send a GraphQL batch request with more than 10 operations.
2. In the vulnerable version: all are processed.
3. In the secure version: returns `400` with limit exceeded message.

## References

- [OWASP [API-4]:2023 - Unrestricted Resource Consumption](https://owasp.org/API-Security/editions/2023/en/0xa4-unrestricted-resource-consumption/)
