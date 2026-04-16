# Testing Guide — OWASP Top 10 API Security

Manual testing guide for the endpoints in `app.js` (aggregated secure implementation).

## About JWT tokens in this file

The `Authorization` tokens present in this file are **safe to version in Git** for two reasons:

1. **They are already expired** — they were generated with `expiresIn: '1h'` in July 2024. No server will accept them.
2. **The `SECRET_KEY` is `randomUUID()`** — regenerated at each server restart. Even if the tokens were not expired, the signature would be invalid in any environment different from the original.

This is different from files that **should not be committed**, such as:

- `.env` with fixed `DATABASE_URL`, `API_KEY` or `SECRET_KEY`
- Tokens for paid APIs (AWS, Stripe, Twilio)
- Private SSH keys or TLS certificates

> **How to use this guide:** run the _Register_ and _Login_ steps first to get a fresh JWT token. Replace the tokens in the examples below with the returned token before testing protected endpoints.

---

## [API-2] — Broken Auth

### Register (weak password — vulnerable demonstration)

```http
POST http://localhost:3000/register
Content-Type: application/json

{
    "username": "ramos",
    "password": "secret"
}
```

### Register (strong password — secure implementation)

```http
POST http://localhost:3000/register
Content-Type: application/json

{
    "username": "ramos",
    "password": "Rahasia!"
}
```

### Login — get JWT token

```http
POST http://localhost:3000/login
Content-Type: application/json

{
    "username": "ramos",
    "password": "Rahasia!"
}
```

### Login — admin

```http
POST http://localhost:3000/login
Content-Type: application/json

{
    "username": "admin",
    "password": "test"
}
```

### Password reset (requires valid JWT + current password)

```http
POST http://localhost:3000/reset-password
Content-Type: application/json
Authorization: <your-jwt-token>

{
    "currentPassword": "Rahasia!",
    "newPassword": "Mysecret!"
}
```

---

## [API-1] — Broken Object Level Authorization

### Request without authentication (expected: 401)

```http
GET http://localhost:3000/shops/toyota/revenue
```

### Authenticated request but without permission (expected: 403)

```http
GET http://localhost:3000/shops/nike/revenue
Authorization: <ramos-token>
```

### Authenticated and authorized request (expected: 200)

```http
GET http://localhost:3000/shops/toyota/revenue
Authorization: <ramos-token>
```

---

## [API-3] — Broken Object Property Level Authorization

### Booking approval with mass assignment attempt

Sends `price` along — in the secure version the field is ignored and does not appear in the response.

```http
POST http://localhost:3000/api/host/approve_booking/1
Content-Type: application/json
Authorization: <your-jwt-token>

{
    "approved": true,
    "comment": "Approved",
    "price": 10000000
}
```

---

## [API-4] — Unrestricted Resource Consumption

### SMS code sending (endpoint with monetize limiter)

```http
POST http://localhost:3000/sms_forgot_password
```

---

## [API-5] — Broken Function Level Authorization

### Invite user (requires admin role)

```http
POST http://localhost:3000/api/invites/new
Content-Type: application/json
Authorization: <admin-token>

{
    "username": "budi"
}
```

### List all users (requires admin role)

```http
GET http://localhost:3000/api/users/all
Authorization: <admin-token>
```

---

## [API-6] — Unrestricted Access to Sensitive Business Flows

### Purchase within limit (expected: 200)

```http
POST http://localhost:3000/api/purchase
Content-Type: application/json
Authorization: <your-jwt-token>

{
    "quantity": 1
}
```

### Purchase above transaction limit (expected: 400)

```http
POST http://localhost:3000/api/purchase
Content-Type: application/json
Authorization: <your-jwt-token>

{
    "quantity": 6
}
```

---

## [API-7] — Server Side Request Forgery (SSRF)

### Allowed domain URL (expected: 200)

```http
POST http://localhost:3000/api/profile/upload_picture
Content-Type: application/json

{
    "picture_url": "https://placehold.co/600x400/EEE/31343C"
}
```

### Disallowed domain URL (expected: 403)

```http
POST http://localhost:3000/api/profile/upload_picture
Content-Type: application/json

{
    "picture_url": "http://localhost:6379"
}
```

> For port scanning via SSRF, see [`ssrf-port-scaning.sh`](07-server-side-request-forgery/ssrf-port-scaning.sh).

---

## [API-8] — Security Misconfiguration

### Unprotected endpoint — exposes password in response (vulnerable version)

```http
GET http://localhost:3000/api/users/1
```

> To test with HTTPS, uncomment the `https.createServer` block at the end of `app.js` and use:
> `GET https://localhost:443/api/users/ramos`

---

## [API-9] — Improper Inventory Management

### Access to beta version (only outside production)

```http
GET http://localhost:3000/api/v2/users/1
```

---

## [API-10] — Unsafe Consumption of APIs

### Business insertion with external data

```http
POST http://localhost:3000/api/business
Content-Type: application/json

{
    "name": "ramos",
    "address": "Jakarta"
}
```

### SQL injection attempt (expected: 400 in secure version)

```http
POST http://localhost:3000/api/business
Content-Type: application/json

{
    "name": "'; DROP TABLE businesses; --",
    "address": "Jakarta"
}
```
