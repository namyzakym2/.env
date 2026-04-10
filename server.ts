import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { Client } from "discord.js-selfbot-v13";
import axios from "axios";
import path from "path";
import { createServer as createViteServer } from "vite";
import cors from "cors";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

app.use(cors());
app.use(express.json());

let discordClient: Client | null = null;
let isUsernameSniperActive = false;
let targetUsernames: string[] = [];
let targetUserId = "";
let sniperLogs: { id: string; message: string; type: "info" | "success" | "error" | "warning"; timestamp: number }[] = [];

const addLog = (message: string, type: "info" | "success" | "error" | "warning" = "info") => {
  const log = {
    id: Math.random().toString(36).substring(7),
    message,
    type,
    timestamp: Date.now(),
  };
  sniperLogs.push(log);
  if (sniperLogs.length > 100) sniperLogs.shift();
  io.emit("log", log);
};

const sendToTarget = async (message: string) => {
  if (!targetUserId || !discordClient) return;
  try {
    const user = await discordClient.users.fetch(targetUserId);
    if (user) {
      await user.send(message);
      addLog(`Sent notification to Target ID (${targetUserId})`, "success");
    }
  } catch (error: any) {
    addLog(`Failed to send DM to Target ID: ${error.message}`, "error");
  }
};

// Discord Logic
const startDiscord = (token: string) => {
  if (discordClient) {
    discordClient.destroy();
  }

  discordClient = new Client();

  discordClient.on("ready", () => {
    addLog(`Logged in as ${discordClient?.user?.tag}`, "success");
    io.emit("status", { connected: true, user: discordClient?.user?.tag });
  });

  discordClient.on("messageCreate", async (message) => {
    // Nitro sniping removed
  });

  discordClient.on("error", (err) => {
    addLog(`Discord Error: ${err.message}`, "error");
  });

  discordClient.login(token).catch((err) => {
    addLog(`Login failed: ${err.message}`, "error");
    io.emit("status", { connected: false, error: err.message });
  });
};

// Username Sniper Logic
let usernameInterval: NodeJS.Timeout | null = null;

const checkUsernames = async (token: string) => {
  if (!isUsernameSniperActive || targetUsernames.length === 0) return;

  for (const username of targetUsernames) {
    try {
      // Discord Pomelo check endpoint
      const response = await axios.post(
        "https://discord.com/api/v9/users/@me/pomelo-attempt",
        { username },
        {
          headers: {
            Authorization: token,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.taken === false) {
        addLog(`Username AVAILABLE: ${username}!`, "success");
        if (targetUserId) {
          await sendToTarget(`🚀 Available Username Found: ${username}`);
        } else {
          addLog(`Manual intervention required for ${username} (Captcha/Password)`, "warning");
        }
      } else {
        // addLog(`Username ${username} is taken.`, "info");
      }
    } catch (error: any) {
      if (error.response?.status === 429) {
        addLog("Rate limited on username checks. Waiting...", "warning");
        break; 
      }
    }
    // Small delay between checks
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
};

// API Routes
app.get("/api/status", (req, res) => {
  res.json({ 
    connected: !!discordClient?.readyAt, 
    user: discordClient?.user?.tag || null 
  });
});

let isRandomModeActive = false;
let targetUsernameLength = 3;

const generateRandomString = (length: number) => {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const generateRandomUsername = (length: number) => {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789._";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const runRandomSniper = async (token: string) => {
  if (!isRandomModeActive) return;

  // Random Username Attempt
  if (isUsernameSniperActive) {
    const randomUser = generateRandomUsername(targetUsernameLength);
    addLog(`Random Username check (${targetUsernameLength} chars): ${randomUser}`, "info");
    try {
      const response = await axios.post(
        "https://discord.com/api/v9/users/@me/pomelo-attempt",
        { username: randomUser },
        {
          headers: { Authorization: token, "Content-Type": "application/json" },
        }
      );
      if (response.data.taken === false) {
        addLog(`Found available random username: ${randomUser}!`, "success");
        if (targetUserId) {
          await sendToTarget(`🚀 Available Random Username Found: ${randomUser}`);
        }
      }
    } catch (error: any) {}
  }
};

let randomInterval: NodeJS.Timeout | null = null;

app.post("/api/config", (req, res) => {
  const { username, usernames, randomMode, usernameLength, targetUserId: newTargetId } = req.body;
  isUsernameSniperActive = username;
  targetUsernames = usernames || [];
  isRandomModeActive = randomMode;
  targetUsernameLength = usernameLength || 3;
  targetUserId = newTargetId || "";
  
  if (isUsernameSniperActive && !usernameInterval && !isRandomModeActive) {
    usernameInterval = setInterval(() => {
      if (discordClient?.token) checkUsernames(discordClient.token);
    }, 60000);
  } else if ((!isUsernameSniperActive || isRandomModeActive) && usernameInterval) {
    clearInterval(usernameInterval);
    usernameInterval = null;
  }

  if (isRandomModeActive && !randomInterval) {
    randomInterval = setInterval(() => {
      if (discordClient?.token) runRandomSniper(discordClient.token);
    }, 10000); // Check every 10 seconds to avoid instant rate limit
  } else if (!isRandomModeActive && randomInterval) {
    clearInterval(randomInterval);
    randomInterval = null;
  }

  addLog(`Config updated: Username=${isUsernameSniperActive}, RandomMode=${isRandomModeActive}, UserLen=${targetUsernameLength}`, "info");
  res.json({ status: "Config updated" });
});

app.get("/api/logs", (req, res) => {
  res.json(sniperLogs);
});

// Vite Middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const PORT = 3000;
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    
    // Auto-connect if token is provided
    const token = process.env.DISCORD_TOKEN;
    if (token) {
      addLog("Auto-connecting with fixed token...", "info");
      startDiscord(token);
    } else {
      addLog("No DISCORD_TOKEN found in environment variables.", "warning");
    }
  });
}

startServer();
