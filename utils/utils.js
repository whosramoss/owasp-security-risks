import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import sharp from "sharp";
import { buildSchema } from "graphql";
import { URL } from "url";
import { randomUUID } from "crypto";

export const SECRET_KEY = randomUUID();
export const SALT_ROUNDS = 10;
export const DEFAULT_ROLE = "user";
export const ALLOWED_DOMAINS = ["example.com", "placehold.co"];
export const ALLOWED_SCHEMES = ["https"];
export const apiVersions = { v1: "1.0.0", v2: "2.0.0-beta" };

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many login attempts, please try again later",
});

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

export const monetizeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: "You have exceeded the hourly limit for this action",
});

export const purchaseLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 3,
  message: "You have exceeded the daily purchase limit",
});

export const signToken = (payload) =>
  jwt.sign(payload, SECRET_KEY, { expiresIn: "1h" });

export const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token) return res.status(401).json({ error: "Token is required" });

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) return res.status(401).json({ error: "Invalid token" });
    req.username = decoded.username;
    req.role = decoded.role;
    next();
  });
};

export const isAdmin = (req, res, next) => {
  if (req.role !== "admin") {
    return res
      .status(403)
      .json({ error: "Access denied. Admin role required." });
  }
  next();
};

export const graphqlBatchLimit = (limit) => (req, res, next) => {
  if (Array.isArray(req.body) && req.body.length > limit) {
    return res.status(400).json({
      errors: [
        { message: `Batch operations are limited to ${limit} per request.` },
      ],
    });
  }
  next();
};

export const versionCheck = (req, res, next) => {
  const version = req.path.split("/")[2];
  if (!apiVersions[version]) {
    return res.status(400).json({ error: "Invalid API version" });
  }
  next();
};

export const passwordCheck = (password) => {
  if (password.length < 8) return "Password must be at least 8 characters";

  if (!/[a-z]/.test(password))
    return "Password must contain at least one lowercase character";

  if (!/[A-Z]/.test(password))
    return "Password must contain at least one uppercase character";

  if (!/[!@$%^&*.?]/.test(password))
    return "Password must contain at least one special character";

  return null;
};

export const sanitizeEnrichedData = (data) => {
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

export const isUrlAllowed = (url) => {
  try {
    const parsed = new URL(url);
    return (
      ALLOWED_SCHEMES.includes(parsed.protocol.slice(0, -1)) &&
      ALLOWED_DOMAINS.includes(parsed.hostname)
    );
  } catch {
    return false;
  }
};

const processThumbnail = async (base64Image) => {
  if (base64Image > 1_000_000) throw new Error("Image is too large");
  const buff = Buffer.from(base64Image, "base64");
  await sharp(buff).resize(200, 200).toBuffer();
  return "http://example.com/thumbnail.jpg";
};

export const schema = buildSchema(`
    type Mutation {
        uploadPic(name: String!, base64Pic: String!): PicUploadResult
    }

    type PicUploadResult {
        url: String
    }

    type Query {
        dummy: String
    }
`);

export const graphqlRoot = {
  uploadPic: async ({ base64Pic }) => {
    const url = await processThumbnail(base64Pic);
    return { url };
  },
  dummy: () => "dummy",
};
