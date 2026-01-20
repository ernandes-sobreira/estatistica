// js/auth.js
import { TOKEN_KEY, USER_KEY } from "./config.js";

export function requireLogin() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) window.location.href = "index.html";
}

export function requireAdmin() {
  requireLogin();
  const u = JSON.parse(localStorage.getItem(USER_KEY) || "{}");
  if (u.role !== "admin") window.location.href = "dashboard.html";
}
