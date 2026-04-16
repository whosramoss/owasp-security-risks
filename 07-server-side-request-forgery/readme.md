# [API-7]: Server Side Request Forgery (SSRF)

## What is it?

Server Side Request Forgery (SSRF) occurs when the API accepts a URL provided by the client and makes an HTTP request from the server without validating the destination. An attacker can point to internal network services, cloud metadata (AWS, GCP), databases, or any service accessible only by the server.

## Vulnerable Example

```js
app.post("/api/profile/upload_picture", async (req, res) => {
  const { picture_url } = req.body;
  // No validation — server fetches any URL
  const response = await fetch(picture_url);
  res.json({ message: "Uploaded" });
});
```

An attacker can send `picture_url: "http://169.254.169.254/latest/meta-data/"` and obtain cloud instance metadata, or `http://localhost:6379` to interact with internal Redis.

## Secure Example

```js
const ALLOWED_DOMAINS = ["example.com", "placehold.co"];
const ALLOWED_SCHEMES = ["https"];

const isUrlAllowed = (url) => {
  const parsed = new URL(url);
  return (
    ALLOWED_SCHEMES.includes(parsed.protocol.slice(0, -1)) &&
    ALLOWED_DOMAINS.includes(parsed.hostname)
  );
};

app.post("/api/profile/upload_picture", async (req, res) => {
  if (!isUrlAllowed(picture_url)) {
    return res.status(403).json({ error: "URL not allowed" });
  }

  const response = await fetch(picture_url, {
    redirect: "error", // does not follow redirections
    signal: AbortSignal.timeout(5000),
  });

  const contentType = response.headers.get("content-type");
  if (!contentType?.startsWith("image/")) {
    return res.status(400).json({ error: "Invalid content type" });
  }
});
```

## Applied Fixes

- **Domain and scheme allowlist**: only HTTPS URLs from trusted domains are accepted.
- **No redirections**: `redirect: 'error'` prevents the server from following to unexpected destinations.
- **Timeout**: `AbortSignal.timeout(5000)` prevents the request from hanging indefinitely.
- **`Content-Type` validation**: ensures the URL points to an image, not internal data.

## How to test the vulnerability

1. Send `POST /api/profile/upload_picture` with `{ "picture_url": "http://localhost:3000/api/users/all" }`.
2. In the vulnerable version: the server will make the internal request and return the data.
3. In the secure version: returns `403 URL not allowed`.

### Port Scanning via SSRF

The script [`ssrf-port-scaning.sh`](./ssrf-port-scaning.sh) demonstrates how an attacker can use the vulnerable endpoint to scan internal server ports. Use [`attacker-server.js`](./attacker-server.js) to bring up an internal server on port 8080 as the scan target:

```bash
for port in {8000..9000}; do
  curl -X POST http://localhost:3000/api/profile/upload_picture \
  -H "Content-Type: application/json" \
  -d "{\"picture_url\": \"http://localhost:$port\"}" \
  -w "Port $port: %{http_code}\n" -o /dev/null -s
done
```

Ports that return `200` are open — the attacker can map internal services without direct network access.

## References

- [OWASP [API-7]:2023 - Server Side Request Forgery](https://owasp.org/API-Security/editions/2023/en/0xa7-server-side-request-forgery/)
