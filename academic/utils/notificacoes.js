(function () {
  window.IFinityHub = window.IFinityHub || {};

  const STORAGE_SEEN_KEY = "ifinityhub_seen_items_v1";
  const STORAGE_HISTORY_KEY = "ifinityhub_notif_history_v1";

  function carregarVistos() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_SEEN_KEY)) || null;
    } catch {
      return null;
    }
  }

  function salvarVistos(mapa) {
    try {
      localStorage.setItem(STORAGE_SEEN_KEY, JSON.stringify(mapa));
    } catch {}
  }

  function carregarHistorico() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_HISTORY_KEY)) || [];
    } catch {
      return [];
    }
  }

  function salvarHistorico(lista) {
    try {
      localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(lista.slice(0, 30)));
    } catch {}
  }

  async function pedirPermissaoNativa() {
    if (!("Notification" in window)) return "unsupported";
    if (Notification.permission === "granted") return "granted";
    if (Notification.permission === "denied") return "denied";
    return await Notification.requestPermission();
  }

  function dispararNativa(titulo, corpo, onClick) {
    if (!("Notification" in window) || Notification.permission !== "granted") {
      return;
    }
    try {
      const notif = new Notification(titulo, {
        body: corpo,
        icon: "./assets/lg%20IFinityHub.png",
        badge: "./assets/lg%20IFinityHub.png",
      });
      notif.onclick = () => {
        window.focus();
        onClick?.();
        notif.close();
      };
    } catch (err) {
      console.warn("Notificação nativa bloqueada:", err);
    }
  }

  /**
   * Compara listas atuais (eventos, editais, materiais) com o histórico salvo
   * e retorna apenas os itens recém-publicados.
   */
  function detectarNovidades({ eventos = [], editais = [], materiais = [] }) {
    const vistos = carregarVistos();
    const mapaAtual = {
      eventos: eventos.map((e) => String(e.id)),
      editais: editais.map((ed) => String(ed.id)),
      materiais: materiais.map((m) => String(m.id)),
    };

    // Primeira execução: apenas memoriza o estado inicial sem gerar spam
    if (!vistos) {
      salvarVistos(mapaAtual);
      return [];
    }

    const novas = [];

    eventos.forEach((evt) => {
      if (!vistos.eventos?.includes(String(evt.id))) {
        const rotulo =
          evt.tipo === "prova"
            ? "Nova Prova"
            : evt.tipo === "dever"
              ? "Nova Atividade"
              : "Novo Evento";
        novas.push({
          uid: `evt-${evt.id}`,
          categoria: evt.tipo || "evento",
          aba: "dashboard",
          titulo: `${rotulo}: ${evt.nomeOriginal || evt.title}`,
          descricao: `Data: ${(evt.start || "").slice(0, 10)}${evt.descricao ? ` • ${evt.descricao}` : ""}`,
          criadoEm: new Date().toISOString(),
          lida: false,
        });
      }
    });

    editais.forEach((ed) => {
      if (!vistos.editais?.includes(String(ed.id))) {
        novas.push({
          uid: `edital-${ed.id}`,
          categoria: "edital",
          aba: "editais",
          titulo: `Novo Edital de Projeto: ${ed.titulo}`,
          descricao: ed.prazo ? `Inscrições até ${ed.prazo}` : "Inscrições abertas",
          criadoEm: new Date().toISOString(),
          lida: false,
        });
      }
    });

    materiais.forEach((mat) => {
      if (!vistos.materiais?.includes(String(mat.id))) {
        novas.push({
          uid: `mat-${mat.id}`,
          categoria: "material",
          aba: "materiais",
          titulo: `Novo Material (${mat.disciplina})`,
          descricao: mat.nome,
          criadoEm: new Date().toISOString(),
          lida: false,
        });
      }
    });

    salvarVistos(mapaAtual);
    return novas;
  }

  window.IFinityHub.notificacoes = {
    carregarHistorico,
    salvarHistorico,
    pedirPermissaoNativa,
    dispararNativa,
    detectarNovidades,
  };
})();