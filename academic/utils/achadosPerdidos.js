(function () {
  window.IFinityHub = window.IFinityHub || {};

  const STORAGE_KEY = "ifinityhub_achados_perdidos_v1";

  function carregarLocal() {
    try {
      const dados = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return Array.isArray(dados) ? dados : [];
    } catch {
      return [];
    }
  }

  function salvarLocal(lista) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
    } catch {}
  }

  function lerImagemComoDataURL(arquivo) {
    return new Promise((resolve) => {
      if (!arquivo) return resolve("");
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
      reader.onerror = () => resolve("");
      reader.readAsDataURL(arquivo);
    });
  }

  async function listarItens() {
    try {
      const resp = await fetch("/api/achados-perdidos");
      if (resp.ok) {
        const remotos = await resp.json();
        if (Array.isArray(remotos)) {
          salvarLocal(remotos);
          return remotos;
        }
      }
    } catch {}
    return carregarLocal();
  }

  async function publicarItem({ categoria, titulo, local, descricao, contato, autor, arquivoFoto }) {
    const imagem_url = await lerImagemComoDataURL(arquivoFoto);

    try {
      const formData = new FormData();
      formData.append("categoria", categoria); // "perdido" ou "achado"
      formData.append("titulo", titulo);
      formData.append("local", local);
      formData.append("descricao", descricao);
      formData.append("contato", contato);
      formData.append("autor", autor);
      if (arquivoFoto) formData.append("foto", arquivoFoto);

      const resp = await fetch("/api/achados-perdidos", {
        method: "POST",
        body: formData,
      });
      if (resp.ok) {
        return await listarItens();
      }
    } catch {}

    const atual = carregarLocal();
    const novo = {
      id: String(Date.now()),
      categoria,
      titulo,
      local,
      descricao,
      contato,
      autor,
      imagem_url,
      resolvido: false,
      criado_em: new Date().toISOString(),
    };
    const atualizado = [novo, ...atual];
    salvarLocal(atualizado);
    return atualizado;
  }

  async function alternarResolvido(id) {
    try {
      const resp = await fetch(`/api/achados-perdidos/${id}/resolver`, {
        method: "PATCH",
      });
      if (resp.ok) {
        return await listarItens();
      }
    } catch {}

    const atualizado = carregarLocal().map((item) =>
      String(item.id) === String(id)
        ? { ...item, resolvido: !item.resolvido }
        : item
    );
    salvarLocal(atualizado);
    return atualizado;
  }

  async function deletarItem(id, senhaEditor) {
    try {
      const resp = await fetch(`/api/achados-perdidos/${id}`, {
        method: "DELETE",
        headers: senhaEditor ? { "x-editor-password": senhaEditor } : {},
      });
      if (resp.ok) {
        return await listarItens();
      }
    } catch {}

    const atualizado = carregarLocal().filter(
      (item) => String(item.id) !== String(id)
    );
    salvarLocal(atualizado);
    return atualizado;
  }

  window.IFinityHub.achadosPerdidos = {
    listarItens,
    publicarItem,
    alternarResolvido,
    deletarItem,
  };
})();