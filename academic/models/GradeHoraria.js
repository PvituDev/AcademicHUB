class AulaGrade {
  constructor(disciplina, professor) {
    this.disciplina = disciplina;
    this.professor = professor;
  }
}

class SlotHorario {
  constructor(turno, horario, aulasPorDia) {
    this.turno = turno;
    this.horario = horario;
    this.dias = aulasPorDia;
  }
}

class GradeHoraria {
  #turma;
  #slots;

  constructor(turma) {
    this.#turma = turma;
    this.#slots = [
      new SlotHorario("Matutino", "08:00 - 09:00", {
        segunda: new AulaGrade("Eletrônica Básica", "André Wild"),
        terca: new AulaGrade("Filosofia II - Info", "Flávio Oliveira"),
        quarta: new AulaGrade("Sociologia II - Info", "Maria Otavia"),
        quinta: new AulaGrade("Língua Portuguesa e Lit. II", "Mariana Rodrigues"),
        sexta: new AulaGrade("Inglês II - Info", "Milton Cássio"),
      }),
      new SlotHorario("Matutino", "09:00 - 10:00", {
        segunda: new AulaGrade("Eletrônica Básica", "André Wild"),
        terca: new AulaGrade("Filosofia II - Info", "Flávio Oliveira"),
        quarta: new AulaGrade("Educação Física II - Info", "Thalita Cintra"),
        quinta: new AulaGrade("Desenvolvimento Web II", "Franciele INFO"),
        sexta: new AulaGrade("Inglês II - Info", "Milton Cássio"),
      }),
      new SlotHorario("Matutino", "10:20 - 11:20", {
        segunda: new AulaGrade("Geografia II - Info", "Laise Cabral"),
        terca: new AulaGrade("Química II - Info", "Gustavo"),
        quarta: new AulaGrade("Língua Portuguesa e Lit. II", "Mariana Rodrigues"),
        quinta: new AulaGrade("Desenvolvimento Web II", "Franciele INFO"),
        sexta: new AulaGrade("Biologia II - Info", "Karine Dias"),
      }),
      new SlotHorario("Matutino", "11:20 - 12:20", {
        segunda: null,
        terca: new AulaGrade("Química II - Info", "Gustavo"),
        quarta: new AulaGrade("Matemática II - Info", "Pedro Cortes"),
        quinta: new AulaGrade("Língua Portuguesa e Lit. II", "Mariana Rodrigues"),
        sexta: new AulaGrade("Biologia II - Info", "Karine Dias"),
      }),
      new SlotHorario("Vespertino", "13:50 - 14:50", {
        segunda: new AulaGrade("Paradigma Orientação Objeto", "Renato"),
        terca: null,
        quarta: new AulaGrade("História II - Info", "Daniel"),
        quinta: null,
        sexta: new AulaGrade("Física II - Info", "Elisângela"),
      }),
      new SlotHorario("Vespertino", "14:50 - 15:50", {
        segunda: new AulaGrade("Paradigma Orientação Objeto", "Renato"),
        terca: null,
        quarta: new AulaGrade("História II - Info", "Daniel"),
        quinta: null,
        sexta: new AulaGrade("Física II - Info", "Elisângela"),
      }),
      new SlotHorario("Vespertino", "16:00 - 17:00", {
        segunda: new AulaGrade("Artes - Info", "Daivdson"),
        terca: null,
        quarta: new AulaGrade("Tópicos I - Informática", "Franciele INFO"),
        quinta: null,
        sexta: new AulaGrade("Matemática II - Info", "Pedro Cortes"),
      }),
      new SlotHorario("Vespertino", "17:00 - 18:00", {
        segunda: null,
        terca: null,
        quarta: new AulaGrade("Tópicos I - Informática", "Franciele INFO"),
        quinta: null,
        sexta: new AulaGrade("Matemática II - Info", "Pedro Cortes"),
      }),
    ];
  }

  toJSON() {
    return {
      turma: this.#turma,
      slots: this.#slots,
    };
  }
}

module.exports = { GradeHoraria, SlotHorario, AulaGrade };