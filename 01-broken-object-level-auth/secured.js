import express from "express";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";

const app = express();
app.use(express.json());

const SECRET_KEY = randomUUID();

const revenueData = {
  nike: { revenue: 10000, owner: "john" },
  apple: { revenue: 20000, owner: "tim" },
  toyota: { revenue: 30000, owner: "ramos" },
};

const users = {
  ramos: { password: "secret" },
  john: { password: "password" },
  tim: { password: "credential" },
};

const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token) return res.status(401).json({ error: "Token is required" });

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) return res.status(401).json({ error: "Invalid token" });
    req.username = decoded.username;
    next();
  });
};

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const user = users[username];

  if (user && user.password === password) {
    const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: "1h" });
    res.json({ token });
  } else {
    res.status(401).json({ error: "Invalid username or password" });
  }
});

// Secured: verifies JWT and checks that the authenticated user owns the shop
app.get("/shops/:shopName/revenue", verifyToken, (req, res) => {
  const { shopName } = req.params;
  const { username } = req;
  const shopRevenue = revenueData[shopName];

  if (!shopRevenue) {
    return res.status(404).json({ error: "Shop not found" });
  }

  if (shopRevenue.owner !== username) {
    return res
      .status(403)
      .json({ error: "Access denied: you are not the owner of this shop" });
  }

  res.json({ revenue: shopRevenue.revenue });
});

app.listen(3000, () =>
  console.log("Server is running on http://localhost:3000"),
);
