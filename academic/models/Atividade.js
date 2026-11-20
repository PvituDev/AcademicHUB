class Atividade {
  #id;

  constructor({ id = null, title, start, descricao = "" }) {
    if (!title || !start) {
      throw new Error("Título e data da atividade são obrigatórios.");
    }
    this.#id = id;
    this.title = title.trim();
    this.start = start;
    this.descricao = descricao.trim() || "Sem descrição cadastrada.";
  }

  get id() {
    return this.#id;
  }

  get tipo() {
    return "geral";
  }

  obterCor() {
    return "#2563eb";
  }

  obterPrefixo() {
    return "[ATIVIDADE]";
  }

  estaVencida(dataReferencia = new Date().toISOString().slice(0, 10)) {
    return this.start.slice(0, 10) < dataReferencia;
  }

  toDatabase() {
    return {
      title: this.title,
      tipo: this.tipo,
      start: this.start,
      descricao:
        this.descricao === "Sem descrição cadastrada." ? "" : this.descricao,
    };
  }

  toJSON() {
    return {
      id: this.#id,
      title: this.title,
      tituloFormatado: `${this.obterPrefixo()} ${this.title}`,
      tipo: this.tipo,
      start: this.start,
      descricao: this.descricao,
      cor: this.obterCor(),
      vencida: this.estaVencida(),
    };
  }

  static criarPorTipo(dados) {
    switch (dados.tipo) {
      case "prova":
        return new Prova(dados);
      case "dever":
        return new Dever(dados);
      case "evento":
        return new Evento(dados);
      default:
        return new Atividade(dados);
    }
  }
}

class Prova extends Atividade {
  get tipo() {
    return "prova";
  }
  obterCor() {
    return "#dc2626";
  }
  obterPrefixo() {
    return "[PROVA]";
  }
}

class Dever extends Atividade {
  get tipo() {
    return "dever";
  }
  obterCor() {
    return "#d97706";
  }
  obterPrefixo() {
    return "[DEVER]";
  }
}

class Evento extends Atividade {
  get tipo() {
    return "evento";
  }
  obterCor() {
    return "#8b5cf6";
  }
  obterPrefixo() {
    return "[EVENTO]";
  }
}

module.exports = { Atividade, Prova, Dever, Evento };