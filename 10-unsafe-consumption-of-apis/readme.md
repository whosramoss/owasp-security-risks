# [API-10]: Unsafe Consumption of APIs

## What is it?

Unsafe Consumption of APIs occurs when an application consumes third-party APIs without applying adequate validation, sanitization, and security precautions. Developers tend to blindly trust data returned by external services, which can result in SQL injection, malicious code execution, or data compromise if the third-party API is compromised or returns malicious data.

## Vulnerable Example

```js
app.post("/api/business", async (req, res) => {
  const { name, address } = req.body; // no input validation

  const response = { data: { some: "data" } }; // unsanitized 3rd party data

  // SQL injection: name or address may contain malicious SQL
  db.run(
    `INSERT INTO businesses VALUES ('${name}', '${address}', '${JSON.stringify(response.data)}')`,
  );
});
```

An attacker can send `name: "'; DROP TABLE businesses; --"` and destroy the database.

## Secure Example

```js
app.post(
  "/api/business",
  [
    body("name").isString().trim().escape(),
    body("address").isString().trim().escape(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const rawData = await fetchExternalApi(address); // with timeout and no redirections
    const enrichedData = sanitizeEnrichedData(rawData); // sanitizes external data

    // Parameterized query: no SQL injection risk
    db.run("INSERT INTO businesses VALUES (?, ?, ?)", [
      name,
      address,
      JSON.stringify(enrichedData),
    ]);
  },
);
```

## Applied Fixes

- **Input validation**: `express-validator` ensures `name` and `address` are valid strings and sanitized.
- **Parameterized query**: use of `?` as placeholders in SQLite eliminates SQL injection.
- **External data sanitization**: `sanitizeEnrichedData` validates types and limits size before storing.
- **Timeout and redirect control**: the external API call uses `AbortSignal.timeout(5000)` and `redirect: 'error'` (demonstrated in comment).

## How to test the vulnerability

1. Send `POST /api/business` with `{ "name": "'; DROP TABLE businesses; --", "address": "rua" }`.
2. In the vulnerable version: the table may be destroyed (SQL injection).
3. In the secure version: `express-validator` rejects the input with `400 Bad Request`.

## References

- [OWASP [API-10]:2023 - Unsafe Consumption of APIs](https://owasp.org/API-Security/editions/2023/en/0xaa-unsafe-consumption-of-apis/)
