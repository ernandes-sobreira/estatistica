import { requireLogin } from "../auth.js";
import { api, getUser, clearSession } from "../api.js";
import { qs, setText, showError, escapeHTML } from "../ui.js";

requireLogin();
const u = getUser();

setText("#who", `— ${u.apelido} (${u.turma_id})`);

qs("#btnLogout").addEventListener("click", () => {
  clearSession();
  window.location.href = "index.html";
});

function render(items = []) {
  const box = qs("#aulasBox");
  box.innerHTML = "";

  if (!items.length) {
    box.innerHTML = `<div class="card"><p class="small">Ainda não há aulas cadastradas. (Professor: rode o setup e preencha a aba AULAS)</p></div>`;
    return;
  }

  items.forEach(a => {
    box.insertAdjacentHTML("beforeend", `
      <div class="card">
        <div class="row">
          <div class="col">
            <div class="badge">Aula ${escapeHTML(String(a.aula_id))}</div>
            <h3 style="margin-top:10px;">${escapeHTML(a.titulo || "Sem título")}</h3>
            <p class="small">${escapeHTML(a.teoria_resumo || "")}</p>
          </div>
          <div class="col">
            <b>Links</b>
            <div class="small">
              ${a.link_gravacao ? `• <a href="${escapeHTML(a.link_gravacao)}" target="_blank">Gravação</a><br/>` : ""}
              ${a.link_slides ? `• <a href="${escapeHTML(a.link_slides)}" target="_blank">Slides</a><br/>` : ""}
              ${a.link_leituras ? `• <a href="${escapeHTML(a.link_leituras)}" target="_blank">Leituras</a><br/>` : ""}
            </div>
          </div>
        </div>

        <div style="margin-top:10px;">
          <a href="aula.html?aula_id=${encodeURIComponent(a.aula_id)}">
            <button style="width:auto;">Abrir aula</button>
          </a>
        </div>
      </div>
    `);
  });
}

async function load() {
  try {
    const r = await api.aulas(u.turma_id);
    render(r.items || []);
  } catch(e) { showError(e.message); }
}

load();
