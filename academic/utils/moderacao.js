(function () {
  window.IFinityHub = window.IFinityHub || {};

  const PALAVRAS_BLOQUEADAS = [
    "idiota", "burro", "burra", "imbecil", "estupido", "estúpido",
    "estupida", "estúpida", "otario", "otário", "otaria", "otária",
    "lixo", "inutil", "inútil", "porra", "merda", "bosta", "cretino",
    "cretina", "retardado", "retardada", "vagabundo", "vagabunda",
    "escroto", "escrota", "desgraçado", "desgraçada", "vadia",
    "vadio", "puta", "viado", "bicha", "gordo demais", "feio pra caramba",
  ];

  function normalizarTexto(txt) {
    return txt
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function contemOfensa(texto) {
    const normalizado = normalizarTexto(texto);
    return PALAVRAS_BLOQUEADAS.some((palavra) =>
      normalizado.includes(normalizarTexto(palavra))
    );
  }

  function formatarContagemRegressiva(dataStr) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const dataAlvo = new Date(`${(dataStr || "").slice(0, 10)}T00:00:00`);
    const diffDias = Math.round((dataAlvo - hoje) / (1000 * 60 * 60 * 24));

    if (isNaN(diffDias)) return dataStr;
    if (diffDias === 0) return "Hoje";
    if (diffDias === 1) return "Amanhã";
    if (diffDias > 1) return `Em ${diffDias}d • ${dataStr}`;
    return dataStr;
  }

  window.IFinityHub.utils = {
    contemOfensa,
    formatarContagemRegressiva,
  };
})();