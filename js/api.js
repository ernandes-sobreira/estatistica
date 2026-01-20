// js/api.js
import { SCRIPT_URL, TOKEN_KEY, USER_KEY } from "./config.js";

function getToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}

export function getUser() {
  try { return JSON.parse(localStorage.getItem(USER_KEY) || "{}"); }
  catch { return {}; }
}

export function setUser(obj) {
  localStorage.setItem(USER_KEY, JSON.stringify(obj));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function withTokenQuery(url) {
  const token = getToken();
  if (!token) return url;
  return url + (url.includes("?") ? "&" : "?") + "token=" + encodeURIComponent(token);
}

async function request(path, { method = "GET", body = null } = {}) {
  let url = `${SCRIPT_URL}${path}`;
  const token = getToken();

  if (method.toUpperCase() === "GET") {
    url = withTokenQuery(url);
  }

  const headers = { "Content-Type": "application/json" };

  let payload = null;
  if (body) {
    payload = { ...body };
    if (token) payload.token = token; // Apps Script precisa do token no body
  } else {
    if (method.toUpperCase() !== "GET" && token) payload = { token };
  }

  const res = await fetch(url, {
    method,
    headers,
    body: method.toUpperCase() === "GET" ? null : JSON.stringify(payload),
  });

  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { ok: false, error: text }; }

  if (data && data.ok === false) throw new Error(data.error || "Erro no backend");
  if (!res.ok) throw new Error(data?.error || `Erro HTTP ${res.status}`);

  return data;
}

export const api = {
  // Auth
  login: (payload) => request("/login", { method: "POST", body: payload }),

  // Aulas
  aulas: (turma_id) => request(`/aulas?turma_id=${encodeURIComponent(turma_id)}`),
  aulaDetalhe: (turma_id, aula_id) =>
    request(`/aula?turma_id=${encodeURIComponent(turma_id)}&aula_id=${encodeURIComponent(aula_id)}`),

  // Quiz
  quizGet: (aula_id) => request(`/quiz?aula_id=${encodeURIComponent(aula_id)}`),
  quizSubmit: (payload) => request("/quiz/submit", { method: "POST", body: payload }),

  // Atividade
  atividadeSubmit: (payload) => request("/atividade/submit", { method: "POST", body: payload }),
  atividadeHide: (payload) => request("/atividade/hide", { method: "POST", body: payload }),

  // Chat
  chatGet: (turma_id, canal, grupo_id = "") =>
    request(`/chat?turma_id=${encodeURIComponent(turma_id)}&canal=${encodeURIComponent(canal)}&grupo_id=${encodeURIComponent(grupo_id)}`),
  chatSend: (payload) => request("/chat/send", { method: "POST", body: payload }),
  chatEdit: (payload) => request("/chat/edit", { method: "POST", body: payload }),
  chatDelete: (payload) => request("/chat/delete", { method: "POST", body: payload }),

  // Files
  filesList: (turma_id, scope, aula_id = "", grupo_id = "") =>
    request(`/files?turma_id=${encodeURIComponent(turma_id)}&scope=${encodeURIComponent(scope)}&aula_id=${encodeURIComponent(aula_id)}&grupo_id=${encodeURIComponent(grupo_id)}`),
  fileUploadMeta: (payload) => request("/file/uploadMeta", { method: "POST", body: payload }),
  fileHide: (payload) => request("/file/hide", { method: "POST", body: payload }),

  // Admin
  adminDashboard: (turma_id) => request(`/admin/dashboard?turma_id=${encodeURIComponent(turma_id)}`),
  adminListSubmissoes: (turma_id, aula_id) =>
    request(`/admin/submissoes?turma_id=${encodeURIComponent(turma_id)}&aula_id=${encodeURIComponent(aula_id)}`),
  adminAvaliar: (payload) => request("/avaliar", { method: "POST", body: payload }),
  adminGerarGrupos: (payload) => request("/groups/generate", { method: "POST", body: payload }),
  adminToggleGrupos: (payload) => request("/groups/toggle", { method: "POST", body: payload }),
  adminEmailSend: (payload) => request("/email/send", { method: "POST", body: payload }),
};
