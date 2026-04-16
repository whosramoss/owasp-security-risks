# [API-9]: Improper Inventory Management

## What is it?

Improper Inventory Management occurs when an organization does not have adequate visibility and control over its APIs: old versions exposed in production, beta APIs accessible without protection, lack of documentation, absence of monitoring, and poorly defined deprecation strategies.

Attackers exploit old or undocumented versions that often have fewer protections than the current version.

## Vulnerable Example

```js
// v2 beta exposed in production without protection and with sensitive data
app.get("/api/v2/users/:id", (req, res) => {
  res.json({
    id: req.params.id,
    ssn: "123-45-6789", // real sensitive data
    creditCard: "1234-5678-9012-3456",
  });
});
```

Anyone who discovers `/api/v2/` obtains sensitive data that v1 would not expose.

## Secure Example

```js
// v2 only available outside production, with masked data
if (process.env.NODE_ENV !== "production") {
  app.get("/api/v2/users/:id", versionCheck, (req, res) => {
    res.json({
      ssn: `XXX-XX-${last4}`,
      creditCard: `XXXX-XXXX-XXXX-${last4}`,
    });
  });
}

// Documentation via Swagger
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Logging middleware to track which endpoints are accessed
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});
```

## Applied Fixes

- **Environment control**: v2 is only mounted when `NODE_ENV !== 'production'`.
- **Data masking**: even in beta, sensitive data like SSN and card are masked.
- **Version validation**: `versionCheck` middleware rejects invalid versions with `400`.
- **Swagger documentation**: explicit inventory of available endpoints.
- **Logging**: all requests are logged for monitoring and auditing.

## How to test the vulnerability

1. In the vulnerable version, access `GET /api/v2/users/1` — SSN and card are returned.
2. In the secure version with `NODE_ENV=production`, `/api/v2/` returns `404`.
3. Without `NODE_ENV=production`, data is returned masked.

## References

- [OWASP [API-9]:2023 - Improper Inventory Management](https://owasp.org/API-Security/editions/2023/en/0xa9-improper-inventory-management/)
