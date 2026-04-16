import express from "express";
import jwt from "jsonwebtoken";
import bodyParser from "body-parser";

const app = express();
app.use(bodyParser.json());

// Weak secret key, passwords stored in plain text, no rate limiting
const SECRET_KEY = "secret";

const users = {
  ramos: { password: "secret" },
  john: { password: "password" },
};

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const user = users[username];

  // Plain-text password comparison, no brute-force protection
  if (user && user.password === password) {
    const token = jwt.sign({ username }, SECRET_KEY); // no expiration
    res.json({ token });
  } else {
    res.status(401).json({ error: "Invalid username or password" });
  }
});

// Password reset without confirming the current password
app.post("/reset-password", (req, res) => {
  const { username, newPassword } = req.body;
  const user = users[username];

  if (user) {
    user.password = newPassword;
    res.json({ message: "Password updated" });
  } else {
    res.status(404).json({ error: "User not found" });
  }
});

app.listen(3000, () =>
  console.log("Server is running on http://localhost:3000"),
);
