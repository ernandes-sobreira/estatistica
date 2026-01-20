import { requireAdmin } from "../auth.js";
import { api, getUser } from "../api.js";
import { qs, showError } from "../ui.js";

requireLogin();
requireAdmin();
qs("#btnLogout").addEventListener("click", logout);

const u = getUser();
setText("#who", `— ADMIN (${u.turma_id})`);

function renderGroupsPreview(groups = []) {
  const box = qs("#groupsPreview");
  box.innerHTML = "";
  if (!groups.length) return;

  groups.forEach(g => {
    box.insertAdjacentHTML("beforeend", `
      <div class="card">
        <b>${escapeHTML(g.nome_grupo || g.grupo_id || "Grupo")}</b>
        <div class="small">média XP: ${escapeHTML(String(g.media_xp ?? "—"))}</div>
        <ul>
          ${(g.membros || []).map(m =>
            `<li>${escapeHTML(m.apelido || m.user_id)} <span class="badge">XP ${escapeHTML(String(m.xp ?? ""))}</span></li>`
          ).join("")}
        </ul>
      </div>
    `);
  });
}

// Dashboard
qs("#btnLoadDash").addEventListener("click", async () => {
  try {
    const d = await api.adminDashboard(u.turma_id);
    setText("#dashPend", d.pendentes ?? "—");
    setText("#dashLate", d.atrasos ?? "—");
    setText("#dashMedia", d.media_turma ?? "—");
    setText("#dashHard", d.atividade_critica ?? "—");

    const list = (d.alertas || []).map(x => `• ${escapeHTML(x)}`).join("<br/>");
    qs("#dashList").innerHTML = list || "<span class='small'>Sem alertas.</span>";
  } catch(e) { showError(e.message); }
});

// Toggle grupos
qs("#btnToggleGroups").addEventListener("click", async () => {
  try {
    const active = qs("#groupsActive").value === "true";
    setText("#groupsStatus", "Aplicando...");
    await api.adminToggleGrupos({ turma_id: u.turma_id, active });
    setText("#groupsStatus", active ? "Grupos ATIVOS." : "Grupos DESATIVADOS (modo sem grupos).");
  } catch(e) { showError(e.message); }
});

// Gerar grupos (XP quartis snake)
qs("#btnGenerateGroups").addEventListener("click", async () => {
  try {
    const size = Number(qs("#groupSize").value || 5);
    setText("#groupsStatus", "Gerando grupos...");
    const r = await api.adminGerarGrupos({
      turma_id: u.turma_id,
      tamanho_grupo: size,
      metodo: "STRATIFIED_XP_QUARTILES_SNAKE",
      estratos: 4,
      extras: "SPREAD"
    });
    setText("#groupsStatus", `OK. Criados: ${r.total_grupos ?? "—"}. Equilíbrio: ${r.metricas?.desvio_entre_grupos ?? "—"}`);
    renderGroupsPreview(r.grupos_preview || []);
  } catch(e) { showError(e.message); }
});

// Carregar submissões por aula
qs("#btnLoadSubs").addEventListener("click", async () => {
  try {
    const aula_id = Number(qs("#gradeAulaId").value);
    if (!aula_id) throw new Error("Informe a aula (1..15).");
    const r = await api.adminListSubmissoes(u.turma_id, aula_id);

    const box = qs("#subsList");
    box.innerHTML = "";

    if (!(r.items || []).length) {
      box.innerHTML = `<p class="small">Sem submissões para essa aula.</p>`;
      return;
    }

    box.insertAdjacentHTML("beforeend", `
      <div class="small">Clique em um item para preencher sub_id/user_id/atividade_id automaticamente.</div>
    `);

    (r.items || []).forEach(it => {
      box.insertAdjacentHTML("beforeend", `
        <div class="card subItem" data-sub="${escapeHTML(it.sub_id)}" data-user="${escapeHTML(it.user_id)}" data-ativ="${escapeHTML(it.atividade_id)}">
          <div><b>${escapeHTML(it.apelido || it.user_id)}</b> · sub_id: <span class="badge">${escapeHTML(it.sub_id)}</span></div>
          <div class="small">atividade_id: ${escapeHTML(it.atividade_id)} · versão: ${escapeHTML(String(it.versao || 1))} · ${escapeHTML(it.submitted_at || "")}</div>
          <div style="margin-top:8px;">${escapeHTML((it.texto_resposta || "").slice(0, 220))}${(it.texto_resposta||"").length>220 ? "..." : ""}</div>
          ${it.link_externo ? `<div class="small" style="margin-top:8px;">Arquivo/link: <a href="${escapeHTML(it.link_externo)}" target="_blank">abrir</a></div>` : ""}
        </div>
      `);
    });

    box.querySelectorAll(".subItem").forEach(el => {
      el.addEventListener("click", () => {
        qs("#gradeSubId").value = el.getAttribute("data-sub");
        qs("#gradeUserId").value = el.getAttribute("data-user");
        qs("#gradeAtividadeId").value = el.getAttribute("data-ativ");
        window.scrollTo({ top: document.body.scrollHeight * 0.35, behavior: "smooth" });
      });
    });

  } catch(e) { showError(e.message); }
});

// Enviar nota
qs("#btnSubmitGrade").addEventListener("click", async () => {
  try {
    setText("#gradeStatus", "Salvando...");
    const payload = {
      turma_id: u.turma_id,
      sub_id: qs("#gradeSubId").value.trim(),
      user_id: qs("#gradeUserId").value.trim(),
      atividade_id: qs("#gradeAtividadeId").value.trim(),
      nota: Number(qs("#gradeNota").value),
      feedback_prof: qs("#gradeFeedback").value.trim(),
      publicado: qs("#gradePub").value === "true"
    };
    if (!payload.sub_id || !payload.user_id || !payload.atividade_id) throw new Error("Preencha sub_id, user_id e atividade_id.");
    if (Number.isNaN(payload.nota)) throw new Error("Informe a nota.");

    const r = await api.adminAvaliar(payload);
    setText("#gradeStatus", `OK. Nota lançada. XP atualizado: ${r.xp_total ?? "—"}`);
  } catch(e) {
    setText("#gradeStatus", "");
    showError(e.message);
  }
});

// E-mail
qs("#btnSendMail").addEventListener("click", async () => {
  try {
    setText("#mailStatus", "Enviando...");
    const to_type = qs("#mailToType").value;
    const to_value = qs("#mailToValue").value.trim();
    if ((to_type === "grupo" || to_type === "user") && !to_value) throw new Error("Informe o grupo_id ou user_id.");

    const payload = {
      turma_id: u.turma_id,
      to_type,
      to_value,
      assunto: qs("#mailSubj").value.trim(),
      corpo_html: qs("#mailBody").value.trim()
    };
    if (!payload.assunto || !payload.corpo_html) throw new Error("Assunto e corpo são obrigatórios.");

    await api.adminEmailSend(payload);
    setText("#mailStatus", "OK. E-mail enfileirado para envio.");
  } catch(e) {
    setText("#mailStatus", "");
    showError(e.message);
  }
});

// Moderação chat (carrega + apaga como admin)
async function admLoadChat(){
  try{
    const canal = qs("#admCanal").value;
    const grupo_id = qs("#admGrupoId").value.trim();
    const aula_id = qs("#admAulaId").value.trim();

    const data = await api.chatGet(u.turma_id, canal, grupo_id);
    let items = data.items || [];
    if (aula_id) items = items.filter(x => String(x.aula_id||"") === String(aula_id));

    const box = qs("#admMsgs");
    box.innerHTML = "";

    for (const m of items){
      const aulaTag = m.aula_id ? ` <span class="badge">Aula ${escapeHTML(String(m.aula_id))}</span>` : "";
      box.insertAdjacentHTML("beforeend", `
        <div class="card">
          <div class="small"><b>${escapeHTML(m.apelido||"")}</b>${aulaTag} · ${escapeHTML(m.created_at||"")}</div>
          <div style="margin-top:8px;">
            <div class="small">status: <b>${escapeHTML(m.status||"active")}</b> · msg_id: ${escapeHTML(m.msg_id)}</div>
            <div style="margin-top:6px;">${escapeHTML(m.mensagem||"")}</div>
          </div>
          <div style="margin-top:10px;">
            <button data-del="${m.msg_id}" style="width:auto;">Apagar (admin)</button>
          </div>
        </div>
      `);
    }

    box.querySelectorAll("button[data-del]").forEach(btn=>{
      btn.addEventListener("click", async ()=>{
        const msg_id = btn.getAttribute("data-del");
        if (!confirm("Apagar como admin?")) return;
        await api.chatDelete({ turma_id: u.turma_id, msg_id, as_admin: true });
        await admLoadChat();
      });
    });
  } catch(e){ showError(e.message); }
}

qs("#admLoadChat").addEventListener("click", admLoadChat);

// Logs (V1 simples)
qs("#btnLoadLogs").addEventListener("click", async () => {
  try {
    // Se você tiver um endpoint /admin/logs; se não, implemente depois.
    const r = await fetch(`${(await import("../config.js")).SCRIPT_URL}/admin/logs?turma_id=${encodeURIComponent(u.turma_id)}`, {
      headers: { "Authorization": `Bearer ${localStorage.getItem("linc_token") || ""}` }
    });
    const text = await r.text();
    let data; try { data = JSON.parse(text); } catch { data = { items: [] }; }

    const box = qs("#logsBox");
    box.innerHTML = (data.items || []).map(x =>
      `<div>• <b>${escapeHTML(x.acao)}</b> — ${escapeHTML(x.user_id || "")} — ${escapeHTML(x.timestamp || "")}</div>`
    ).join("") || "<div class='small'>Sem logs.</div>";
  } catch(e){ showError("Endpoint /admin/logs ainda não implementado no backend (ok para V1)."); }
});
