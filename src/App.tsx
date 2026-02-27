import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Bot, Search, Users, Shield, Globe, Send, MessageSquare, Database } from 'lucide-react';

export default function App() {
  const [stats, setStats] = useState({ userCount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/stats');
        const data = await res.json();
        setStats(data);
      } catch (e) {
        console.error('Failed to fetch stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans selection:bg-emerald-500/30">
      {/* Background Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
      </div>

      <main className="relative z-10 max-w-5xl mx-auto px-6 py-12 lg:py-20">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4"
          >
            <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Bot className="w-8 h-8 text-black" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Advanced Bot</h1>
              <p className="text-zinc-500 text-sm">Cloudflare Worker & D1 Powered</p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex gap-4"
          >
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="text-2xl font-mono font-bold">{loading ? '...' : stats.userCount}</div>
                <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Active Users</div>
              </div>
            </div>
          </motion.div>
        </header>

        {/* Features Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {[
            { icon: Globe, title: "Multi-Language", desc: "Amharic, Oromo, and English support with seamless onboarding." },
            { icon: Search, title: "Google Search", desc: "Integrated Serper.dev API for real-time web results." },
            { icon: Shield, title: "Admin Tools", desc: "Secure broadcast system for text and media distribution." }
          ].map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-zinc-900/30 border border-zinc-800/50 rounded-3xl p-8 hover:border-emerald-500/30 transition-colors group"
            >
              <f.icon className="w-8 h-8 text-emerald-500 mb-6 group-hover:scale-110 transition-transform" />
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </section>

        {/* Setup Instructions */}
        <section className="bg-zinc-900/50 border border-zinc-800 rounded-[2rem] p-8 md:p-12">
          <div className="flex items-center gap-3 mb-8">
            <Database className="w-6 h-6 text-emerald-500" />
            <h2 className="text-2xl font-bold">Deployment Guide</h2>
          </div>

          <div className="space-y-8">
            <div className="flex gap-6">
              <div className="flex-none w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center text-sm font-bold text-emerald-500">1</div>
              <div>
                <h4 className="font-semibold mb-2">Configure Secrets</h4>
                <p className="text-zinc-400 text-sm mb-4">Set your environment variables in the AI Studio Secrets panel or .env file:</p>
                <div className="bg-black rounded-xl p-4 font-mono text-xs text-zinc-500 space-y-1 border border-zinc-800">
                  <div>TELEGRAM_TOKEN=your_token</div>
                  <div>SERPER_API_KEY=your_key</div>
                  <div>ADMIN_ID=your_id</div>
                </div>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex-none w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center text-sm font-bold text-emerald-500">2</div>
              <div>
                <h4 className="font-semibold mb-2">Initialize D1 Database</h4>
                <p className="text-zinc-400 text-sm mb-4">Run the following command to set up your Cloudflare D1 database:</p>
                <div className="bg-black rounded-xl p-4 font-mono text-xs text-emerald-500/80 border border-zinc-800">
                  npx wrangler d1 execute telegram_bot_db --file=./schema.sql
                </div>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex-none w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center text-sm font-bold text-emerald-500">3</div>
              <div>
                <h4 className="font-semibold mb-2">Deploy to Workers</h4>
                <p className="text-zinc-400 text-sm mb-4">Push your code to Cloudflare's edge network:</p>
                <div className="bg-black rounded-xl p-4 font-mono text-xs text-emerald-500/80 border border-zinc-800">
                  npx wrangler deploy
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-20 pt-8 border-t border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-4 text-zinc-600 text-xs uppercase tracking-widest font-semibold">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            <span>Built with grammY & Cloudflare</span>
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-emerald-500 transition-colors">Documentation</a>
            <a href="#" className="hover:text-emerald-500 transition-colors">Support</a>
          </div>
        </footer>
      </main>
    </div>
  );
}
