class Usuario {
  #senha;

  constructor(nome, senha = null) {
    this.nome = nome;
    this.#senha = senha;
  }

  autenticar(senhaInformada) {
    if (!this.#senha) return false;
    return this.#senha === senhaInformada;
  }

  obterPermissoes() {
    return ["ler_provas", "ler_materiais", "postar_forum", "ler_editais"];
  }

  toJSON() {
    return {
      nome: this.nome,
      cargo: this.constructor.name,
      permissoes: this.obterPermissoes(),
    };
  }
}

class Aluno extends Usuario {
  constructor(nome, turma = "2º Téc. Informática") {
    super(nome, null);
    this.turma = turma;
  }
}

class Representante extends Usuario {
  constructor(nome, senhaMestra) {
    super(nome, senhaMestra);
  }

  obterPermissoes() {
    return [
      ...super.obterPermissoes(),
      "criar_provas",
      "editar_provas",
      "deletar_provas",
      "publicar_materiais",
      "moderar_forum",
      "publicar_editais",
    ];
  }
}

module.exports = { Usuario, Aluno, Representante };