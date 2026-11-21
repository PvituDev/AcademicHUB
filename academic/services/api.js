(function () {
  window.IFinityHub = window.IFinityHub || {};

  function obterTurmaAtiva() {
    return localStorage.getItem("ifinityhub_turma_ativa") || "info2";
  }

  function chaveStorage(recurso) {
    return `ifinityhub_${obterTurmaAtiva()}_${recurso}_v1`;
  }

  function lerStorage(recurso) {
    try {
      const dados = JSON.parse(localStorage.getItem(chaveStorage(recurso)));
      return Array.isArray(dados) ? dados : [];
    } catch {
      return [];
    }
  }

  function salvarStorage(recurso, lista) {
    try {
      localStorage.setItem(chaveStorage(recurso), JSON.stringify(lista));
    } catch {}
  }

  function respostaSimulada(dados, status = 200) {
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => dados,
    };
  }

  const api = {
    async login(senha) {
      try {
        const resp = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ senha, turma: obterTurmaAtiva() }),
        });
        if (resp.ok) return resp;
      } catch {}

      if (senha === "ifgoiano2026" || senha === "admin123") {
        return respostaSimulada({
          success: true,
          usuario: {
            nome: "Representante",
            cargo: "Representante",
            permissoes: [
              "ler_provas",
              "ler_materiais",
              "postar_forum",
              "ler_editais",
              "criar_provas",
              "editar_provas",
              "deletar_provas",
              "publicar_materiais",
              "moderar_forum",
              "publicar_editais",
            ],
          },
        });
      }
      return respostaSimulada({ success: false, error: "Senha inválida" }, 401);
    },

    async obterGrade() {
      const turmaId = obterTurmaAtiva();
      const gradeLocal =
        window.IFinityHub.TURMAS_CONFIG?.[turmaId] ||
        window.IFinityHub.GRADE_PADRAO;
      return respostaSimulada(gradeLocal);
    },

    async listarProvas() {
      const turma = obterTurmaAtiva();
      try {
        const resp = await fetch(`/api/provas?turma=${encodeURIComponent(turma)}`);
        if (resp.ok) {
          const dados = await resp.json();
          if (Array.isArray(dados)) {
            salvarStorage("provas", dados);
            return respostaSimulada(dados);
          }
        }
      } catch {}
      return respostaSimulada(lerStorage("provas"));
    },

    async salvarProva(payload, editandoId, senhaEditor) {
      const turma = obterTurmaAtiva();
      try {
        const url = editandoId ? `/api/provas/${editandoId}` : "/api/provas";
        const resp = await fetch(url, {
          method: editandoId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            "x-editor-password": senhaEditor,
          },
          body: JSON.stringify({ ...payload, turma }),
        });
        if (resp.ok) return resp;
      } catch {}

      const lista = lerStorage("provas");
      if (editandoId) {
        const atualizada = lista.map((item) =>
          String(item.id) === String(editandoId) ? { ...item, ...payload } : item
        );
        salvarStorage("provas", atualizada);
      } else {
        const novo = {
          id: String(Date.now()),
          ...payload,
          turma,
        };
        salvarStorage("provas", [novo, ...lista]);
      }
      return respostaSimulada({ success: true });
    },

    async deletarProva(id, senhaEditor) {
      try {
        const resp = await fetch(`/api/provas/${id}`, {
          method: "DELETE",
          headers: { "x-editor-password": senhaEditor },
        });
        if (resp.ok) return resp;
      } catch {}

      const filtrada = lerStorage("provas").filter(
        (item) => String(item.id) !== String(id)
      );
      salvarStorage("provas", filtrada);
      return respostaSimulada({ success: true });
    },

    async listarMateriais() {
      const turma = obterTurmaAtiva();
      try {
        const resp = await fetch(`/api/materiais?turma=${encodeURIComponent(turma)}`);
        if (resp.ok) {
          const dados = await resp.json();
          if (Array.isArray(dados)) {
            salvarStorage("materiais", dados);
            return respostaSimulada(dados);
          }
        }
      } catch {}
      return respostaSimulada(lerStorage("materiais"));
    },

    async publicarMaterial(formData, senhaEditor) {
      const turma = obterTurmaAtiva();
      formData.append("turma", turma);
      try {
        const resp = await fetch("/api/materiais", {
          method: "POST",
          headers: { "x-editor-password": senhaEditor },
          body: formData,
        });
        if (resp.ok) return resp;
      } catch {}

      const arquivo = formData.get("arquivo");
      const urlLocal = arquivo ? URL.createObjectURL(arquivo) : "#";
      const novo = {
        id: String(Date.now()),
        nome: formData.get("nome"),
        disciplina: formData.get("disciplina") || "Geral",
        url: urlLocal,
        turma,
      };
      salvarStorage("materiais", [novo, ...lerStorage("materiais")]);
      return respostaSimulada({ success: true });
    },

    async deletarMaterial(id, senhaEditor) {
      try {
        const resp = await fetch(`/api/materiais/${id}`, {
          method: "DELETE",
          headers: { "x-editor-password": senhaEditor },
        });
        if (resp.ok) return resp;
      } catch {}

      const filtrada = lerStorage("materiais").filter(
        (item) => String(item.id) !== String(id)
      );
      salvarStorage("materiais", filtrada);
      return respostaSimulada({ success: true });
    },

    async listarEditais() {
      const turma = obterTurmaAtiva();
      try {
        const resp = await fetch(`/api/editais?turma=${encodeURIComponent(turma)}`);
        if (resp.ok) {
          const dados = await resp.json();
          if (Array.isArray(dados)) {
            salvarStorage("editais", dados);
            return respostaSimulada(dados);
          }
        }
      } catch {}
      return respostaSimulada(lerStorage("editais"));
    },

    async publicarEdital(formData, senhaEditor) {
      const turma = obterTurmaAtiva();
      formData.append("turma", turma);
      try {
        const resp = await fetch("/api/editais", {
          method: "POST",
          headers: { "x-editor-password": senhaEditor },
          body: formData,
        });
        if (resp.ok) return resp;
      } catch {}

      const foto = formData.get("foto");
      let imagem_url = "";
      if (foto && foto.size > 0) {
        imagem_url = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
          reader.onerror = () => resolve("");
          reader.readAsDataURL(foto);
        });
      }

      const novo = {
        id: String(Date.now()),
        titulo: formData.get("titulo"),
        descricao: formData.get("descricao"),
        link_formulario: formData.get("link_formulario"),
        prazo: formData.get("prazo") || "",
        imagem_url,
        turma,
      };
      salvarStorage("editais", [novo, ...lerStorage("editais")]);
      return respostaSimulada({ success: true });
    },

    async deletarEdital(id, senhaEditor) {
      try {
        const resp = await fetch(`/api/editais/${id}`, {
          method: "DELETE",
          headers: { "x-editor-password": senhaEditor },
        });
        if (resp.ok) return resp;
      } catch {}

      const filtrada = lerStorage("editais").filter(
        (item) => String(item.id) !== String(id)
      );
      salvarStorage("editais", filtrada);
      return respostaSimulada({ success: true });
    },

    async listarForum() {
      const turma = obterTurmaAtiva();
      try {
        const resp = await fetch(`/api/forum?turma=${encodeURIComponent(turma)}`);
        if (resp.ok) {
          const dados = await resp.json();
          if (Array.isArray(dados)) {
            salvarStorage("forum", dados);
            return respostaSimulada(dados);
          }
        }
      } catch {}
      return respostaSimulada(lerStorage("forum"));
    },

    async publicarForum(nome, texto) {
      const turma = obterTurmaAtiva();
      try {
        const resp = await fetch("/api/forum", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nome, texto, turma }),
        });
        if (resp.ok) return resp;
      } catch {}

      const novo = {
        id: String(Date.now()),
        nome,
        texto,
        turma,
        criado_em: new Date().toISOString(),
      };
      salvarStorage("forum", [novo, ...lerStorage("forum")]);
      return respostaSimulada({ success: true });
    },

    async deletarForum(id, senhaEditor) {
      try {
        const resp = await fetch(`/api/forum/${id}`, {
          method: "DELETE",
          headers: { "x-editor-password": senhaEditor },
        });
        if (resp.ok) return resp;
      } catch {}

      const filtrada = lerStorage("forum").filter(
        (item) => String(item.id) !== String(id)
      );
      salvarStorage("forum", filtrada);
      return respostaSimulada({ success: true });
    },
  };

  window.IFinityHub.api = api;
})();