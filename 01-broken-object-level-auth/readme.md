# [API-1]: Broken Object Level Authorization (BOLA)

## What is it?

**Broken Object Level Authorization (BOLA)**, formerly known as **IDOR** (Insecure Direct Object Reference), occurs when an API fails to verify whether an authenticated user has the necessary permissions to access or manipulate a specific resource.

Instead of asking **"Does this user have rights to this specific object?"**, the API simply returns the data to anyone who provides the correct resource identifier.

## Vulnerable Example

```js
app.get("/shops/:shopName/revenue", (req, res) => {
  const shopRevenue = revenueData[req.params.shopName];
  if (shopRevenue) {
    res.json(shopRevenue); // Returns data to anyone
  }
});
```

Any user who knows (or guesses) the name of a shop can access its revenue without any identity or ownership verification.

## Secure Example

```js
app.get("/shops/:shopName/revenue", verifyToken, (req, res) => {
  const shopRevenue = revenueData[req.params.shopName];

  if (!shopRevenue) return res.status(404).json({ error: "Shop not found" });

  // Ownership check
  if (shopRevenue.owner !== req.username) {
    return res.status(403).json({ error: "Access denied" });
  }

  res.json({ revenue: shopRevenue.revenue });
});
```

## Applied Fixes

- **JWT Authentication**: The endpoint now requires a valid token via the `verifyToken` middleware.
- **Ownership Verification**: It compares the resource `owner` with the user extracted from the token before returning any data.
- **Minimal Response**: It returns only the `revenue` field, avoiding the exposure of sensitive internal fields like `owner`.

## How to Test the Vulnerability

1.  Log in as user `ramos` and obtain a token.
2.  Attempt to access `/shops/nike/revenue` (a shop belonging to user `john`).
3.  **In the vulnerable version**: The data is returned successfully.
4.  **In the secure version**: The API returns `403 Access denied`.

## References

- [OWASP [API-1]:2023 - Broken Object Level Authorization](https://owasp.org/API-Security/editions/2023/en/0xa1-broken-object-level-authorization/)
