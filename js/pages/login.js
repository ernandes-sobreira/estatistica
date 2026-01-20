import { api, setUser } from "../api.js";
import { qs, setText, showError } from "../ui.js";
import { TOKEN_KEY } from "../config.js";

qs("#btnLogin").addEventListener("click", async () => {
  try {
    setText("#status", "Entrando...");
    const turma_id = qs("#turma").value.trim() || "LINC-01";
    const apelido  = qs("#apelido").value.trim();
    const codigo   = qs("#codigo").value.trim();

    if (!apelido || !codigo) throw new Error("Preencha apelido e código.");

    const r = await api.login({ turma_id, apelido, codigo });

    // Esperado do backend: { ok:true, token, user:{...} }
    localStorage.setItem(TOKEN_KEY, r.token);
    setUser(r.user);

    // redireciona conforme role
    if (r.user.role === "admin") {
      window.location.href = "admin.html";
    } else {
      window.location.href = "dashboard.html";
    }
  } catch(e) {
    setText("#status", "");
    showError(e.message);
  }
});

// Pré-preencher turma
qs("#turma").value = "LINC-01";
