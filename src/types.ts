export interface Log {
  id: string;
  message: string;
  type: "info" | "success" | "error" | "warning";
  timestamp: number;
}

export interface SniperConfig {
  username: boolean;
  usernames: string[];
  randomMode: boolean;
  usernameLength: number;
  targetUserId: string;
}

export interface Status {
  connected: boolean;
  user?: string;
  error?: string;
}
