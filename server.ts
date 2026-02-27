import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import dotenv from "dotenv";
import { createBot } from "./src/bot";

dotenv.config();

const db = new Database("local.db");

// Initialize Local DB (mimicking D1)
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        telegram_id INTEGER UNIQUE NOT NULL,
        username TEXT,
        language TEXT,
        phone TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
`);

// Mock D1 interface for the bot
const d1Mock = {
    prepare: (sql: string) => ({
        bind: (...args: any[]) => ({
            run: async () => db.prepare(sql).run(...args),
            first: async () => db.prepare(sql).get(...args),
            all: async () => db.prepare(sql).all(...args)
        })
    })
};

async function startServer() {
    const app = express();
    const PORT = 3000;

    const token = process.env.TELEGRAM_TOKEN;
    const adminId = process.env.ADMIN_ID || "";
    const serperKey = process.env.SERPER_API_KEY || "";

    if (token) {
        const bot = createBot(token, d1Mock, adminId, serperKey);
        console.log("Starting bot in polling mode for development...");
        bot.start();
    } else {
        console.warn("TELEGRAM_TOKEN missing. Bot not started.");
    }

    app.get("/api/stats", (req, res) => {
        const count = db.prepare("SELECT COUNT(*) as count FROM users").get() as any;
        res.json({ userCount: count.count });
    });

    if (process.env.NODE_ENV !== "production") {
        const vite = await createViteServer({
            server: { middlewareMode: true },
            appType: "spa",
        });
        app.use(vite.middlewares);
    }

    app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

startServer();
