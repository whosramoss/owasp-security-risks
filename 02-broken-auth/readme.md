# [API-2]: Broken Authentication

## What is it?

Broken Authentication covers failures in the design and implementation of authentication mechanisms. Common problems include: absence of rate limiting (allowing brute force), passwords stored in plain text, weak JWT keys, no token expiration, and password reset without validating the current password.

## Vulnerable Example

```js
const SECRET_KEY = "secret"; // weak and static key

app.post("/login", (req, res) => {
  // No rate limiting, plain text password, token without expiration
  if (user && user.password === password) {
    const token = jwt.sign({ username }, SECRET_KEY);
    res.json({ token });
  }
});

app.post("/reset-password", (req, res) => {
  // Anyone can reset the password without authentication
  user.password = newPassword;
});
```

## Secure Example

```js
const SECRET_KEY = randomUUID(); // strong random key generated at startup

app.post("/login", loginLimiter, async (req, res) => {
  const match = await bcrypt.compare(password, user.password); // bcrypt hash
  const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: "1h" });
});

app.post("/reset-password", verifyToken, async (req, res) => {
  // Requires valid JWT + confirmation of current password
  const match = await bcrypt.compare(currentPassword, user.password);
});
```

## Applied Fixes

- **Rate limiting**: maximum of 5 login attempts per 15 minutes per IP.
- **Password hashing**: bcrypt with 10 rounds — passwords never stored in plain text.
- **Strong JWT key**: randomly generated with `randomUUID()` at each startup.
- **Token expiration**: token expires in 1 hour.
- **Password strength validation**: minimum 8 characters, uppercase, lowercase, and special.
- **Secure reset**: requires valid JWT and confirmation of current password.

## How to test the vulnerability

1. In the vulnerable version, try logging in repeatedly with wrong passwords — no blocking.
2. Try `/reset-password` with any `username` without token — it works.
3. In the secure version, after 5 wrong attempts the response changes to `429 Too Many Requests`.
4. The reset requires `Authorization` header with valid JWT.

## References

- [OWASP [API-2]:2023 - Broken Authentication](https://owasp.org/API-Security/editions/2023/en/0xa2-broken-authentication/)
