import "dotenv/config";
import cors from "cors";
import express from "express";
import mongoose from "mongoose";

const app = express();
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error("Origin is not allowed by CORS"));
  },
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));
app.use(express.json({ limit: "10kb" }));

const contactSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 1, maxlength: 100 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
  message: { type: String, required: true, trim: true, minlength: 1, maxlength: 5000 }
}, { timestamps: true });

const Contact = mongoose.model("Contact", contactSchema);

app.get("/api/health", (_request, response) => {
  const databaseConnected = mongoose.connection.readyState === 1;
  response.status(databaseConnected ? 200 : 503).json({
    status: databaseConnected ? "ok" : "database unavailable",
    databaseConnected
  });
});

app.post("/api/contact", async (request, response) => {
  const { name, email, message } = request.body ?? {};
  const trimmedName = typeof name === "string" ? name.trim() : "";
  const trimmedEmail = typeof email === "string" ? email.trim() : "";
  const trimmedMessage = typeof message === "string" ? message.trim() : "";

  if (!trimmedName || trimmedName.length > 100) {
    response.status(400).json({ message: "Please enter a name (up to 100 characters)." });
    return;
  }

  if (
    trimmedEmail.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)
  ) {
    response.status(400).json({ message: "Please enter a valid email address." });
    return;
  }

  if (!trimmedMessage || trimmedMessage.length > 5000) {
    response.status(400).json({ message: "Please enter a message (up to 5,000 characters)." });
    return;
  }

  try {
    await Contact.create({
      name: trimmedName,
      email: trimmedEmail,
      message: trimmedMessage
    });
    response.status(201).json({ message: "Thanks! Your message has been sent successfully." });
  } catch (error) {
    console.error("Contact message could not be saved:", error.name);
    response.status(503).json({ message: "We could not save your message right now. Please try again later." });
  }
});

app.use((error, _request, response, next) => {
  if (response.headersSent) {
    next(error);
    return;
  }

  if (error.message === "Origin is not allowed by CORS") {
    response.status(403).json({ message: "This website is not allowed to use the contact service." });
    return;
  }

  if (error instanceof SyntaxError && "body" in error) {
    response.status(400).json({ message: "Please submit valid JSON." });
    return;
  }

  console.error("Request failed:", error.name);
  response.status(500).json({ message: "An unexpected server error occurred." });
});

const port = Number(process.env.PORT) || 5000;

if (!process.env.MONGODB_URI) {
  console.error("MONGODB_URI is required. Add it to server/.env before starting the API.");
  process.exit(1);
}

try {
  await mongoose.connect(process.env.MONGODB_URI);
} catch (error) {
  console.error("Could not connect to MongoDB:", error.name);
  process.exit(1);
}

app.listen(port, () => {
  console.log(`Portfolio API listening on port ${port}`);
});
