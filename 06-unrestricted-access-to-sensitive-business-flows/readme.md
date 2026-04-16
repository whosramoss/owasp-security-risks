# [API-6]: Unrestricted Access to Sensitive Business Flows

## What is it?

Unrestricted Access to Sensitive Business Flows occurs when critical API business flows — such as purchases, bookings, or sending SMS codes — do not have protections against excessive automation. An attacker can use bots to deplete product stock, escalate costs of paid APIs, or manipulate business outcomes.

Unlike [API-4] (which deals with server resource consumption), here the impact is direct on the **business flow**: stock depleted, promotion abuse, ticket scalping, etc.

## Vulnerable Example

```js
// No quantity limit, no purchase history, no rate limiting
app.post("/api/purchase", verifyToken, (req, res) => {
  const { quantity } = req.body;
  product.stock -= quantity;
  res.json({ message: `Purchased ${quantity} units` });
});
```

A bot can make hundreds of requests and buy all stock in seconds.

## Secure Example

```js
const purchaseLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 3, // maximum 3 purchases per IP per day
});

app.post("/api/purchase", verifyToken, purchaseLimiter, (req, res) => {
  if (purchaseHistory.has(username)) {
    return res
      .status(400)
      .json({ error: "You have already made a purchase today" });
  }
  if (quantity > 5) {
    return res.status(400).json({ error: "Maximum 5 units per purchase" });
  }
  // ...
});
```

## Applied Fixes

- **Rate limiting per IP**: maximum of 3 purchases per IP every 24 hours.
- **Purchase history per user**: each authenticated user can purchase only once per day.
- **Quantity limit**: maximum of 5 units per purchase.
- **Unique order ID**: each purchase generates a trackable UUID.

## How to test the vulnerability

1. Log in and send multiple `POST /api/purchase` with `quantity: 100`.
2. In the vulnerable version: stock is depleted immediately.
3. In the secure version: the second purchase returns `400 You have already made a purchase today`.

## References

- [OWASP [API-6]:2023 - Unrestricted Access to Sensitive Business Flows](https://owasp.org/API-Security/editions/2023/en/0xa6-unrestricted-access-to-sensitive-business-flows/)
