import { requireLogin } from "../auth.js";
import { api } from "../api.js";
import { qs, showError } from "../ui.js";


requireLogin();
const u = getUser();
setText("#who", `— ${u.apelido} (${u.turma_id})`);

qs("#btnAdd").addEventListener("click", async () => {
  try {
    setText("#status", "Registrando...");
    const payload = {
      turma_id: u.turma_id,
      user_id: u.user_id,
      grupo_id: u.grupo_id || "",
      visibilidade: qs("#vis").value,
      aula_id: qs("#aula_id").value.trim(),
      nome: qs("#nome").value.trim(),
      link: qs("#link").value.trim()
    };
    if (!payload.nome || !payload.link) throw new Error("Nome e link são obrigatórios.");
    if (payload.visibilidade === "grupo" && !u.grupo_id) throw new Error("Você está sem grupo ativo.");

    // V1: registramos meta (link) via endpoint fileUploadMeta
    await api.fileUploadMeta(payload);
    setText("#status", "OK. Arquivo registrado.");
  } catch(e){
    setText("#status","");
    showError(e.message);
  }
});

function render(items = []) {
  const box = qs("#listBox");
  box.innerHTML = "";
  if (!items.length) {
    box.innerHTML = `<p class="small">Nenhum arquivo encontrado.</p>`;
    return;
  }
  items.forEach(f => {
    box.insertAdjacentHTML("beforeend", `
      <div class="card">
        <div><b>${escapeHTML(f.nome || "arquivo")}</b>
          <span class="badge">${escapeHTML(f.visibilidade || "—")}</span>
          ${f.aula_id ? `<span class="badge">Aula ${escapeHTML(String(f.aula_id))}</span>` : ""}
        </div>
        <div class="small">owner: ${escapeHTML(f.owner_apelido || f.owner_user_id || "")} · ${escapeHTML(f.created_at || "")}</div>
        <div style="margin-top:8px;">
          <a href="${escapeHTML(f.link || "#")}" target="_blank">abrir</a>
        </div>
        ${f.owner_user_id === u.user_id ? `
          <div style="margin-top:10px;">
            <button data-hide="${escapeHTML(f.file_id)}" style="width:auto;">Ocultar</button>
          </div>
        ` : ""}
      </div>
    `);
  });

  box.querySelectorAll("button[data-hide]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const file_id = btn.getAttribute("data-hide");
      if (!confirm("Ocultar este arquivo? (fica no log)")) return;
      await api.fileHide({ turma_id: u.turma_id, file_id });
      await loadList();
    });
  });
}

async function loadList() {
  try {
    const scope = qs("#scope").value;
    const aula_id = qs("#filterAula").value.trim();

    let grupo_id = "";
    if (scope === "grupo") grupo_id = u.grupo_id || "";
    if (scope === "grupo" && !grupo_id) throw new Error("Você está sem grupo ativo.");

    const data = await api.filesList(u.turma_id, scope, aula_id, grupo_id);
    render(data.items || []);
  } catch(e){ showError(e.message); }
}

qs("#btnList").addEventListener("click", loadList);
