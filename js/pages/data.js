import { requireLogin } from "../auth.js";
import { api } from "../api.js";
import { qs, showError } from "../ui.js";

requireLogin();
const u = getUser();
setText("#who", `— ${u.apelido} (${u.turma_id})`);

const sources = [
  {
    nivel: "N1–N2",
    nome: "INMET / BDMEP",
    link: "https://bdmep.inmet.gov.br/",
    oque: "Séries de temperatura, precipitação, umidade. Ótimo para tendência, variabilidade, regressão.",
    perguntas: [
      "Precipitação anual (soma) mudou ao longo do tempo?",
      "Existe quebra de tendência (mudança estrutural) em alguma variável?",
      "Como a variabilidade (DP) mudou por década?"
    ]
  },
  {
    nivel: "N1–N3",
    nome: "IBGE / SIDRA",
    link: "https://sidra.ibge.gov.br/",
    oque: "Demografia e indicadores municipais. Bom para correlações (com cuidado) e modelos multilineares.",
    perguntas: [
      "Quais variáveis explicam mais a variação de um indicador X entre municípios?",
      "Como interpretar correlação sem cair em causalidade?"
    ]
  },
  {
    nivel: "N2–N4",
    nome: "MapBiomas",
    link: "https://mapbiomas.org/",
    oque: "Uso e cobertura da terra. Excelente para análises ecológicas e ambientais (mudança, pressão, paisagem).",
    perguntas: [
      "Mudança de cobertura florestal explica mudança em um indicador climático?",
      "Como comparar dois períodos com ANOVA/ANCOVA?"
    ]
  },
  {
    nivel: "N3–N5",
    nome: "DATASUS (SIM / Mortalidade)",
    link: "https://datasus.saude.gov.br/informacoes-de-saude-tabnet/",
    oque: "Dados de saúde pública para análises críticas (cuidado ético). Bom para GLM e modelos com contagem.",
    perguntas: [
      "Como modelar contagens (Poisson/NegBin) de forma responsável?",
      "Como controlar confundidores em modelos multilineares?"
    ]
  },
  {
    nivel: "N1–N5",
    nome: "Repositório do curso (Drive/GitHub)",
    link: "#",
    oque: "Aqui você (professor) pode colocar datasets prontos por aula (CSV) para não depender de download externo.",
    perguntas: [
      "Dataset ANOVA 1 via",
      "Dataset ANOVA 2 vias",
      "Dataset regressão linear",
      "Dataset GLM (Poisson/binomial)"
    ]
  }
];

const box = qs("#cards");
box.innerHTML = "";

sources.forEach(s => {
  box.insertAdjacentHTML("beforeend", `
    <div class="card">
      <div class="row">
        <div class="col">
          <div class="badge">${escapeHTML(s.nivel)}</div>
          <h3 style="margin-top:10px;">${escapeHTML(s.nome)}</h3>
          <p>${escapeHTML(s.oque)}</p>
          <p><a href="${escapeHTML(s.link)}" target="_blank">abrir fonte</a></p>
        </div>
        <div class="col">
          <b>Perguntas-guia</b>
          <ul>
            ${(s.perguntas || []).map(p => `<li>${escapeHTML(p)}</li>`).join("")}
          </ul>
        </div>
      </div>
    </div>
  `);
});
