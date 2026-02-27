/// <reference types="@cloudflare/workers-types" />
import { webhookCallback } from "grammy";
import { createBot } from "./src/bot";

export interface Env {
    DB: D1Database;
    TELEGRAM_TOKEN: string;
    SERPER_API_KEY: string;
    ADMIN_ID: string;
}

export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        const bot = createBot(env.TELEGRAM_TOKEN, env.DB, env.ADMIN_ID, env.SERPER_API_KEY);
        
        // Handle Webhook
        return webhookCallback(bot, "cloudflare-mod")(request);
    },
};
