# [API-8]: Security Misconfiguration

## What is it?

Security Misconfiguration encompasses a wide range of configuration failures that make the API vulnerable: absence of HTTP security headers, overly permissive CORS, error messages with stack traces exposed to the client, unnecessarily returned sensitive data, and use of HTTP instead of HTTPS.

## Vulnerable Example

```js
// No helmet, no cors configured
const app = express();

app.get("/api/users/:id", (req, res) => {
  res.json(user); // returns { id, username, email, password }
});

// Stack trace exposed to client
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message, stack: err.stack });
});
```

## Secure Example

```js
app.use(helmet()); // Content-Security-Policy, HSTS, X-Frame-Options, etc.
app.use(cors({ origin: "https://example.com", methods: ["GET"] }));

app.get("/api/users/:id", (req, res) => {
  res.json({ id: user.id, username: user.username, email: user.email });
  // password is never returned
});

// Generic error without internal details
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "An unexpected error occurred" });
});
```

## Applied Fixes

- **Helmet**: automatically adds HTTP security headers (`Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options`, `Content-Security-Policy`, etc.).
- **Restricted CORS**: only `https://example.com` can make requests to the API.
- **No sensitive data exposure**: the `password` field does not exist in returned objects.
- **Secure error handling**: generic messages for the client; details only in internal logs.
- **HTTPS**: comment demonstrates how to enable HTTPS with certificates in production.

## How to test the vulnerability

1. Access `GET /api/users/1` in the vulnerable version — the password is returned.
2. Force an error (e.g., `GET /api/users/abc`) — the full stack trace is returned.
3. In the secure version: no password, no stack trace, security headers present.

## References

- [OWASP [API-8]:2023 - Security Misconfiguration](https://owasp.org/API-Security/editions/2023/en/0xa8-security-misconfiguration/)
