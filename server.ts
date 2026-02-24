import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "default_secret_key_change_me";

// Database Setup
const db = new Database("org.db");
db.pragma("journal_mode = WAL");

// Initialize Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'member',
    batch INTEGER,
    bio TEXT,
    phone TEXT,
    social_links TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    status TEXT DEFAULT 'published',
    author_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    date DATETIME NOT NULL,
    location TEXT,
    max_attendees INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS rsvps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    event_id INTEGER,
    status TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, event_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (event_id) REFERENCES events(id)
  );
`);

// Migration: Add batch column if it doesn't exist
try {
  db.exec("ALTER TABLE users ADD COLUMN batch INTEGER");
} catch (err) {
  // Column already exists
}

// Middleware
app.use(express.json());
app.use(cookieParser());

// Auth Middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: "Access denied" });

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ error: "Invalid token" });
  }
};

const isAdmin = (req: any, res: any, next: any) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

// --- API Routes ---

// Auth Routes
app.post("/api/auth/register", async (req, res) => {
  const { name, email, password, batch } = req.body;
  if (!name || !email || !password || !batch) return res.status(400).json({ error: "Missing fields" });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    // First user becomes admin
    const userCount = db.prepare("SELECT count(*) as count FROM users").get() as { count: number };
    const role = userCount.count === 0 ? 'admin' : 'member';

    const stmt = db.prepare("INSERT INTO users (name, email, password, role, batch) VALUES (?, ?, ?, ?, ?)");
    const info = stmt.run(name, email, hashedPassword, role, batch);
    res.status(201).json({ id: info.lastInsertRowid, message: "User registered" });
  } catch (err: any) {
    if (err.message.includes("UNIQUE constraint failed")) {
      return res.status(400).json({ error: "Email already exists" });
    }
    res.status(500).json({ error: "Registration failed" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(400).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: "7d" });
  res.cookie("token", token, { httpOnly: true, secure: true, sameSite: 'none', maxAge: 7 * 24 * 60 * 60 * 1000 });
  res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

app.post("/api/auth/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out" });
});

app.get("/api/auth/me", authenticateToken, (req: any, res) => {
  const user = db.prepare("SELECT id, name, email, role, batch, bio, phone, social_links, created_at FROM users WHERE id = ?").get(req.user.id);
  res.json(user);
});

// User Profile Update
app.put("/api/user/profile", authenticateToken, (req: any, res) => {
  const { name, bio, phone, social_links, batch } = req.body;
  db.prepare("UPDATE users SET name = ?, bio = ?, phone = ?, social_links = ?, batch = ? WHERE id = ?")
    .run(name, bio, phone, social_links, batch, req.user.id);
  res.json({ message: "Profile updated" });
});

// Announcements
app.get("/api/announcements", authenticateToken, (req, res) => {
  const announcements = db.prepare("SELECT a.*, u.name as author_name FROM announcements a JOIN users u ON a.author_id = u.id ORDER BY created_at DESC").all();
  res.json(announcements);
});

app.post("/api/announcements", authenticateToken, isAdmin, (req: any, res) => {
  const { title, content } = req.body;
  db.prepare("INSERT INTO announcements (title, content, author_id) VALUES (?, ?, ?)")
    .run(title, content, req.user.id);
  res.status(201).json({ message: "Announcement created" });
});

app.delete("/api/announcements/:id", authenticateToken, isAdmin, (req, res) => {
  db.prepare("DELETE FROM announcements WHERE id = ?").run(req.params.id);
  res.json({ message: "Announcement deleted" });
});

// Members Directory
app.get("/api/members", authenticateToken, (req, res) => {
  const members = db.prepare("SELECT id, name, role, batch, bio, created_at FROM users").all();
  res.json(members);
});

// Admin: Member Management
app.get("/api/admin/members", authenticateToken, isAdmin, (req, res) => {
  const members = db.prepare("SELECT * FROM users").all();
  res.json(members);
});

app.put("/api/admin/members/:id/role", authenticateToken, isAdmin, (req, res) => {
  const { role } = req.body;
  db.prepare("UPDATE users SET role = ? WHERE id = ?").run(role, req.params.id);
  res.json({ message: "Role updated" });
});

app.delete("/api/admin/members/:id", authenticateToken, isAdmin, (req, res) => {
  db.prepare("DELETE FROM users WHERE id = ?").run(req.params.id);
  res.json({ message: "Member deleted" });
});

// Vite Integration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
