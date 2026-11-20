class ConteudoPublicavel {
  #autor;

  static #PALAVRAS_BLOQUEADAS = [
    "idiota", "burro", "burra", "imbecil", "estupido", "estúpido",
    "estupida", "estúpida", "otario", "otário", "otaria", "otária",
    "lixo", "inutil", "inútil", "porra", "merda", "bosta", "cretino",
    "cretina", "retardado", "retardada", "vagabundo", "vagabunda",
    "escroto", "escrota", "desgraçado", "desgraçada", "vadia",
    "vadio", "puta", "viado", "bicha",
  ];

  constructor(autor) {
    if (!autor || !String(autor).trim()) {
      throw new Error("O nome do autor/responsável é obrigatório.");
    }
    this.#autor = String(autor).trim();
  }

  get autor() {
    return this.#autor;
  }

  static contemOfensa(texto) {
    const normalizado = String(texto)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    return ConteudoPublicavel.#PALAVRAS_BLOQUEADAS.some((palavra) => {
      const pNorm = palavra.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return normalizado.includes(pNorm);
    });
  }

  validar() {
    if (ConteudoPublicavel.contemOfensa(this.#autor)) {
      throw new Error("O nome informado contém linguagem ofensiva.");
    }
  }
}

class MaterialPDF extends ConteudoPublicavel {
  constructor({
    id = null,
    nome,
    disciplina = "Geral",
    url = "",
    autor = "Representante",
  }) {
    super(autor);
    this.id = id;
    this.nome = nome ? nome.trim() : "";
    this.disciplina = disciplina.trim() || "Geral";
    this.url = url;
  }

  validar() {
    super.validar();
    if (!this.nome) {
      throw new Error("O nome do material é obrigatório.");
    }
  }

  toDatabase() {
    return {
      nome: this.nome,
      disciplina: this.disciplina,
      url: this.url,
    };
  }
}

class SugestaoForum extends ConteudoPublicavel {
  constructor({ id = null, nome, texto, criado_em = new Date().toISOString() }) {
    super(nome);
    this.id = id;
    this.texto = texto ? texto.trim() : "";
    this.criado_em = criado_em;
  }

  validar() {
    super.validar();
    if (!this.texto) {
      throw new Error("O texto da sugestão é obrigatório.");
    }
    if (this.autor.length > 100 || this.texto.length > 2000) {
      throw new Error("Texto muito longo.");
    }
    if (ConteudoPublicavel.contemOfensa(this.texto)) {
      throw new Error(
        "Sua mensagem contém linguagem ofensiva e não foi publicada. Reescreva de forma construtiva."
      );
    }
  }

  toDatabase() {
    return {
      nome: this.autor,
      texto: this.texto,
      criado_em: this.criado_em,
    };
  }
}

class EditalProjeto extends ConteudoPublicavel {
  #linkFormulario;

  constructor({
    id = null,
    titulo,
    descricao,
    link_formulario,
    imagem_url = null,
    prazo = "",
    autor = "Representante",
  }) {
    super(autor);
    this.id = id;
    this.titulo = titulo ? titulo.trim() : "";
    this.descricao = descricao ? descricao.trim() : "";
    this.linkFormulario = link_formulario;
    this.imagemUrl = imagem_url;
    this.prazo = prazo ? prazo.trim() : "";
  }

  get linkFormulario() {
    return this.#linkFormulario;
  }

  set linkFormulario(url) {
    const limpo = url ? String(url).trim() : "";
    if (!limpo) {
      this.#linkFormulario = "";
      return;
    }
    this.#linkFormulario = /^https?:\/\//i.test(limpo)
      ? limpo
      : `https://${limpo}`;
  }

  validar() {
    super.validar();
    if (!this.titulo) {
      throw new Error("O título do edital é obrigatório.");
    }
    if (!this.descricao) {
      throw new Error("As informações adicionais do edital são obrigatórias.");
    }
    if (!this.#linkFormulario) {
      throw new Error("O link do formulário de inscrição é obrigatório.");
    }
  }

  toDatabase() {
    return {
      titulo: this.titulo,
      descricao: this.descricao,
      link_formulario: this.#linkFormulario,
      imagem_url: this.imagemUrl,
      prazo: this.prazo || null,
    };
  }
}

module.exports = {
  ConteudoPublicavel,
  MaterialPDF,
  SugestaoForum,
  EditalProjeto,
};