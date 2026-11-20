class Usuario {
  #senha; // Encapsulamento: atributo privado

  constructor(nome, senha = null) {
    this.nome = nome;
    this.#senha = senha;
  }

  autenticar(senhaInformada) {
    if (!this.#senha) return false;
    return this.#senha === senhaInformada;
  }

  // Polimorfismo: método base que será sobrescrito nas subclasses
  obterPermissoes() {
    return ["ler_provas", "ler_materiais", "postar_forum"];
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
    super(nome, null); // Construtor da classe mãe
    this.turma = turma;
  }
}

class Representante extends Usuario {
  constructor(nome, senhaMestra) {
    super(nome, senhaMestra); // Construtor da classe mãe
  }

  // Polimorfismo: sobrescreve as permissões adicionando controle administrativo
  obterPermissoes() {
    return [
      ...super.obterPermissoes(),
      "criar_provas",
      "editar_provas",
      "deletar_provas",
      "publicar_materiais",
      "moderar_forum",
    ];
  }
}

module.exports = { Usuario, Aluno, Representante };