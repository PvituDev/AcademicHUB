(function () {
  window.IFinityHub = window.IFinityHub || {};

  const TURMAS_CONFIG = {
    info1: {
      id: "info1",
      nomeCurto: "1º Info",
      turma: "1º ano Téc. Informática • IF Goiano Campus Campos Belos",
      senha: "info2026",
      slots: [
        {
          turno: "Matutino",
          horario: "08:00",
          dias: {
            segunda: { disciplina: "GEOGRAFIA I - INFO", professor: "Laise Cabral" },
            terca: { disciplina: "QUÍMICA I - INFO", professor: "Gustavo" },
            quarta: { disciplina: "INGLÊS I - INFO", professor: "Milton Cássio" },
            quinta: { disciplina: "LÓGICA DE PROGRAMAÇÃO", professor: "Grazielly" },
            sexta: { disciplina: "MATEMÁTICA I - INFO", professor: "Amarildo Junior" },
          },
        },
        {
          turno: "Matutino",
          horario: "09:00",
          dias: {
            segunda: { disciplina: "GEOGRAFIA I - INFO", professor: "Laise Cabral" },
            terca: { disciplina: "QUÍMICA I - INFO", professor: "Gustavo" },
            quarta: { disciplina: "INGLÊS I - INFO", professor: "Milton Cássio" },
            quinta: { disciplina: "LÓGICA DE PROGRAMAÇÃO", professor: "Grazielly" },
            sexta: { disciplina: "MATEMÁTICA I - INFO", professor: "Amarildo Junior" },
          },
        },
        {
          turno: "Matutino",
          horario: "10:20",
          dias: {
            segunda: { disciplina: "LÍNGUA PORTUGUESA E LITERATURA I - INFO", professor: "Mariana Rodrigues" },
            terca: { disciplina: "FUNDAMENTOS E OPERAÇÃO DE COMPUTADORES", professor: "Genival" },
            quarta: { disciplina: "SOCIOLOGIA I - INFO", professor: "Maria Otavia" },
            quinta: { disciplina: "EDUCAÇÃO FÍSICA I - INFO", professor: "Thalita Cintra" },
            sexta: { disciplina: "FÍSICA I - INFO", professor: "Elisângela" },
          },
        },
        {
          turno: "Matutino",
          horario: "11:20",
          dias: {
            segunda: { disciplina: "LÍNGUA PORTUGUESA E LITERATURA I - INFO", professor: "Mariana Rodrigues" },
            terca: { disciplina: "FUNDAMENTOS E OPERAÇÃO DE COMPUTADORES", professor: "Genival" },
            quarta: { disciplina: "SOCIOLOGIA I - INFO", professor: "Maria Otavia" },
            quinta: { disciplina: "MATEMÁTICA I - INFO", professor: "Amarildo Junior" },
            sexta: { disciplina: "FÍSICA I - INFO", professor: "Elisângela" },
          },
        },
        {
          turno: "Vespertino",
          horario: "13:50",
          dias: {
            segunda: null,
            terca: { disciplina: "BANCO DE DADOS", professor: "Grazielly" },
            quarta: null,
            quinta: null,
            sexta: { disciplina: "DESENVOLVIMENTO WEB I", professor: "Franciele INFO" },
          },
        },
        {
          turno: "Vespertino",
          horario: "14:50",
          dias: {
            segunda: { disciplina: "LÍNGUA PORTUGUESA E LITERATURA I - INFO", professor: "Mariana Rodrigues" },
            terca: { disciplina: "BANCO DE DADOS", professor: "Grazielly" },
            quarta: null,
            quinta: null,
            sexta: { disciplina: "DESENVOLVIMENTO WEB I", professor: "Franciele INFO" },
          },
        },
        {
          turno: "Vespertino",
          horario: "16:00",
          dias: {
            segunda: { disciplina: "FILOSOFIA I - INFO", professor: "Flávio Oliveira" },
            terca: null,
            quarta: { disciplina: "HISTÓRIA I - INFO", professor: "Daniel" },
            quinta: null,
            sexta: { disciplina: "BIOLOGIA I - INFO", professor: "Prof. Substituto de Biologia" },
          },
        },
        {
          turno: "Vespertino",
          horario: "17:00",
          dias: {
            segunda: null,
            terca: null,
            quarta: null,
            quinta: null,
            sexta: { disciplina: "BIOLOGIA I - INFO", professor: "Prof. Substituto de Biologia" },
          },
        },
      ],
    },

    info2: {
      id: "info2",
      nomeCurto: "2º Info",
      turma: "2º ano Téc. Informática • IF Goiano Campus Campos Belos",
      senha: "info2025",
      slots: [
        {
          turno: "Matutino",
          horario: "08:00",
          dias: {
            segunda: { disciplina: "ELETRÔNICA BÁSICA", professor: "André Wild" },
            terca: { disciplina: "FILOSOFIA II - INFO", professor: "Flávio Oliveira" },
            quarta: { disciplina: "SOCIOLOGIA II - INFO", professor: "Maria Otavia" },
            quinta: { disciplina: "LÍNGUA PORTUGUESA E LITERATURA II - INFO", professor: "Mariana Rodrigues" },
            sexta: { disciplina: "INGLÊS II - INFO", professor: "Milton Cássio" },
          },
        },
        {
          turno: "Matutino",
          horario: "09:00",
          dias: {
            segunda: { disciplina: "ELETRÔNICA BÁSICA", professor: "André Wild" },
            terca: { disciplina: "FILOSOFIA II - INFO", professor: "Flávio Oliveira" },
            quarta: { disciplina: "EDUCAÇÃO FÍSICA II - INFO", professor: "Thalita Cintra" },
            quinta: { disciplina: "DESENVOLVIMENTO WEB II", professor: "Franciele INFO" },
            sexta: { disciplina: "INGLÊS II - INFO", professor: "Milton Cássio" },
          },
        },
        {
          turno: "Matutino",
          horario: "10:20",
          dias: {
            segunda: { disciplina: "GEOGRAFIA II - INFO", professor: "Laise Cabral" },
            terca: { disciplina: "QUÍMICA II - INFO", professor: "Gustavo" },
            quarta: { disciplina: "LÍNGUA PORTUGUESA E LITERATURA II - INFO", professor: "Mariana Rodrigues" },
            quinta: { disciplina: "DESENVOLVIMENTO WEB II", professor: "Franciele INFO" },
            sexta: { disciplina: "BIOLOGIA II - INFO", professor: "Karine Dias" },
          },
        },
        {
          turno: "Matutino",
          horario: "11:20",
          dias: {
            segunda: null,
            terca: { disciplina: "QUÍMICA II - INFO", professor: "Gustavo" },
            quarta: { disciplina: "MATEMÁTICA II - INFO", professor: "Pedro Cortes" },
            quinta: { disciplina: "LÍNGUA PORTUGUESA E LITERATURA II - INFO", professor: "Mariana Rodrigues" },
            sexta: { disciplina: "BIOLOGIA II - INFO", professor: "Karine Dias" },
          },
        },
        {
          turno: "Vespertino",
          horario: "13:50",
          dias: {
            segunda: { disciplina: "PARADIGMA ORIENTAÇÃO OBJETO", professor: "Renato" },
            terca: null,
            quarta: { disciplina: "HISTÓRIA II - INFO", professor: "Daniel" },
            quinta: null,
            sexta: { disciplina: "FÍSICA II - INFO", professor: "Elisângela" },
          },
        },
        {
          turno: "Vespertino",
          horario: "14:50",
          dias: {
            segunda: { disciplina: "PARADIGMA ORIENTAÇÃO OBJETO", professor: "Renato" },
            terca: null,
            quarta: { disciplina: "HISTÓRIA II - INFO", professor: "Daniel" },
            quinta: null,
            sexta: { disciplina: "FÍSICA II - INFO", professor: "Elisângela" },
          },
        },
        {
          turno: "Vespertino",
          horario: "16:00",
          dias: {
            segunda: { disciplina: "ARTES - INFO", professor: "Daivdson" },
            terca: null,
            quarta: { disciplina: "TÓPICOS I - INFORMÁTICA", professor: "Franciele INFO" },
            quinta: null,
            sexta: { disciplina: "MATEMÁTICA II - INFO", professor: "Pedro Cortes" },
          },
        },
        {
          turno: "Vespertino",
          horario: "17:00",
          dias: {
            segunda: null,
            terca: null,
            quarta: { disciplina: "TÓPICOS I - INFORMÁTICA", professor: "Franciele INFO" },
            quinta: null,
            sexta: { disciplina: "MATEMÁTICA II - INFO", professor: "Pedro Cortes" },
          },
        },
      ],
    },

    info3: {
      id: "info3",
      nomeCurto: "3º Info",
      turma: "3º ano Téc. Informática • IF Goiano Campus Campos Belos",
      senha: "info2024",
      slots: [
        {
          turno: "Matutino",
          horario: "08:00",
          dias: {
            segunda: { disciplina: "TÓPICOS II - INFORMÁTICA", professor: "Franciele INFO" },
            terca: { disciplina: "LÍNGUA PORTUGUESA E LITERATURA III - INFO", professor: "Daivdson" },
            quarta: { disciplina: "EDUCAÇÃO FÍSICA III - INFO", professor: "Thalita Cintra" },
            quinta: null,
            sexta: { disciplina: "HISTÓRIA III - INFO", professor: "Daniel" },
          },
        },
        {
          turno: "Matutino",
          horario: "09:00",
          dias: {
            segunda: { disciplina: "TÓPICOS II - INFORMÁTICA", professor: "Franciele INFO" },
            terca: { disciplina: "LÍNGUA PORTUGUESA E LITERATURA III - INFO", professor: "Daivdson" },
            quarta: { disciplina: "MATEMÁTICA III - INFO", professor: "Pedro Cortes" },
            quinta: { disciplina: "QUÍMICA III - INFO", professor: "Gustavo" },
            sexta: { disciplina: "HISTÓRIA III - INFO", professor: "Daniel" },
          },
        },
        {
          turno: "Matutino",
          horario: "10:20",
          dias: {
            segunda: { disciplina: "INTERNET DAS COISAS", professor: "André Wild" },
            terca: { disciplina: "FÍSICA III - INFO", professor: "Marcelo Brandao" },
            quarta: { disciplina: "GEOGRAFIA III - INFO", professor: "Laise Cabral" },
            quinta: { disciplina: "QUÍMICA III - INFO", professor: "Gustavo" },
            sexta: { disciplina: "DESENVOLVIMENTO WEB III", professor: "Franciele INFO" },
          },
        },
        {
          turno: "Matutino",
          horario: "11:20",
          dias: {
            segunda: { disciplina: "INTERNET DAS COISAS", professor: "André Wild" },
            terca: { disciplina: "FÍSICA III - INFO", professor: "Marcelo Brandao" },
            quarta: { disciplina: "GEOGRAFIA III - INFO", professor: "Laise Cabral" },
            quinta: null,
            sexta: { disciplina: "DESENVOLVIMENTO WEB III", professor: "Franciele INFO" },
          },
        },
        {
          turno: "Vespertino",
          horario: "13:50",
          dias: {
            segunda: { disciplina: "LÍNGUA PORTUGUESA E LITERATURA III - INFO", professor: "Daivdson" },
            terca: null,
            quarta: { disciplina: "BIOLOGIA III - INFO", professor: "Ariane Lacerda" },
            quinta: null,
            sexta: { disciplina: "MATEMÁTICA III - INFO", professor: "Pedro Cortes" },
          },
        },
        {
          turno: "Vespertino",
          horario: "14:50",
          dias: {
            segunda: { disciplina: "FILOSOFIA III - INFO", professor: "Flávio Oliveira" },
            terca: null,
            quarta: { disciplina: "BIOLOGIA III - INFO", professor: "Ariane Lacerda" },
            quinta: null,
            sexta: { disciplina: "MATEMÁTICA III - INFO", professor: "Pedro Cortes" },
          },
        },
        {
          turno: "Vespertino",
          horario: "16:00",
          dias: {
            segunda: { disciplina: "SOCIOLOGIA III - INFO", professor: "Maria Otavia" },
            terca: null,
            quarta: { disciplina: "DESENVOLVIMENTO MOBILE", professor: "Renato" },
            quinta: null,
            sexta: { disciplina: "INGLÊS III - INFO", professor: "Milton Cássio" },
          },
        },
        {
          turno: "Vespertino",
          horario: "17:00",
          dias: {
            segunda: null,
            terca: null,
            quarta: { disciplina: "DESENVOLVIMENTO MOBILE", professor: "Renato" },
            quinta: null,
            sexta: { disciplina: "INGLÊS III - INFO", professor: "Milton Cássio" },
          },
        },
      ],
    },
  };

  window.IFinityHub.TURMAS_CONFIG = TURMAS_CONFIG;
  window.IFinityHub.GRADE_PADRAO = TURMAS_CONFIG.info2;
})();