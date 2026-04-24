// server/index.js
const express    = require("express");
const cors       = require("cors");
const bcrypt     = require("bcryptjs");
const jwt        = require("jsonwebtoken");
const { Pool }   = require("pg");
const crypto     = require("crypto");
const http       = require("http");
const { WebSocketServer, WebSocket } = require("ws");
const url        = require("url");

const app        = express();
const PORT       = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || "savage_club_secret_dev";
const APP_URL    = process.env.APP_URL    || "http://localhost:3000";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres@localhost:5432/savage_club",
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

const allowedOrigins = [
  "http://localhost:3000",
  process.env.APP_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS bloqué pour : ${origin}`));
  },
  credentials: true,
}));

app.use(express.json());

// ─── INSCRIPTION ─────────────────────────────────────────────────
app.post("/auth/register", async (req, res) => {
  const { name, email, password, role, acceptedCGU } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: "Tous les champs sont requis." });
  if (!acceptedCGU)
    return res.status(400).json({ error: "Vous devez accepter les conditions générales d'utilisation." });

  const exists = await pool.query('SELECT id FROM "User" WHERE email = $1', [email]);
  if (exists.rows.length > 0)
    return res.status(409).json({ error: "Cet email est déjà utilisé." });

  const hashedPassword = await bcrypt.hash(password, 10);
  const id = crypto.randomUUID();
  const validRoles = ["USER", "CREATOR", "TRAINER"];
  const userRole = validRoles.includes(role) ? role : "USER";

  const result = await pool.query(
    'INSERT INTO "User" (id, username, email, password, role, "isVerified", "acceptedCGUAt", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW(), NOW()) RETURNING *',
    [id, name, email, hashedPassword, userRole, false]
  );

  const user = result.rows[0];
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
  return res.status(201).json({ token, user: { id: user.id, name: user.username, email: user.email } });
});

// ─── CONNEXION ────────────────────────────────────────────────────
app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Email et mot de passe requis." });

  const result = await pool.query('SELECT * FROM "User" WHERE email = $1', [email]);
  const user = result.rows[0];
  if (!user) return res.status(401).json({ error: "Email ou mot de passe incorrect." });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: "Email ou mot de passe incorrect." });

  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
  return res.json({ token, user: { id: user.id, name: user.username, email: user.email } });
});

// ─── MOT DE PASSE OUBLIÉ ─────────────────────────────────────────
app.post('/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const userResult = await pool.query('SELECT * FROM "User" WHERE email = $1', [email]);
    const user = userResult.rows[0];

    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      await pool.query(`
        ALTER TABLE "User"
        ADD COLUMN IF NOT EXISTS "resetPasswordToken" VARCHAR(255),
        ADD COLUMN IF NOT EXISTS "resetPasswordExpires" BIGINT
      `).catch(() => {});
      const expiresAt = Date.now() + 3600000;
      await pool.query(
        'UPDATE "User" SET "resetPasswordToken" = $1, "resetPasswordExpires" = $2 WHERE id = $3',
        [token, expiresAt, user.id]
      );
      const resetLink = `${APP_URL}/auth/reset-password/${token}`;
      console.log(`\n🔐 RESET LINK → ${resetLink}\n`);
    }

    return res.json({ message: "Si un compte existe avec cet email, vous recevrez un lien de réinitialisation" });
  } catch (error) {
    console.error("Erreur forgot-password:", error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

// ─── RÉINITIALISATION DU MOT DE PASSE ────────────────────────────
app.post('/auth/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    const now = Date.now();
    const userResult = await pool.query(
      'SELECT * FROM "User" WHERE "resetPasswordToken" = $1 AND "resetPasswordExpires" > $2',
      [token, now]
    );
    const user = userResult.rows[0];
    if (!user) return res.status(400).json({ error: "Token invalide ou expiré" });

    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      'UPDATE "User" SET password = $1, "resetPasswordToken" = NULL, "resetPasswordExpires" = NULL WHERE id = $2',
      [hashedPassword, user.id]
    );
    return res.json({ message: "Mot de passe réinitialisé avec succès" });
  } catch (error) {
    console.error("Erreur reset-password:", error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

// ─── PROFIL ───────────────────────────────────────────────────────
app.get("/auth/me", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Token manquant." });
  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const result = await pool.query('SELECT * FROM "User" WHERE id = $1', [decoded.id]);
    const user = result.rows[0];
    if (!user) return res.status(404).json({ error: "Utilisateur introuvable." });
    return res.json({ id: user.id, name: user.username, email: user.email });
  } catch {
    return res.status(401).json({ error: "Token invalide ou expiré." });
  }
});

// ─── HEALTHCHECK ──────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    rooms: rooms.size,
    connections: [...rooms.values()].reduce((acc, r) => acc + r.size, 0),
  });
});

// ═════════════════════════════════════════════════════════════════
// ─── WEBSOCKET SIGNALISATION WebRTC ──────────────────────────────
// ═════════════════════════════════════════════════════════════════

const rooms = new Map();

function broadcast(bookingId, senderId, message) {
  const room = rooms.get(bookingId);
  if (!room) return;
  const data = JSON.stringify(message);
  for (const [uid, ws] of room.entries()) {
    if (uid !== senderId && ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  }
}

function cleanRoom(bookingId, userId) {
  const room = rooms.get(bookingId);
  if (!room) return;
  room.delete(userId);
  if (room.size === 0) rooms.delete(bookingId);
}

const server = http.createServer(app);
const wss    = new WebSocketServer({ server });

wss.on("connection", (ws, req) => {
  const parsed    = url.parse(req.url, true);
  const pathParts = parsed.pathname.split("/").filter(Boolean);

  if (pathParts[0] !== "call" || !pathParts[1]) {
    ws.close(4000, "URL invalide"); return;
  }

  const bookingId = pathParts[1];
  const userId    = parsed.query.userId;

  if (!userId) { ws.close(4001, "userId requis"); return; }

  const room = rooms.get(bookingId) ?? new Map();
  if (room.size >= 2 && !room.has(userId)) {
    ws.close(4002, "Room pleine"); return;
  }

  room.set(userId, ws);
  rooms.set(bookingId, room);

  console.log(`[WS] Room ${bookingId.slice(0,8)} — ${userId.slice(0,8)} rejoint (${room.size}/2)`);

  broadcast(bookingId, userId, { type: "peer-joined", userId });
  ws.send(JSON.stringify({ type: "connected", bookingId, userId, peersInRoom: room.size }));

  ws.on("message", (rawData) => {
    let msg;
    try { msg = JSON.parse(rawData.toString()); } catch { return; }

    const allowed = ["offer", "answer", "ice-candidate", "call-ended"];
    if (!allowed.includes(msg.type)) return;

    if (msg.type === "call-ended") {
      broadcast(bookingId, userId, { type: "call-ended", by: userId });
      cleanRoom(bookingId, userId);
      return;
    }

    broadcast(bookingId, userId, { ...msg, from: userId });
  });

  ws.on("close", (code) => {
    console.log(`[WS] Room ${bookingId.slice(0,8)} — ${userId.slice(0,8)} déconnecté (${code})`);
    cleanRoom(bookingId, userId);
    broadcast(bookingId, userId, { type: "peer-left", userId });
  });

  ws.on("error", (err) => {
    console.error(`[WS] Erreur:`, err.message);
    cleanRoom(bookingId, userId);
  });
});

setInterval(() => {
  for (const [bookingId, room] of rooms.entries()) {
    for (const [uid, ws] of room.entries()) {
      if (ws.readyState !== WebSocket.OPEN) room.delete(uid);
    }
    if (room.size === 0) rooms.delete(bookingId);
  }
}, 30_000);

server.listen(PORT, () => {
  console.log(`✅ API Express     → http://localhost:${PORT}`);
  console.log(`✅ WebSocket       → ws://localhost:${PORT}/call/{bookingId}?userId={userId}`);
  console.log(`✅ Healthcheck     → http://localhost:${PORT}/health`);
  console.log(`✅ CORS autorisé   → ${allowedOrigins.join(", ")}`);
});

process.on("SIGTERM", () => wss.close(() => server.close(() => process.exit(0))));