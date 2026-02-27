import { Bot, Context, Keyboard, InlineKeyboard, session, SessionFlavor } from "grammy";
import axios from "axios";

// --- Types ---
interface SessionData {
    step: "idle" | "awaiting_language" | "awaiting_contact" | "broadcasting";
    language?: string;
}
type MyContext = Context & SessionFlavor<SessionData>;

// --- Constants ---
const LANGUAGES = {
    am: "አማርኛ (Amharic)",
    om: "ኦሮመኛ (Oromo)",
    en: "English"
};

const STRINGS: Record<string, any> = {
    am: {
        welcome: "እንኳን ደህና መጡ! እባክዎ ቋንቋ ይምረጡ፡",
        share_contact: "እባክዎ ስልክ ቁጥርዎን ለማጋራት ከታች ያለውን በተን ይጫኑ፡",
        contact_btn: "ስልክ ቁጥር አጋራ",
        registered: "ምዝገባ ተጠናቋል። አሁን ማንኛውንም ነገር መጠየቅ ይችላሉ!",
        searching: "በመፈለግ ላይ...",
        no_results: "ምንም ውጤት አልተገኘም።",
        admin_only: "ይህ ትዕዛዝ ለባለቤቱ ብቻ ነው!",
        broadcast_start: "እባክዎ ለሁሉም ተጠቃሚዎች የሚተላለፈውን መልእክት ይላኩ (ጽሁፍ፣ ፎቶ፣ ቪዲዮ...)፡",
        broadcast_done: "መልእክቱ ለሁሉም ተጠቃሚዎች ተሰራጭቷል!"
    },
    om: {
        welcome: "Baga nagaan dhuftan! Maaloo afaan filadhaa:",
        share_contact: "Maaloo lakkoofsa bilbilaa keessan qooduuf batanii gadii cuqaasaa:",
        contact_btn: "Lakkoofsa Bilbilaa Qoodi",
        registered: "Galmeen xumurameera. Amma waan barbaaddan gaafachuu dandeessu!",
        searching: "Barbaadaa jira...",
        no_results: "Bu'aan hin argamne.",
        admin_only: "Ajajni kun abbaa qofaaf!",
        broadcast_start: "Maaloo ergaa hundaaf darbu ergaa (barreeffama, fakkii, viidiyoo...):",
        broadcast_done: "Ergaan hundi ni darbe!"
    },
    en: {
        welcome: "Welcome! Please choose a language:",
        share_contact: "Please share your phone number by clicking the button below:",
        contact_btn: "Share Contact",
        registered: "Registration complete. You can now ask anything!",
        searching: "Searching...",
        no_results: "No results found.",
        admin_only: "This command is for admin only!",
        broadcast_start: "Please send the message to broadcast to all users (text, photo, video...):",
        broadcast_done: "Broadcast completed!"
    }
};

// --- Bot Factory ---
export function createBot(token: string, db: any, adminId: string, serperKey: string) {
    const bot = new Bot<MyContext>(token);

    bot.use(session({ initial: () => ({ step: "idle" }) }));

    // --- Helpers ---
    const getLang = async (ctx: MyContext) => {
        const user = await db.prepare("SELECT language FROM users WHERE telegram_id = ?").bind(ctx.from?.id).first();
        return user?.language || "en";
    };

    // --- Commands ---
    bot.command("start", async (ctx) => {
        const keyboard = new InlineKeyboard()
            .text(LANGUAGES.am, "lang_am").row()
            .text(LANGUAGES.om, "lang_om").row()
            .text(LANGUAGES.en, "lang_en");

        await ctx.reply(STRINGS.en.welcome, { reply_markup: keyboard });
    });

    bot.callbackQuery(/^lang_(.+)$/, async (ctx) => {
        const lang = ctx.match[1];
        const telegramId = ctx.from.id;
        const username = ctx.from.username || "";

        // Save language
        await db.prepare(`
            INSERT INTO users (telegram_id, username, language) 
            VALUES (?, ?, ?) 
            ON CONFLICT(telegram_id) DO UPDATE SET language = ?, username = ?
        `).bind(telegramId, username, lang, lang, username).run();

        const s = STRINGS[lang];
        const contactKeyboard = new Keyboard()
            .requestContact(s.contact_btn)
            .oneTime()
            .resized();

        await ctx.answerCallbackQuery();
        await ctx.reply(s.share_contact, { reply_markup: contactKeyboard });
    });

    bot.on("message:contact", async (ctx) => {
        const lang = await getLang(ctx);
        const phone = ctx.message.contact.phone_number;
        const telegramId = ctx.from.id;

        await db.prepare("UPDATE users SET phone = ? WHERE telegram_id = ?")
            .bind(phone, telegramId).run();

        await ctx.reply(STRINGS[lang].registered, { reply_markup: { remove_keyboard: true } });
    });

    // --- Admin Broadcast ---
    bot.command("broadcast", async (ctx) => {
        if (ctx.from?.id.toString() !== adminId) {
            const lang = await getLang(ctx);
            return ctx.reply(STRINGS[lang].admin_only);
        }
        ctx.session.step = "broadcasting";
        const lang = await getLang(ctx);
        await ctx.reply(STRINGS[lang].broadcast_start);
    });

    // --- Search Integration ---
    async function searchSerper(query: string) {
        try {
            const response = await axios.post(
                "https://google.serper.dev/search",
                { q: query },
                { headers: { "X-API-KEY": serperKey, "Content-Type": "application/json" } }
            );
            return response.data.organic || [];
        } catch (e) {
            console.error("Serper Error:", e);
            return [];
        }
    }

    // --- General Message Handler ---
    bot.on("message", async (ctx) => {
        const lang = await getLang(ctx);
        const s = STRINGS[lang];

        // Handle Broadcast
        if (ctx.session.step === "broadcasting" && ctx.from?.id.toString() === adminId) {
            const users = await db.prepare("SELECT telegram_id FROM users").all();
            let count = 0;
            for (const user of users) {
                try {
                    await ctx.api.copyMessage(user.telegram_id, ctx.chat.id, ctx.message.message_id);
                    count++;
                } catch (e) {
                    console.error(`Failed to send to ${user.telegram_id}`);
                }
            }
            ctx.session.step = "idle";
            return ctx.reply(`${s.broadcast_done} (Sent to ${count} users)`);
        }

        // Handle Search
        if (ctx.message.text && !ctx.message.text.startsWith("/")) {
            const query = ctx.message.text;
            await ctx.reply(s.searching);
            
            const results = await searchSerper(query);
            if (results.length === 0) {
                return ctx.reply(s.no_results);
            }

            const formatted = results.slice(0, 5).map((r: any) => 
                `<b>${r.title}</b>\n<a href="${r.link}">${r.link}</a>\n<i>${r.snippet}</i>`
            ).join("\n\n");

            await ctx.reply(formatted, { 
                parse_mode: "HTML", 
                link_preview_options: { is_disabled: false } 
            });
        } else if (!ctx.message.text) {
            // Echo back media if not searching (General Media Handler)
            await ctx.copyMessage(ctx.chat.id);
        }
    });

    return bot;
}
