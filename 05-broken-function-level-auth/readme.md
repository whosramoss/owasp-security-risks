# [API-5]: Broken Function Level Authorization

## What is it?

Broken Function Level Authorization occurs when the API does not adequately verify if the user has permission to execute a **specific function or endpoint**, not just to access data. While [API-1] is about access to individual objects, [API-5] is about access to administrative or privileged operations.

A regular user can discover administrative endpoints (via documentation, URL conventions, or trial and error) and execute them without restriction.

## Vulnerable Example

```js
// Any authenticated user can create invites — should be admin only
app.post("/api/invites/new", verifyToken, (req, res) => {
  invites.push({ username: req.body.username, date: new Date() });
  res.status(201).json(newInvite);
});

// Any authenticated user can list all users
app.get("/api/users/all", verifyToken, (_, res) => {
  res.json(users);
});
```

## Secure Example

```js
const isAdmin = (req, res, next) => {
    if (req.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied: admin role required' })
    }
    next()
}

// Only admins can create invites
app.post('/api/invites/new', verifyToken, isAdmin, (req, res) => { ... })

// Only admins can list all users
app.get('/api/users/all', verifyToken, isAdmin, (_, res) => { ... })
```

## Applied Fixes

- **`isAdmin` middleware**: checks the `role` extracted from JWT before allowing access.
- **Role in JWT token**: the user's role is embedded in the token during authentication.
- **Filtered response**: `GET /api/users/all` returns only `username` and `role`, without exposing hashed passwords.

## How to test the vulnerability

1. Register a regular user, log in and get the token.
2. Try `POST /api/invites/new` with the regular user token.
3. In the vulnerable version: invite is created successfully.
4. In the secure version: returns `403 Access denied`.

## References

- [OWASP [API-5]:2023 - Broken Function Level Authorization](https://owasp.org/API-Security/editions/2023/en/0xa5-broken-function-level-authorization/)
