import express from "express";
import bodyParser from "body-parser";
import bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import { graphqlHTTP } from "express-graphql";
import helmet from "helmet";
import cors from "cors";
// import { readFileSync } from 'fs'
// import https from 'https'
import swaggerUi from "swagger-ui-express";
import sqlite3 from "sqlite3";
import { body, validationResult } from "express-validator";
import swaggerDocument from "./utils/swagger.json" with { type: "json" };
import {
  SALT_ROUNDS,
  DEFAULT_ROLE,
  loginLimiter,
  apiLimiter,
  monetizeLimiter,
  purchaseLimiter,
  verifyToken,
  isAdmin,
  graphqlBatchLimit,
  versionCheck,
  passwordCheck,
  sanitizeEnrichedData,
  isUrlAllowed,
  schema,
  graphqlRoot,
  signToken,
} from "./utils/utils.js";

const app = express();
app.use(bodyParser.json());
app.use(helmet());
app.use(cors({ origin: "https://example.com", methods: ["GET", "POST"] }));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// ─── In-memory stores ─────────────────────────────────────────────────────────

const revenueData = {
  nike: { revenue: 10000, owner: "john" },
  apple: { revenue: 20000, owner: "tim" },
  toyota: { revenue: 30000, owner: "ramos" },
};
const users = { admin: { password: "test", role: "admin" } };
const bookings = { 1: { id: 1, approved: false, comment: "", price: 100 } };
const invites = [];
let product = {
  id: 1,
  name: "Limited Edition Gaming Console",
  price: 399.99,
  stock: 100,
};
const purchaseHistory = new Map();
const db = new sqlite3.Database(":memory:");
db.run(
  "CREATE TABLE businesses (id INTEGER PRIMARY KEY, name TEXT, address TEXT, enriched_data TEXT)",
);

// ─── [API-2]: Broken Authentication ──────────────────────────────────────────────

app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res
      .status(400)
      .json({ error: "Username and password are required" });
  if (users[username])
    return res.status(400).json({ error: "User already exists" });

  const passwordError = passwordCheck(password);
  if (passwordError) return res.status(400).json({ error: passwordError });

  users[username] = {
    password: await bcrypt.hash(password, SALT_ROUNDS),
    role: DEFAULT_ROLE,
  };
  res.status(201).json({ message: "User created" });
});

app.post("/login", loginLimiter, async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res
      .status(400)
      .json({ error: "Username and password are required" });

  const user = users[username];
  if (!user)
    return res.status(401).json({ error: "Invalid username or password" });

  const match = await bcrypt.compare(password, user.password);
  if (!match)
    return res.status(401).json({ error: "Invalid username or password" });

  res.json({ token: signToken({ username, role: user.role }) });
});

app.post("/reset-password", verifyToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword)
    return res
      .status(400)
      .json({ error: "Current password and new password are required" });

  const user = users[req.username];
  if (!(await bcrypt.compare(currentPassword, user.password)))
    return res.status(401).json({ error: "Current password is incorrect" });

  const passwordError = passwordCheck(newPassword);
  if (passwordError) return res.status(400).json({ error: passwordError });

  users[req.username].password = await bcrypt.hash(newPassword, SALT_ROUNDS);
  res.json({ message: "Password updated successfully" });
});

// ─── [API-1]: Broken Object Level Authorization ──────────────────────────────────

app.get("/shops/:shopName/revenue", verifyToken, (req, res) => {
  const shopRevenue = revenueData[req.params.shopName];
  if (!shopRevenue) return res.status(404).json({ error: "Shop not found" });
  if (shopRevenue.owner !== req.username)
    return res.status(403).json({ error: "You are not the owner" });
  res.json({ revenue: shopRevenue.revenue });
});

// ─── [API-3]: Broken Object Property Level Authorization ─────────────────────────

app.post("/api/host/approve_booking/:id", verifyToken, (req, res) => {
  const booking = bookings[Number(req.params.id)];
  if (!booking) return res.status(404).json({ error: "Booking not found" });

  for (const prop of ["approved", "comment"]) {
    booking[prop] = req.body[prop];
  }

  res.json({
    id: booking.id,
    approved: booking.approved,
    comment: booking.comment,
  });
});

// ─── [API-4]: Unrestricted Resource Consumption ──────────────────────────────────

app.use(
  "/graphql",
  apiLimiter,
  graphqlBatchLimit(10),
  graphqlHTTP({
    schema,
    rootValue: graphqlRoot,
    graphiql: true,
  }),
);

let smsCreditBalance = 100;
app.post("/sms_forgot_password", monetizeLimiter, async (_, res) => {
  const response = await fetch(
    "http://localhost:3000/sms/send_reset_pass_code",
  );
  if (response.ok) res.json(await response.json());
});

app.get("/sms/send_reset_pass_code", (_, res) => {
  smsCreditBalance--;
  const code = Math.floor(Math.random() * 10000);
  console.log(code, smsCreditBalance);
  res.json({ code });
});

// ─── [API-5]: Broken Function Level Authorization ────────────────────────────────

app.post("/api/invites/new", verifyToken, isAdmin, (req, res) => {
  const newInvite = { username: req.body.username, date: new Date() };
  invites.push(newInvite);
  res.status(201).json(newInvite);
});

app.get("/api/users/all", verifyToken, isAdmin, (_, res) => {
  res.json(users);
});

// ─── [API-6]: Unrestricted Access to Sensitive Business Flows ────────────────────

app.post("/api/purchase", verifyToken, purchaseLimiter, (req, res) => {
  const { quantity } = req.body;
  if (purchaseHistory.has(req.username))
    return res.status(400).json({ error: "Purchase already made today" });
  if (quantity > 5)
    return res
      .status(400)
      .json({ error: "Maximum 5 items allowed per purchase" });
  if (quantity > product.stock)
    return res.status(400).json({ error: "Not enough stock" });

  const orderId = randomUUID();
  purchaseHistory.set(req.username, { orderId, quantity, date: new Date() });
  product.stock -= quantity;
  res.json({
    message: `Successfully purchased ${quantity} units`,
    orderId,
    remainingStock: product.stock,
  });
});

// ─── [API-7]: Server Side Request Forgery ───────────────────────────────────────

app.post("/api/profile/upload_picture", async (req, res) => {
  const { picture_url } = req.body;
  if (!picture_url || typeof picture_url !== "string")
    return res.status(400).json({ error: "Invalid picture_url" });
  if (!isUrlAllowed(picture_url))
    return res.status(400).json({ error: "URL not allowed" });

  try {
    const response = await fetch(picture_url, {
      redirect: "error",
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok)
      return res.status(400).json({ error: "Failed to fetch the image" });

    const contentType = response.headers.get("content-type");
    if (!contentType?.startsWith("image/"))
      return res.status(400).json({ error: "Invalid content type" });

    res.json({ message: "Image uploaded successfully" });
  } catch (error) {
    res
      .status(400)
      .json({ error: `Failed to fetch the image: ${error.message}` });
  }
});

// ─── [API-8]: Security Misconfiguration ─────────────────────────────────────────

app.get("/api/users/:username", (req, res) => {
  const user = users[req.params.username];
  if (!user) return res.status(404).json({ error: "User not found" });
  const { password, ...safeUser } = user;
  res.json(safeUser);
});

// ─── [API-9]: Improper Inventory Management ──────────────────────────────────────

app.get(
  "/api/v1/users/:id",
  versionCheck,
  verifyToken,
  apiLimiter,
  (req, res) => {
    res.json({
      id: req.params.id,
      name: "John Doe",
      email: "john@example.com",
    });
  },
);

if (process.env.NODE_ENV !== "production") {
  app.get(
    "/api/v2/users/:id",
    versionCheck,
    verifyToken,
    apiLimiter,
    (req, res) => {
      res.json({
        id: req.params.id,
        name: "John Doe",
        email: "john@example.com",
        ssn: "123-45-6789",
        creditCard: "1234-5678-9012-3456",
      });
    },
  );
}

// ─── [API-10]: Unsafe Consumption of APIs ───────────────────────────────────────

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

    const { name, address } = req.body;

    try {
      const rawData = { enrichedAddress: "Bandung", latitude: 1, longitude: 0 };
      const enrichedData = sanitizeEnrichedData(rawData);

      db.run(
        "INSERT INTO businesses (name, address, enriched_data) VALUES (?, ?, ?)",
        [name, address, JSON.stringify(enrichedData)],
        (err) =>
          err
            ? res.status(500).json({ error: "Error storing data" })
            : res.status(201).json({ message: "Business added successfully" }),
      );
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

// ─── Global Middleware ────────────────────────────────────────────────────────

app.use((req, _, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "An unexpected error occurred" });
});

/* Enable HTTPS in production:
const options = {
    key: readFileSync('private-key.pem'),
    cert: readFileSync('certificate.pem')
}
https.createServer(options, app).listen(443, () => {
    console.log('Server is running on https://localhost:443')
})
*/

app.listen(3000, () =>
  console.log("Server is running on http://localhost:3000"),
);
