import React, { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { motion, AnimatePresence } from "motion/react";
import { 
  Shield, 
  Terminal, 
  Settings, 
  Activity, 
  User, 
  Zap, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Info,
  Play,
  Plus,
  Trash2,
  Lock,
  Eye,
  EyeOff
} from "lucide-react";
import { Log, SniperConfig, Status } from "./types";

const socket: Socket = io();

export default function App() {
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [status, setStatus] = useState<Status>({ connected: false });
  const [logs, setLogs] = useState<Log[]>([]);
  const [config, setConfig] = useState<SniperConfig>({
    username: false,
    usernames: ["test1", "test2"],
    randomMode: false,
    usernameLength: 3,
    targetUserId: "",
  });
  const [newUsername, setNewUsername] = useState("");
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    socket.on("log", (log: Log) => {
      setLogs((prev) => [...prev, log].slice(-100));
    });

    socket.on("status", (newStatus: Status) => {
      setStatus(newStatus);
    });

    // Fetch initial status and logs
    fetch("/api/status")
      .then((res) => res.json())
      .then((data) => setStatus(data));

    fetch("/api/logs")
      .then((res) => res.json())
      .then((data) => setLogs(data));

    return () => {
      socket.off("log");
      socket.off("status");
    };
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const handleConnect = async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      console.log(data);
    } catch (err) {
      console.error(err);
    }
  };

  const updateConfig = async (newConfig: Partial<SniperConfig>) => {
    const updated = { ...config, ...newConfig };
    setConfig(updated);
    try {
      await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const addUsername = () => {
    if (newUsername && !config.usernames.includes(newUsername)) {
      updateConfig({ usernames: [...config.usernames, newUsername] });
      setNewUsername("");
    }
  };

  const removeUsername = (name: string) => {
    updateConfig({ usernames: config.usernames.filter((u) => u !== name) });
  };

  return (
    <div className="min-h-screen bg-[#0F0F12] text-gray-100 font-sans selection:bg-[#5865F2] selection:text-white">
      {/* Header */}
      <header className="border-b border-white/5 bg-[#16161D]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#5865F2] rounded-xl flex items-center justify-center shadow-lg shadow-[#5865F2]/20">
              <Zap className="w-6 h-6 text-white fill-current" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Discord Sniper</h1>
              <p className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">Advanced Automation</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${status.connected ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
              <div className={`w-2 h-2 rounded-full ${status.connected ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />
              {status.connected ? `Connected: ${status.user}` : "Disconnected"}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Controls & Config */}
        <div className="lg:col-span-4 space-y-6">
          {/* Connection Status Card */}
          <section className="bg-[#16161D] border border-white/5 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-6 text-gray-400">
              <Shield className="w-4 h-4" />
              <h2 className="text-sm font-semibold uppercase tracking-wider">Account Status</h2>
            </div>
            
            <div className="space-y-4">
              <div className={`p-4 rounded-xl border ${status.connected ? "bg-emerald-500/5 border-emerald-500/20" : "bg-red-500/5 border-red-500/20"}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${status.connected ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
                    <User className={`w-6 h-6 ${status.connected ? "text-emerald-400" : "text-red-400"}`} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Current Account</p>
                    <p className={`text-sm font-bold ${status.connected ? "text-emerald-400" : "text-red-400"}`}>
                      {status.connected ? status.user : "Disconnected"}
                    </p>
                  </div>
                </div>
              </div>
              
              {!status.connected && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <p className="text-[10px] text-amber-400 leading-relaxed">
                    <AlertTriangle className="w-3 h-3 inline mr-1" />
                    Fixed token not found or invalid. Please check your environment variables.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Sniper Controls */}
          <section className="bg-[#16161D] border border-white/5 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-6 text-gray-400">
              <Settings className="w-4 h-4" />
              <h2 className="text-sm font-semibold uppercase tracking-wider">Sniper Config</h2>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-[#0F0F12] rounded-xl border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">Username Sniper</h3>
                    <p className="text-[10px] text-gray-500">Check rare usernames</p>
                  </div>
                </div>
                <button
                  onClick={() => updateConfig({ username: !config.username })}
                  className={`w-12 h-6 rounded-full transition-colors relative ${config.username ? "bg-[#5865F2]" : "bg-gray-700"}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${config.username ? "left-7" : "left-1"}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-amber-500/5 rounded-xl border border-amber-500/10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">Random Mode</h3>
                    <p className="text-[10px] text-gray-500">Brute-force random codes</p>
                  </div>
                </div>
                <button
                  onClick={() => updateConfig({ randomMode: !config.randomMode })}
                  className={`w-12 h-6 rounded-full transition-colors relative ${config.randomMode ? "bg-amber-500" : "bg-gray-700"}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${config.randomMode ? "left-7" : "left-1"}`} />
                </button>
              </div>

              <div className="space-y-2 p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center gap-2 mb-2 text-gray-400">
                  <User className="w-3 h-3" />
                  <label className="text-[10px] font-bold uppercase tracking-wider">Target User ID (Optional)</label>
                </div>
                <input
                  type="text"
                  value={config.targetUserId}
                  onChange={(e) => updateConfig({ targetUserId: e.target.value })}
                  placeholder="Enter Discord User ID..."
                  className="w-full bg-[#0F0F12] border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#5865F2]"
                />
                <p className="text-[9px] text-gray-500">
                  If set, valid Nitro/Usernames will be sent to this ID instead of being used on your account.
                </p>
              </div>

              {config.randomMode && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="space-y-4 pt-4 border-t border-white/5"
                >
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-gray-400">Username Length</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="32"
                        value={config.usernameLength}
                        onChange={(e) => updateConfig({ usernameLength: parseInt(e.target.value) || 3 })}
                        className="w-16 bg-[#0F0F12] border border-white/10 rounded-lg px-2 py-1 text-xs text-center focus:outline-none focus:border-amber-500"
                      />
                      <span className="text-[10px] text-gray-600">chars</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {config.username && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4 pt-4 border-t border-white/5"
                >
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      placeholder="Add username..."
                      className="flex-1 bg-[#0F0F12] border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#5865F2]"
                    />
                    <button 
                      onClick={addUsername}
                      className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {config.usernames.map((u) => (
                      <span key={u} className="flex items-center gap-2 px-2 py-1 bg-[#5865F2]/10 border border-[#5865F2]/20 rounded-md text-[10px] font-bold text-[#5865F2]">
                        {u}
                        <button onClick={() => removeUsername(u)} className="hover:text-red-400">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Logs */}
        <div className="lg:col-span-8 flex flex-col h-[calc(100vh-12rem)]">
          <section className="bg-[#16161D] border border-white/5 rounded-2xl flex-1 flex flex-col shadow-xl overflow-hidden">
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-[#16161D]">
              <div className="flex items-center gap-2 text-gray-400">
                <Terminal className="w-4 h-4" />
                <h2 className="text-sm font-semibold uppercase tracking-wider">Live Terminal</h2>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-bold text-gray-500">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  SUCCESS
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  ERROR
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  WARNING
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-2 font-mono text-xs custom-scrollbar bg-[#0F0F12]">
              <AnimatePresence initial={false}>
                {logs.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-4">
                    <Activity className="w-12 h-12 opacity-20 animate-pulse" />
                    <p className="text-sm font-medium">Waiting for activity...</p>
                  </div>
                ) : (
                  logs.map((log) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex gap-4 group"
                    >
                      <span className="text-gray-600 shrink-0 select-none">
                        [{new Date(log.timestamp).toLocaleTimeString()}]
                      </span>
                      <span className={`
                        ${log.type === "success" ? "text-emerald-400" : ""}
                        ${log.type === "error" ? "text-red-400" : ""}
                        ${log.type === "warning" ? "text-amber-400" : ""}
                        ${log.type === "info" ? "text-blue-400" : ""}
                      `}>
                        {log.type === "success" && <CheckCircle2 className="w-3 h-3 inline mr-2 -mt-0.5" />}
                        {log.type === "error" && <XCircle className="w-3 h-3 inline mr-2 -mt-0.5" />}
                        {log.type === "warning" && <AlertTriangle className="w-3 h-3 inline mr-2 -mt-0.5" />}
                        {log.type === "info" && <Info className="w-3 h-3 inline mr-2 -mt-0.5" />}
                        {log.message}
                      </span>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
              <div ref={logEndRef} />
            </div>
          </section>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="max-w-7xl mx-auto px-6 py-8 border-t border-white/5 mt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm text-gray-500">
          <div>
            <h4 className="text-white font-bold mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#5865F2]" />
              Security First
            </h4>
            <p className="text-xs leading-relaxed">
              Tokens are never stored on the server. They are kept in memory only for the duration of the session.
            </p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-2 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-400" />
              Username Sniper
            </h4>
            <p className="text-xs leading-relaxed">
              Check rare usernames automatically and get notified when they become available.
            </p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-2 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Real-time Monitoring
            </h4>
            <p className="text-xs leading-relaxed">
              WebSocket integration ensures you see every attempt and success as it happens.
            </p>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[10px] uppercase tracking-widest font-bold">© 2026 Discord Sniper Dashboard</p>
          <div className="flex gap-6 text-[10px] uppercase tracking-widest font-bold">
            <a href="#" className="hover:text-white transition-colors">Documentation</a>
            <a href="#" className="hover:text-white transition-colors">Safety Guide</a>
            <a href="#" className="hover:text-white transition-colors">Support</a>
          </div>
        </div>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}
