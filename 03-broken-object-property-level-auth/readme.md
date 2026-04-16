# [API-3]: Broken Object Property Level Authorization

## What is it?

Broken Object Property Level Authorization occurs when the API allows the client to read or modify properties of an object that it should not have access to. This includes two situations:

- **Mass assignment**: the server accepts and applies any property sent in the request body, including sensitive fields like `price`, `role`, or `balance`.
- **Excessive data exposure**: the API returns more data than necessary, exposing sensitive fields.

## Vulnerable Example

```js
app.post("/api/host/approve_booking/:id", (req, res) => {
  // Object.assign copies ALL properties from req.body to the booking
  // An attacker can send { "price": 0 } and change the price
  Object.assign(booking, req.body);
  res.json(booking); // returns including the price field
});
```

## Secure Example

```js
const ALLOWED_FIELDS = ["approved", "comment"];

app.post("/api/host/approve_booking/:id", verifyToken, (req, res) => {
  // Only allowed fields are updated
  for (const field of ALLOWED_FIELDS) {
    if (req.body[field] !== undefined) {
      booking[field] = req.body[field];
    }
  }

  // Response without sensitive fields
  res.json({
    id: booking.id,
    approved: booking.approved,
    comment: booking.comment,
  });
});
```

## Applied Fixes

- **Field allowlist**: only `approved` and `comment` can be updated — fields like `price` are ignored even if sent.
- **Filtered response**: the response omits the `price` field, avoiding exposure of sensitive data.
- **Authentication**: requires valid JWT before processing any update.

## How to test the vulnerability

1. Send `POST /api/host/approve_booking/1` with body `{ "price": 0 }`.
2. In the vulnerable version: the price is changed to 0 and returned in the response.
3. In the secure version: the `price` field is ignored and does not appear in the response.

## References

- [OWASP [API-3]:2023 - Broken Object Property Level Authorization](https://owasp.org/API-Security/editions/2023/en/0xa3-broken-object-property-level-authorization/)
