(function () {
  window.IFinityHub = window.IFinityHub || {};

  const HISTORICO_KEY = "ifinityhub_notificacoes_historico_v1";
  const VISTOS_KEY = "ifinityhub_notificacoes_vistos_v1";

  function carregarHistorico() {
    try {
      const dados = JSON.parse(localStorage.getItem(HISTORICO_KEY));
      return Array.isArray(dados) ? dados : [];
    } catch {
      return [];
    }
  }

  function salvarHistorico(lista) {
    try {
      localStorage.setItem(HISTORICO_KEY, JSON.stringify(lista.slice(0, 60)));
    } catch {}
  }

  function carregarVistos() {
    try {
      const dados = JSON.parse(localStorage.getItem(VISTOS_KEY));
      return dados && typeof dados === "object" ? dados : {};
    } catch {
      return {};
    }
  }

  function salvarVistos(mapa) {
    try {
      localStorage.setItem(VISTOS_KEY, JSON.stringify(mapa));
    } catch {}
  }

  function marcarChaveComoVista(chave) {
    const vistos = carregarVistos();
    vistos[chave] = true;
    salvarVistos(vistos);
  }

  async function pedirPermissaoNativa() {
    if (!("Notification" in window)) return "unsupported";
    if (Notification.permission === "granted") return "granted";
    if (Notification.permission === "denied") return "denied";
    try {
      return await Notification.requestPermission();
    } catch {
      return "default";
    }
  }

  function dispararNativa(titulo, corpo, aoClicar) {
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
        if (typeof aoClicar === "function") aoClicar();
        notif.close();
      };
    } catch {}
  }

  function detectarNovidades({
    eventos = [],
    editais = [],
    materiais = [],
    achados = [],
  }) {
    const vistos = carregarVistos();
    const primeiraExecucao = Object.keys(vistos).length === 0;
    const novidades = [];

    const registrar = (chave, titulo, descricao, aba) => {
      if (!vistos[chave]) {
        vistos[chave] = true;
        if (!primeiraExecucao) {
          novidades.push({
            uid: `${chave}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            titulo,
            descricao,
            aba,
            lida: false,
            criadoEm: new Date().toISOString(),
          });
        }
      }
    };

    eventos.forEach((evt) => {
      const label =
        evt.tipo === "prova"
          ? "Nova Prova"
          : evt.tipo === "dever"
            ? "Novo Dever"
            : "Novo Evento";
      registrar(
        `evento_${evt.id}`,
        `${label}: ${evt.nomeOriginal}`,
        `Data: ${evt.start}`,
        "dashboard"
      );
    });

    editais.forEach((ed) => {
      registrar(
        `edital_${ed.id}`,
        `Novo Edital: ${ed.titulo}`,
        ed.prazo ? `Inscrições até ${ed.prazo}` : "Inscrições abertas",
        "editais"
      );
    });

    materiais.forEach((mat) => {
      registrar(
        `material_${mat.id}`,
        `Novo Material (${mat.disciplina})`,
        mat.nome,
        "materiais"
      );
    });

    achados.forEach((item) => {
      if (item.resolvido) return;
      const prefixo =
        item.categoria === "perdido"
          ? "Item Perdido Relatado"
          : "Item Encontrado no Campus";
      registrar(
        `achado_${item.id}`,
        `${prefixo}: ${item.titulo}`,
        `Local: ${item.local}`,
        "achados"
      );
    });

    salvarVistos(vistos);
    return novidades;
  }

  window.IFinityHub.notificacoes = {
    carregarHistorico,
    salvarHistorico,
    marcarChaveComoVista,
    pedirPermissaoNativa,
    dispararNativa,
    detectarNovidades,
  };
})();