import express from "express";

const app = express();
app.use(express.json());

// Vulnerable: no validation on picture_url — attacker can point to internal services
// e.g. http://169.254.169.254/metadata (cloud metadata), http://localhost:6379 (Redis), etc.
app.post("/api/profile/upload_picture", async (req, res) => {
  const { picture_url } = req.body;

  try {
    const response = await fetch(picture_url);
    res.status(200).json({ message: "Profile picture uploaded successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch the image" });
  }
});

app.listen(3000, () =>
  console.log("Server is running on http://localhost:3000"),
);
