import express from "express";
import sqlite3 from "sqlite3";
import { body, validationResult } from "express-validator";

const app = express();
app.use(express.json());

const db = new sqlite3.Database(":memory:");
db.run(
  "CREATE TABLE businesses (id INTEGER PRIMARY KEY, name TEXT, address TEXT, enriched_data TEXT)",
);

const ALLOWED_REDIRECT_DOMAINS = ["[API-1].example.com", "[API-2].example.com"];

const sanitizeEnrichedData = (data) => {
  const sanitized = {};
  if (typeof data.enrichedAddress === "string") {
    sanitized.enrichedAddress = data.enrichedAddress.trim().slice(0, 200);
  }
  if (typeof data.latitude === "number" && !isNaN(data.latitude)) {
    sanitized.latitude = data.latitude;
  }
  if (typeof data.longitude === "number" && !isNaN(data.longitude)) {
    sanitized.longitude = data.longitude;
  }
  return sanitized;
};

app.post(
  "/api/business",
  [
    body("name").isString().trim().escape(),
    body("address").isString().trim().escape(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, address } = req.body;

    try {
      // Simulate external HTTPS API call with timeout and redirect control
      // const response = await fetch(`https://third-party-api.example.com/enrich?address=${encodeURIComponent(address)}`, {
      //     signal: AbortSignal.timeout(5000),
      //     redirect: 'error'
      // })
      // if (!response.ok) throw new Error('External API error')
      // const rawData = await response.json()
      const rawData = { enrichedAddress: "Bandung", latitude: 1, longitude: 0 };

      // Validate and sanitize third-party data before using it
      const enrichedData = sanitizeEnrichedData(rawData);

      // Parameterized query prevents SQL injection
      db.run(
        "INSERT INTO businesses (name, address, enriched_data) VALUES (?, ?, ?)",
        [name, address, JSON.stringify(enrichedData)],
        (err) => {
          if (err) {
            res.status(500).json({ error: "Failed to save business" });
          } else {
            res.status(201).json({ message: "Business added successfully" });
          }
        },
      );
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

app.listen(3000, () =>
  console.log("Server is running on http://localhost:3000"),
);
