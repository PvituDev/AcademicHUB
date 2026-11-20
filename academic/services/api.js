(function () {
  window.IFinityHub = window.IFinityHub || {};

  const API_URL = "https://amc-code0.onrender.com/api";

  const api = {
    baseUrl: API_URL,

    login: (senha) =>
      fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senha }),
      }),

    listarProvas: () => fetch(`${API_URL}/provas`),
    salvarProva: (dados, id, senha) =>
      fetch(id ? `${API_URL}/provas/${id}` : `${API_URL}/provas`, {
        method: id ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": senha,
        },
        body: JSON.stringify(dados),
      }),
    deletarProva: (id, senha) =>
      fetch(`${API_URL}/provas/${id}`, {
        method: "DELETE",
        headers: { "x-admin-password": senha },
      }),

    listarMateriais: () => fetch(`${API_URL}/materiais`),
    publicarMaterial: (formData, senha) =>
      fetch(`${API_URL}/materiais`, {
        method: "POST",
        headers: { "x-admin-password": senha },
        body: formData,
      }),
    deletarMaterial: (id, senha) =>
      fetch(`${API_URL}/materiais/${id}`, {
        method: "DELETE",
        headers: { "x-admin-password": senha },
      }),

    listarEditais: () => fetch(`${API_URL}/editais`),
    publicarEdital: (formData, senha) =>
      fetch(`${API_URL}/editais`, {
        method: "POST",
        headers: { "x-admin-password": senha },
        body: formData,
      }),
    deletarEdital: (id, senha) =>
      fetch(`${API_URL}/editais/${id}`, {
        method: "DELETE",
        headers: { "x-admin-password": senha },
      }),

    listarForum: () => fetch(`${API_URL}/forum`),
    publicarForum: (nome, texto) =>
      fetch(`${API_URL}/forum`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, texto }),
      }),
    deletarForum: (id, senha) =>
      fetch(`${API_URL}/forum/${id}`, {
        method: "DELETE",
        headers: { "x-admin-password": senha },
      }),

    obterGrade: () => fetch(`${API_URL}/grade`),
  };

  window.IFinityHub.api = api;
})();