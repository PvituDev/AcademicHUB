(function () {
  window.IFinityHub = window.IFinityHub || {};

  const STORAGE_KEY = "ifinityhub_a11y_prefs_v1";

  const PERFIS_VISAO = {
    normal: {
      id: "normal",
      nome: "Normal Vision (Padrão)",
      subtitulo: "Paleta original em esmeralda, vermelho e âmbar.",
      descricao: "Exibição padrão do IFinityHub sem alteração cromática.",
      destaqueHex: "#10b981",
      coresEventos: {
        prova: "#dc2626",
        dever: "#d97706",
        evento: "#8b5cf6",
        outro: "#2563eb",
      },
      matrizSVG: "1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0",
    },
    protanopia: {
      id: "protanopia",
      nome: "Protanopia (Deficiência no Vermelho)",
      subtitulo: "Substitui conflitos vermelho/verde por Azul Cobalto, Ouro e Ciano.",
      descricao:
        "Otimizado para baixa sensibilidade aos cones vermelhos (L). Troca alertas vermelhos por laranja vivo e destaques verdes por azul ciano.",
      destaqueHex: "#0ea5e9",
      coresEventos: {
        prova: "#ea580c",
        dever: "#eab308",
        evento: "#38bdf8",
        outro: "#6366f1",
      },
      matrizSVG:
        "0.567 0.433 0 0 0  0.558 0.442 0 0 0  0 0.242 0.758 0 0  0 0 0 1 0",
    },
    deuteranopia: {
      id: "deuteranopia",
      nome: "Deuteranopia (Deficiência no Verde)",
      subtitulo: "Contraste máximo entre Azul Safira, Laranja Queimado e Amarelo.",
      descricao:
        "Otimizado para dificuldade em distinguir verde e vermelho (cones M). Usa o eixo azul-amarelo/laranja para separar provas, deveres e status.",
      destaqueHex: "#3b82f6",
      coresEventos: {
        prova: "#f97316",
        dever: "#facc15",
        evento: "#2563eb",
        outro: "#06b6d4",
      },
      matrizSVG:
        "0.625 0.375 0 0 0  0.7 0.3 0 0 0  0 0.3 0.7 0 0  0 0 0 1 0",
    },
    tritanopia: {
      id: "tritanopia",
      nome: "Tritanopia (Deficiência no Azul/Amarelo)",
      subtitulo: "Usa Vermelho Carmesim, Turquesa e Rosa Magenta de alto contraste.",
      descricao:
        "Otimizado para dificuldade em distinguir azul e amarelo (cones S). Prioriza o eixo vermelho-turquesa/ciano para diferenciar categorias.",
      destaqueHex: "#14b8a6",
      coresEventos: {
        prova: "#e11d48",
        dever: "#fb7185",
        evento: "#0d9488",
        outro: "#2dd4bf",
      },
      matrizSVG:
        "0.95 0.05 0 0 0  0 0.433 0.567 0 0  0 0.475 0.525 0 0  0 0 0 1 0",
    },
  };

  const PREFS_PADRAO = {
    modoVisao: "normal",
    escalaFonte: 100, // 85 a 125 (%)
    espacamentoLeitura: false,
    reduzirAnimacoes: false,
    altoContrasteBordas: false,
    aplicarFiltroImagens: false,
    destacarLinksBotoes: false,
    // Recursos para Deficiência Visual (TalkBack / TTS) e Auditiva (Alertas Visuais + Legendas)
    talkbackAtivo: false,
    velocidadeVoz: 1.0, // 0.8, 1.0, 1.25, 1.5
    alertasVisuaisAudicao: false,
    legendasVozAtivas: false,
  };

  function carregarPreferencias() {
    try {
      const salvo = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return { ...PREFS_PADRAO, ...(salvo || {}) };
    } catch {
      return { ...PREFS_PADRAO };
    }
  }

  function salvarPreferencias(prefs) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {}
  }

  function garantirFiltroSVG() {
    let svg = document.getElementById("ifinityhub-a11y-svg");
    if (!svg) {
      svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("id", "ifinityhub-a11y-svg");
      svg.setAttribute("aria-hidden", "true");
      svg.style.position = "absolute";
      svg.style.width = "0";
      svg.style.height = "0";
      svg.style.pointerEvents = "none";
      svg.innerHTML = `
        <defs>
          <filter id="ifinityhub-daltonismo-filter">
            <feColorMatrix id="ifinityhub-daltonismo-matrix" type="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" />
          </filter>
        </defs>
      `;
      document.body.appendChild(svg);
    }
    return document.getElementById("ifinityhub-daltonismo-matrix");
  }

  function aplicarNoDocumento(prefs) {
    const perfil = PERFIS_VISAO[prefs.modoVisao] || PERFIS_VISAO.normal;
    const root = document.documentElement;

    root.setAttribute("data-vision-mode", perfil.id);
    root.setAttribute(
      "data-high-contrast",
      prefs.altoContrasteBordas ? "true" : "false"
    );
    root.setAttribute(
      "data-image-filter",
      prefs.aplicarFiltroImagens && perfil.id !== "normal" ? "true" : "false"
    );
    root.setAttribute(
      "data-reading-spacing",
      prefs.espacamentoLeitura ? "true" : "false"
    );
    root.setAttribute(
      "data-reduce-motion",
      prefs.reduzirAnimacoes ? "true" : "false"
    );
    root.setAttribute(
      "data-highlight-interactive",
      prefs.destacarLinksBotoes ? "true" : "false"
    );
    root.setAttribute(
      "data-visual-alerts",
      prefs.alertasVisuaisAudicao ? "true" : "false"
    );

    const escala = Number(prefs.escalaFonte) || 100;
    root.style.fontSize = `${escala}%`;
    root.style.setProperty("--a11y-accent", perfil.destaqueHex);

    const matrixEl = garantirFiltroSVG();
    if (matrixEl) {
      matrixEl.setAttribute("values", perfil.matrizSVG);
    }
  }

  function obterCorEvento(tipo, modoVisao = "normal") {
    const perfil = PERFIS_VISAO[modoVisao] || PERFIS_VISAO.normal;
    return perfil.coresEventos[tipo] || perfil.coresEventos.outro;
  }

  // Motor de Síntese de Voz (Modo TalkBack)
  function falarTexto(texto, velocidade = 1.0, onLegenda = null) {
    const limpo = (texto || "").replace(/\s+/g, " ").trim();
    if (!limpo) return;

    if (typeof onLegenda === "function") {
      onLegenda(limpo);
    }

    if (!("speechSynthesis" in window)) return;

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(limpo);
      utterance.lang = "pt-BR";
      utterance.rate = Number(velocidade) || 1.0;
      utterance.pitch = 1.0;

      const vozes = window.speechSynthesis.getVoices();
      const vozPT = vozes.find((v) => v.lang && v.lang.toLowerCase().includes("pt"));
      if (vozPT) utterance.voice = vozPT;

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn("Erro na síntese de voz:", err);
    }
  }

  function pararFala() {
    if ("speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
  }

  window.IFinityHub.acessibilidade = {
    PERFIS_VISAO,
    PREFS_PADRAO,
    carregarPreferencias,
    salvarPreferencias,
    aplicarNoDocumento,
    obterCorEvento,
    falarTexto,
    pararFala,
  };
})();