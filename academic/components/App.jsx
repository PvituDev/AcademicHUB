(function () {
  const { useState, useEffect, useRef, useMemo } = React;
  window.IFinityHub = window.IFinityHub || {};

  function App() {
    const {
      AnimatedList,
      LandingPage,
      GRADE_PADRAO,
      api,
      utils: { contemOfensa, formatarContagemRegressiva },
      notificacoes: notifService,
    } = window.IFinityHub;

    const [mostrarLanding, setMostrarLanding] = useState(true);
    const [eventos, setEventos] = useState([]);
    const [materiais, setMateriais] = useState([]);
    const [gradeHoraria, setGradeHoraria] = useState(GRADE_PADRAO);
    const [aba, setAba] = useState("dashboard");

    // Estados de Notificações
    const [historicoNotif, setHistoricoNotif] = useState(() =>
      notifService.carregarHistorico()
    );
    const [toasts, setToasts] = useState([]);
    const [painelNotifAberto, setPainelNotifAberto] = useState(false);
    const [permissaoNativa, setPermissaoNativa] = useState(() =>
      "Notification" in window ? Notification.permission : "unsupported"
    );

    const [senhaEditor, setSenhaEditor] = useState("");
    const [usuarioAtual, setUsuarioAtual] = useState({
      nome: "Estudante",
      cargo: "Aluno",
      permissoes: ["ler_provas", "ler_materiais", "postar_forum", "ler_editais"],
    });

    const temPermissao = (perm) => usuarioAtual.permissoes.includes(perm);
    const isEditor = temPermissao("criar_provas");

    const [titulo, setTitulo] = useState("");
    const [descricao, setDescricao] = useState("");
    const [tipo, setTipo] = useState("prova");
    const [dataHora, setDataHora] = useState("");
    const [editandoId, setEditandoId] = useState(null);

    const [nomeMaterial, setNomeMaterial] = useState("");
    const [arquivoPDF, setArquivoPDF] = useState(null);
    const [disciplina, setDisciplina] = useState("");
    const [enviando, setEnviando] = useState(false);

    const [editais, setEditais] = useState([]);
    const [editalTitulo, setEditalTitulo] = useState("");
    const [editalDescricao, setEditalDescricao] = useState("");
    const [editalLink, setEditalLink] = useState("");
    const [editalPrazo, setEditalPrazo] = useState("");
    const [editalFoto, setEditalFoto] = useState(null);
    const [editalEnviando, setEditalEnviando] = useState(false);

    const [forumPosts, setForumPosts] = useState([]);
    const [forumNome, setForumNome] = useState("");
    const [forumTexto, setForumTexto] = useState("");
    const [forumErro, setForumErro] = useState("");
    const [forumEnviando, setForumEnviando] = useState(false);

    const calendarRef = useRef(null);
    const calendarInstanceRef = useRef(null);

    const sincronizarTudo = async () => {
      try {
        const [resProvas, resMat, resEd, resForum] = await Promise.all([
          api.listarProvas(),
          api.listarMateriais(),
          api.listarEditais(),
          api.listarForum(),
        ]);

        let listaEventosFormatados = [];
        if (resProvas.ok) {
          const data = await resProvas.json();
          const hoje = new Date().toISOString().slice(0, 10);
          const validos = [];
          const expirados = [];

          data.forEach((item) => {
            const dataItem = (item.start || "").slice(0, 10);
            const vencida =
              typeof item.vencida === "boolean"
                ? item.vencida
                : dataItem && dataItem < hoje;

            if (vencida) {
              expirados.push(item);
            } else {
              validos.push(item);
            }
          });

          if (expirados.length > 0 && senhaEditor) {
            await Promise.all(
              expirados.map((item) =>
                api
                  .deletarProva(item.id, senhaEditor)
                  .catch((err) =>
                    console.error("Erro ao excluir atividade vencida:", err)
                  )
              )
            );
          }

          listaEventosFormatados = validos.map((item) => ({
            id: String(item.id),
            title:
              item.tituloFormatado ||
              `[${item.tipo ? item.tipo.toUpperCase() : "EVENTO"}] ${item.title}`,
            start: item.start,
            color:
              item.cor ||
              (item.tipo === "prova"
                ? "#dc2626"
                : item.tipo === "dever"
                  ? "#d97706"
                  : item.tipo === "evento"
                    ? "#8b5cf6"
                    : "#2563eb"),
            tipo: item.tipo,
            nomeOriginal: item.title,
            descricao: item.descricao || "Sem descrição cadastrada.",
          }));
          setEventos(listaEventosFormatados);
        }

        const listaMateriais = resMat.ok ? await resMat.json() : [];
        if (resMat.ok) setMateriais(listaMateriais);

        const listaEditais = resEd.ok ? await resEd.json() : [];
        if (resEd.ok) setEditais(listaEditais);

        if (resForum.ok) setForumPosts(await resForum.json());

        // Verifica novidades e dispara notificações
        const novidades = notifService.detectarNovidades({
          eventos: listaEventosFormatados,
          editais: listaEditais,
          materiais: listaMateriais,
        });

        if (novidades.length > 0) {
          setHistoricoNotif((prev) => {
            const atualizado = [...novidades, ...prev];
            notifService.salvarHistorico(atualizado);
            return atualizado;
          });

          setToasts((prev) => [...novidades, ...prev].slice(0, 4));

          novidades.forEach((n) => {
            notifService.dispararNativa(n.titulo, n.descricao, () => {
              setMostrarLanding(false);
              setAba(n.aba);
            });
          });
        }
      } catch (err) {
        console.error("Erro na sincronização:", err);
      }
    };

    const carregarGrade = async () => {
      try {
        const resposta = await api.obterGrade();
        if (resposta.ok) {
          const data = await resposta.json();
          if (data && data.slots) setGradeHoraria(data);
        }
      } catch (err) {}
    };

    useEffect(() => {
      sincronizarTudo();
      carregarGrade();

      const intervalo = setInterval(sincronizarTudo, 60 * 1000);
      return () => clearInterval(intervalo);
    }, []);

    useEffect(() => {
      if (!mostrarLanding && aba === "calendario" && calendarRef.current) {
        if (calendarInstanceRef.current) {
          calendarInstanceRef.current.destroy();
        }
        const calendar = new FullCalendar.Calendar(calendarRef.current, {
          initialView: "dayGridMonth",
          locale: "pt-br",
          headerToolbar: {
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek",
          },
          events: eventos,
          height: "75vh",
        });
        calendar.render();
        calendarInstanceRef.current = calendar;
      }
    }, [mostrarLanding, aba, eventos]);

    // Controles de Notificação
    const naoLidas = historicoNotif.filter((n) => !n.lida).length;

    const ativarNotificacoesNavegador = async () => {
      const status = await notifService.pedirPermissaoNativa();
      setPermissaoNativa(status);
    };

    const abrirNotificacao = (notif) => {
      setHistoricoNotif((prev) => {
        const atualizado = prev.map((item) =>
          item.uid === notif.uid ? { ...item, lida: true } : item
        );
        notifService.salvarHistorico(atualizado);
        return atualizado;
      });
      setToasts((prev) => prev.filter((t) => t.uid !== notif.uid));
      setPainelNotifAberto(false);
      setMostrarLanding(false);
      setAba(notif.aba);
    };

    const marcarTodasComoLidas = () => {
      setHistoricoNotif((prev) => {
        const atualizado = prev.map((item) => ({ ...item, lida: true }));
        notifService.salvarHistorico(atualizado);
        return atualizado;
      });
    };

    const autenticarRepresentante = async (abrirPainelAposLogin = false) => {
      if (isEditor) {
        setSenhaEditor("");
        setUsuarioAtual({
          nome: "Estudante",
          cargo: "Aluno",
          permissoes: ["ler_provas", "ler_materiais", "postar_forum", "ler_editais"],
        });
        alert("Modo Editor desativado.");
        return;
      }
      const senhaDigitada = prompt("Digite a senha de Representante:");
      if (!senhaDigitada) return;

      try {
        const resposta = await api.login(senhaDigitada);
        const resultado = await resposta.json();

        if (resposta.ok && resultado.success) {
          setSenhaEditor(senhaDigitada);
          setUsuarioAtual(
            resultado.usuario || {
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
            }
          );
          if (abrirPainelAposLogin) {
            setAba("dashboard");
            setMostrarLanding(false);
          }
          alert("Acesso concedido!");
        } else {
          alert("Senha incorreta!");
        }
      } catch (error) {
        alert("Erro ao validar senha no servidor.");
      }
    };

    const iniciarEdicao = (evt) => {
      setEditandoId(evt.id);
      setTitulo(evt.nomeOriginal);
      setDescricao(
        evt.descricao === "Sem descrição cadastrada." ? "" : evt.descricao
      );
      setTipo(evt.tipo);
      setDataHora((evt.start || "").slice(0, 10));
      setAba("dashboard");
    };

    const cancelarEdicao = () => {
      setEditandoId(null);
      setTitulo("");
      setDescricao("");
      setTipo("prova");
      setDataHora("");
    };

    const salvarEvento = async (e) => {
      e.preventDefault();
      if (!titulo || !dataHora) return;

      try {
        const resposta = await api.salvarProva(
          { title: titulo, tipo, start: dataHora, descricao },
          editandoId,
          senhaEditor
        );

        if (resposta.ok) {
          alert(
            editandoId
              ? "Atividade atualizada com sucesso!"
              : "Evento publicado com sucesso!"
          );
          cancelarEdicao();
          sincronizarTudo();
        } else {
          const erro = await resposta.json();
          alert("Erro: " + (erro.error || "Erro desconhecido"));
        }
      } catch (error) {
        alert("Erro ao conectar ao servidor.");
      }
    };

    const deletarEvento = async (id) => {
      if (!confirm("Tem certeza que deseja apagar?")) return;
      try {
        const resposta = await api.deletarProva(id, senhaEditor);
        if (resposta.ok) {
          if (editandoId === id) cancelarEdicao();
          sincronizarTudo();
        } else {
          const erro = await resposta.json();
          alert("Erro ao deletar: " + (erro.error || "Erro"));
        }
      } catch (error) {
        console.error("Erro ao deletar:", error);
      }
    };

    const publicarMaterial = async (e) => {
      e.preventDefault();
      if (!nomeMaterial || !arquivoPDF) return;

      try {
        setEnviando(true);
        const formData = new FormData();
        formData.append("nome", nomeMaterial);
        formData.append("disciplina", disciplina || "Geral");
        formData.append("arquivo", arquivoPDF);

        const resposta = await api.publicarMaterial(formData, senhaEditor);
        if (resposta.ok) {
          alert("Material enviado com sucesso!");
          setNomeMaterial("");
          setDisciplina("");
          setArquivoPDF(null);
          sincronizarTudo();
        } else {
          const erro = await resposta.json();
          alert("Erro ao salvar o material: " + (erro.error || "Erro"));
        }
      } catch (error) {
        alert("Erro: " + error.message);
      } finally {
        setEnviando(false);
      }
    };

    const deletarMaterial = async (id) => {
      if (!confirm("Tem certeza que deseja excluir?")) return;
      try {
        const resposta = await api.deletarMaterial(id, senhaEditor);
        if (resposta.ok) sincronizarTudo();
        else {
          const erro = await resposta.json();
          alert("Erro ao deletar material: " + (erro.error || "Erro"));
        }
      } catch (error) {
        console.error("Erro ao deletar:", error);
      }
    };

    const publicarEdital = async (e) => {
      e.preventDefault();
      if (!editalTitulo || !editalDescricao || !editalLink) return;

      try {
        setEditalEnviando(true);
        const formData = new FormData();
        formData.append("titulo", editalTitulo);
        formData.append("descricao", editalDescricao);
        formData.append("link_formulario", editalLink);
        formData.append("prazo", editalPrazo);
        if (editalFoto) formData.append("foto", editalFoto);

        const resposta = await api.publicarEdital(formData, senhaEditor);
        if (resposta.ok) {
          alert("Edital publicado com sucesso!");
          setEditalTitulo("");
          setEditalDescricao("");
          setEditalLink("");
          setEditalPrazo("");
          setEditalFoto(null);
          sincronizarTudo();
        } else {
          const erro = await resposta.json();
          alert("Erro ao publicar edital: " + (erro.error || "Erro"));
        }
      } catch (error) {
        alert("Erro: " + error.message);
      } finally {
        setEditalEnviando(false);
      }
    };

    const deletarEdital = async (id) => {
      if (!confirm("Tem certeza que deseja apagar este edital?")) return;
      try {
        const resposta = await api.deletarEdital(id, senhaEditor);
        if (resposta.ok) sincronizarTudo();
        else {
          const erro = await resposta.json();
          alert("Erro ao deletar edital: " + (erro.error || "Erro"));
        }
      } catch (error) {
        console.error("Erro ao deletar edital:", error);
      }
    };

    const publicarForum = async (e) => {
      e.preventDefault();
      setForumErro("");

      if (!forumNome.trim() || !forumTexto.trim()) {
        setForumErro("Preencha seu nome e a sugestão antes de enviar.");
        return;
      }

      if (contemOfensa(forumNome) || contemOfensa(forumTexto)) {
        setForumErro(
          "Sua mensagem contém linguagem ofensiva e não pôde ser publicada. Por favor, reescreva de forma construtiva — o objetivo do fórum é sugerir melhorias, não atacar pessoas."
        );
        return;
      }

      try {
        setForumEnviando(true);
        const resposta = await api.publicarForum(
          forumNome.trim(),
          forumTexto.trim()
        );
        if (resposta.ok) {
          setForumNome("");
          setForumTexto("");
          sincronizarTudo();
        } else {
          const erro = await resposta.json();
          setForumErro(erro.error || "Erro ao publicar. Tente novamente.");
        }
      } catch (error) {
        setForumErro("Erro ao conectar ao servidor.");
      } finally {
        setForumEnviando(false);
      }
    };

    const deletarForumPost = async (id) => {
      if (!confirm("Tem certeza que deseja apagar esta sugestão?")) return;
      try {
        const resposta = await api.deletarForum(id, senhaEditor);
        if (resposta.ok) sincronizarTudo();
        else {
          const erro = await resposta.json();
          alert("Erro ao deletar: " + (erro.error || "Erro"));
        }
      } catch (error) {
        console.error("Erro ao deletar:", error);
      }
    };

    const menuAbas = useMemo(
      () => [
        {
          id: "dashboard",
          title: "Painel Principal",
          description: "Provas e tarefas",
          meta: eventos.length > 0 ? `${eventos.length}` : undefined,
          icon: (
            <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          ),
        },
        {
          id: "grade",
          title: "Grade Horária",
          description: "Aulas e docentes",
          meta: "Seg-Sex",
          icon: (
            <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
          ),
        },
        {
          id: "editais",
          title: "Editais de Projetos",
          description: "Pesquisa e extensão",
          meta: editais.length > 0 ? `${editais.length}` : undefined,
          icon: (
            <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
            </svg>
          ),
        },
        {
          id: "materiais",
          title: "Materiais & PDFs",
          description: "Apostilas e listas",
          meta: materiais.length > 0 ? `${materiais.length}` : undefined,
          icon: (
            <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          ),
        },
        {
          id: "calendario",
          title: "Calendário",
          description: "Visão mensal",
          icon: (
            <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          ),
        },
        {
          id: "forum",
          title: "Fórum",
          description: "Sugestões da turma",
          meta: forumPosts.length > 0 ? `${forumPosts.length}` : undefined,
          icon: (
            <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
            </svg>
          ),
        },
      ],
      [eventos.length, editais.length, materiais.length, forumPosts.length]
    );

    const indiceAbaAtiva = useMemo(
      () => menuAbas.findIndex((m) => m.id === aba),
      [menuAbas, aba]
    );

    const itensMural = useMemo(
      () =>
        eventos.map((evt) => {
          const isProva = evt.tipo === "prova";
          const isDever = evt.tipo === "dever";

          return {
            ...evt,
            title: evt.nomeOriginal,
            description: evt.descricao,
            meta: formatarContagemRegressiva(evt.start),
            iconStyle: {
              backgroundColor: isProva
                ? "rgba(239, 68, 68, 0.14)"
                : isDever
                  ? "rgba(245, 158, 11, 0.14)"
                  : "rgba(139, 92, 246, 0.14)",
              color: isProva ? "#f87171" : isDever ? "#fbbf24" : "#a78bfa",
            },
            icon: isProva ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            ) : isDever ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
            ),
          };
        }),
      [eventos]
    );

    const slotsMatutino = gradeHoraria.slots.filter(
      (s) => s.turno === "Matutino"
    );
    const slotsVespertino = gradeHoraria.slots.filter(
      (s) => s.turno === "Vespertino"
    );

    const renderCelulaAula = (aula) => {
      if (!aula) return <td className="p-3 text-slate-500">-</td>;
      return (
        <td className="p-3">
          <div className="font-semibold text-white">{aula.disciplina}</div>
          <div className="text-xs text-slate-400">{aula.professor}</div>
        </td>
      );
    };

    const overlaysNotificacao = (
      <>
        {/* Central de Notificações (Modal) */}
        {painelNotifAberto && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setPainelNotifAberto(false)}
          >
            <div
              className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="font-bold text-white text-base">
                    Central de Avisos
                  </h3>
                  <p className="text-xs text-slate-400">
                    Provas, editais, eventos e materiais recentes
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {naoLidas > 0 && (
                    <button
                      onClick={marcarTodasComoLidas}
                      className="text-xs text-emerald-400 hover:underline"
                    >
                      Marcar lidas
                    </button>
                  )}
                  <button
                    onClick={() => setPainelNotifAberto(false)}
                    className="text-slate-400 hover:text-white px-2 py-1 text-sm"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {permissaoNativa === "default" && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 flex items-center justify-between gap-3">
                  <span className="text-xs text-emerald-200">
                    Ative alertas no navegador para ser avisado mesmo em outras
                    abas.
                  </span>
                  <button
                    onClick={ativarNotificacoesNavegador}
                    className="shrink-0 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg"
                  >
                    Ativar
                  </button>
                </div>
              )}

              {historicoNotif.length > 0 ? (
                <AnimatedList
                  items={historicoNotif.map((n) => ({
                    ...n,
                    title: n.titulo,
                    description: n.descricao,
                    meta: n.lida ? "Lida" : "Novo",
                  }))}
                  onItemSelect={(item) => abrirNotificacao(item)}
                  animation="pop"
                  theme="dark"
                  accentColor="#10b981"
                  width="100%"
                  maxHeight={340}
                  radius={12}
                  gap={8}
                  frame={false}
                />
              ) : (
                <p className="text-center text-slate-500 text-sm py-8">
                  Nenhuma notificação registrada ainda.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Toasts Flutuantes */}
        {toasts.length > 0 && (
          <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
            {toasts.map((t) => (
              <div
                key={t.uid}
                onClick={() => abrirNotificacao(t)}
                className="pointer-events-auto cursor-pointer bg-slate-900/95 border border-emerald-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur-md flex items-start justify-between gap-3 hover:border-emerald-400 transition"
              >
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                    Nova Publicação
                  </span>
                  <div className="text-sm font-semibold text-white truncate mt-0.5">
                    {t.titulo}
                  </div>
                  <div className="text-xs text-slate-400 truncate mt-0.5">
                    {t.descricao}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setToasts((prev) =>
                      prev.filter((item) => item.uid !== t.uid)
                    );
                  }}
                  className="text-slate-500 hover:text-white text-xs p-1"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </>
    );

    if (mostrarLanding) {
      return (
        <>
          <LandingPage
            onEntrar={(abaDestino = "dashboard") => {
              setAba(abaDestino);
              setMostrarLanding(false);
            }}
            onEntrarRepresentante={() => autenticarRepresentante(true)}
            onAbrirNotificacoes={() => setPainelNotifAberto(true)}
            naoLidas={naoLidas}
            totalEventos={eventos.length}
            totalEditais={editais.length}
            totalMateriais={materiais.length}
          />
          {overlaysNotificacao}
        </>
      );
    }

    return (
      <div className="flex flex-col md:flex-row h-screen bg-slate-950 text-slate-100 font-sans">
        <aside className="w-full md:w-72 bg-slate-900/90 border-b md:border-b-0 md:border-r border-slate-800/80 p-5 flex flex-col justify-between shrink-0">
          <div>
            <div className="flex flex-col items-center text-center mb-4">
              <button
                onClick={() => setMostrarLanding(true)}
                title="Voltar para a página inicial"
                className="focus:outline-none hover:opacity-90 transition"
              >
                <img
                  src="./assets/lg%20IFinityHub.png"
                  alt="IFinityHub"
                  className="w-36 h-auto object-contain mb-1.5 select-none"
                />
              </button>
              <span className="text-xs text-slate-400">
                2º Téc. Informática • IF Goiano
              </span>
            </div>

            {/* Botão do Sininho de Notificações */}
            <div className="mb-4">
              <button
                onClick={() => setPainelNotifAberto((v) => !v)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-emerald-500/40 transition text-xs"
              >
                <span className="flex items-center gap-2 font-semibold text-slate-200">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                  </svg>
                  Notificações
                </span>
                {naoLidas > 0 ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-bold text-[11px]">
                    {naoLidas}
                  </span>
                ) : (
                  <span className="text-slate-500 text-[11px]">Em dia</span>
                )}
              </button>
            </div>

            <AnimatedList
              items={menuAbas}
              selectedIndex={indiceAbaAtiva}
              onItemSelect={(item) => setAba(item.id)}
              animation="pop"
              theme="dark"
              accentColor="#10b981"
              width="100%"
              maxHeight={460}
              radius={12}
              gap={7}
              stagger={0.04}
              fadeSize={28}
              frame={true}
              showGradients={false}
              displayScrollbar={false}
              selectOnHover={true}
              enableArrowNavigation={true}
              loop={true}
              animateOnce={true}
            />
          </div>

          <div className="mt-5 md:mt-0 space-y-2 pt-4 border-t border-slate-800/70">
            <div className="text-center text-xs text-slate-500">
              Perfil:{" "}
              <span className="text-slate-300 font-medium">
                {usuarioAtual.cargo}
              </span>
            </div>
            <button
              onClick={() => autenticarRepresentante(false)}
              className={`w-full text-xs font-semibold py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 hover:-translate-y-0.5 ${isEditor ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700"}`}
            >
              {isEditor ? "🔓 Modo Editor" : "🔒 Acesso Representante"}
            </button>
            <button
              onClick={() => setMostrarLanding(true)}
              className="w-full text-xs text-slate-400 hover:text-white py-2 px-3 rounded-xl hover:bg-slate-800/70 transition"
            >
              ← Página Inicial
            </button>
          </div>
        </aside>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {aba === "dashboard" && (
            <div className="max-w-5xl mx-auto space-y-6">
              <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-800/70 pb-4">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
                    Visão Geral da Turma
                  </span>
                  <h2 className="text-2xl font-bold text-white mt-0.5">
                    Mural de Atividades
                  </h2>
                </div>
                <p className="text-slate-500 text-xs">
                  Atividades expiradas são removidas automaticamente após o prazo.
                </p>
              </header>

              {temPermissao("criar_provas") && (
                <form
                  onSubmit={salvarEvento}
                  className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-emerald-400">
                      {editandoId
                        ? "Editando Atividade"
                        : "Adicionar Nova Atividade"}
                    </h3>
                    {editandoId && (
                      <button
                        type="button"
                        onClick={cancelarEdicao}
                        className="text-xs text-slate-400 hover:text-white underline"
                      >
                        Cancelar edição
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Título (Ex: Prova de Matemática)"
                      value={titulo}
                      onChange={(e) => setTitulo(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-white"
                      required
                    />
                    <select
                      value={tipo}
                      onChange={(e) => setTipo(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-white"
                    >
                      <option value="prova">Prova</option>
                      <option value="dever">Dever de Casa</option>
                      <option value="evento">Evento / Reunião</option>
                    </select>
                    <input
                      type="date"
                      value={dataHora}
                      onChange={(e) => setDataHora(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-white"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Detalhes (Opcional)"
                      value={descricao}
                      onChange={(e) => setDescricao(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-white"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-6 rounded-lg transition"
                  >
                    {editandoId ? "Salvar Alterações" : "Publicar"}
                  </button>
                </form>
              )}

              {itensMural.length > 0 ? (
                <AnimatedList
                  items={itensMural}
                  animation="pop"
                  theme="dark"
                  accentColor="#10b981"
                  width="100%"
                  maxHeight={560}
                  radius={14}
                  gap={10}
                  stagger={0.05}
                  fadeSize={40}
                  frame={true}
                  showGradients={true}
                  displayScrollbar={true}
                  selectOnHover={true}
                  enableArrowNavigation={true}
                  loop={false}
                  animateOnce={false}
                  initialSelectedIndex={-1}
                  renderItem={(evt) => (
                    <div className="flex items-center justify-between w-full gap-3 min-w-0">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span
                          className="animated-list__lead"
                          style={evt.iconStyle}
                        >
                          {evt.icon}
                        </span>
                        <div className="animated-list__text">
                          <div className="flex items-center gap-2">
                            <span
                              style={{ color: evt.color }}
                              className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-950/70 border border-slate-800 shrink-0"
                            >
                              {evt.tipo}
                            </span>
                            <span className="animated-list__title">
                              {evt.title}
                            </span>
                          </div>
                          <span className="animated-list__description">
                            {evt.description}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className="animated-list__meta font-medium">
                          {evt.meta}
                        </span>
                        {temPermissao("editar_provas") && (
                          <div
                            className="flex gap-1.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => iniciarEdicao(evt)}
                              className="bg-blue-500/10 text-blue-400 text-xs px-2.5 py-1 rounded-lg hover:bg-blue-500/20 transition"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => deletarEvento(evt.id)}
                              className="bg-red-500/10 text-red-400 text-xs px-2.5 py-1 rounded-lg hover:bg-red-500/20 transition"
                            >
                              Apagar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                />
              ) : (
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 text-sm">
                  Nenhuma atividade agendada no momento.
                </div>
              )}
            </div>
          )}

          {aba === "editais" && (
            <div className="max-w-5xl mx-auto space-y-8">
              <header>
                <h2 className="text-2xl font-bold text-white mb-1">
                  Editais Abertos de Projetos — IF Goiano
                </h2>
                <p className="text-slate-400 text-sm">
                  Oportunidades de iniciação científica, extensão, monitoria e
                  projetos estudantis com inscrição aberta.
                </p>
              </header>

              {temPermissao("publicar_editais") && (
                <form
                  onSubmit={publicarEdital}
                  className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4"
                >
                  <h3 className="font-semibold text-emerald-400">
                    Publicar Novo Edital
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Título do Projeto / Edital (Ex: PIBIC-EM 2026)"
                      value={editalTitulo}
                      onChange={(e) => setEditalTitulo(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-white"
                      required
                    />
                    <input
                      type="url"
                      placeholder="Link do Formulário (https://forms.gle/...)"
                      value={editalLink}
                      onChange={(e) => setEditalLink(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-white"
                      required
                    />
                    <input
                      type="date"
                      value={editalPrazo}
                      onChange={(e) => setEditalPrazo(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-white"
                      title="Prazo final de inscrição (Opcional)"
                    />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setEditalFoto(e.target.files[0])}
                      className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                      title="Foto ou banner do edital (Opcional)"
                    />
                    <textarea
                      placeholder="Informações adicionais do edital (requisitos, bolsa, orientador, resumo...)"
                      value={editalDescricao}
                      onChange={(e) => setEditalDescricao(e.target.value)}
                      rows={4}
                      className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-white resize-none col-span-1 md:col-span-2"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={editalEnviando}
                    className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-2 px-6 rounded-lg transition"
                  >
                    {editalEnviando ? "Publicando..." : "Publicar Edital"}
                  </button>
                </form>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {editais.map((edital) => (
                  <article
                    key={edital.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between shadow-lg"
                  >
                    <div>
                      {edital.imagem_url && (
                        <img
                          src={edital.imagem_url}
                          alt={edital.titulo}
                          className="w-full h-48 object-cover border-b border-slate-800"
                        />
                      )}
                      <div className="p-5 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-lg font-bold text-white leading-snug">
                            {edital.titulo}
                          </h3>
                          {edital.prazo && (
                            <span className="shrink-0 text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-full">
                              Até {edital.prazo}
                            </span>
                          )}
                        </div>
                        <p className="text-slate-300 text-sm whitespace-pre-line">
                          {edital.descricao}
                        </p>
                      </div>
                    </div>

                    <div className="p-5 pt-0 flex items-center justify-between gap-3">
                      <a
                        href={edital.link_formulario}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 text-center bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 px-4 rounded-xl transition text-sm"
                      >
                        Acessar Formulário ↗
                      </a>
                      {temPermissao("publicar_editais") && (
                        <button
                          onClick={() => deletarEdital(edital.id)}
                          className="bg-red-500/10 text-red-400 px-3 py-2.5 rounded-xl hover:bg-red-500/20 transition text-sm"
                        >
                          Apagar
                        </button>
                      )}
                    </div>
                  </article>
                ))}

                {editais.length === 0 && (
                  <p className="text-slate-500 col-span-full">
                    Nenhum edital aberto publicado no momento.
                  </p>
                )}
              </div>
            </div>
          )}

          {aba === "calendario" && (
            <div className="max-w-5xl mx-auto space-y-4">
              <h2 className="text-2xl font-bold text-white mb-4">Calendário</h2>
              <div
                ref={calendarRef}
                className="bg-slate-900 p-4 rounded-xl border border-slate-800"
              ></div>
            </div>
          )}

          {aba === "materiais" && (
            <div className="max-w-5xl mx-auto space-y-8">
              <h2 className="text-2xl font-bold text-white mb-4">
                Materiais & PDFs
              </h2>

              {temPermissao("publicar_materiais") && (
                <form
                  onSubmit={publicarMaterial}
                  className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Nome do Material"
                      value={nomeMaterial}
                      onChange={(e) => setNomeMaterial(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-white"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Disciplina"
                      value={disciplina}
                      onChange={(e) => setDisciplina(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-white"
                      required
                    />
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => setArquivoPDF(e.target.files[0])}
                      className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-white col-span-1 md:col-span-2"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={enviando}
                    className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-2 px-6 rounded-lg transition"
                  >
                    {enviando ? "Enviando..." : "Fazer Upload"}
                  </button>
                </form>
              )}

              <div className="grid grid-cols-1 gap-4 mt-6">
                {materiais.map((mat) => (
                  <div
                    key={mat.id}
                    className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex justify-between items-center"
                  >
                    <div>
                      <span className="text-blue-400 font-bold text-sm mr-2">
                        {mat.disciplina}
                      </span>
                      <span className="text-white font-medium">{mat.nome}</span>
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={mat.url}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-slate-800 text-emerald-400 px-3 py-1 rounded hover:bg-slate-700 transition"
                      >
                        Baixar
                      </a>
                      {temPermissao("publicar_materiais") && (
                        <button
                          onClick={() => deletarMaterial(mat.id)}
                          className="bg-red-500/10 text-red-400 px-3 py-1 rounded hover:bg-red-500/20 transition"
                        >
                          Apagar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {materiais.length === 0 && (
                  <p className="text-slate-500">Nenhum material disponível.</p>
                )}
              </div>
            </div>
          )}

          {aba === "forum" && (
            <div className="max-w-5xl mx-auto space-y-8">
              <header>
                <h2 className="text-2xl font-bold text-white mb-1">
                  Fórum de Sugestões
                </h2>
                <p className="text-slate-400 text-sm">
                  Espaço para sugerir melhorias construtivas nos métodos de
                  ensino. Mensagens com linguagem ofensiva são bloqueadas
                  automaticamente antes de serem publicadas.
                </p>
              </header>

              <form
                onSubmit={publicarForum}
                className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4"
              >
                <div className="grid grid-cols-1 gap-4">
                  <input
                    type="text"
                    placeholder="Seu nome"
                    value={forumNome}
                    onChange={(e) => setForumNome(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-white"
                    required
                  />
                  <textarea
                    placeholder="O que você acha que poderia melhorar? (seja construtivo)"
                    value={forumTexto}
                    onChange={(e) => setForumTexto(e.target.value)}
                    rows={4}
                    className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-white resize-none"
                    required
                  />
                </div>

                {forumErro && (
                  <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                    {forumErro}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={forumEnviando}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-2 px-6 rounded-lg transition"
                >
                  {forumEnviando ? "Enviando..." : "Publicar Sugestão"}
                </button>
              </form>

              <div className="grid grid-cols-1 gap-4">
                {forumPosts.map((post) => (
                  <div
                    key={post.id}
                    className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex justify-between items-start"
                  >
                    <div>
                      <span className="text-emerald-400 font-bold text-sm">
                        {post.nome}
                      </span>
                      <p className="text-slate-200 text-sm mt-1">{post.texto}</p>
                      {post.criado_em && (
                        <p className="text-slate-500 text-xs mt-2">
                          {new Date(post.criado_em).toLocaleDateString("pt-BR")}
                        </p>
                      )}
                    </div>
                    {temPermissao("moderar_forum") && (
                      <button
                        onClick={() => deletarForumPost(post.id)}
                        className="bg-red-500/10 text-red-400 px-3 py-1 rounded hover:bg-red-500/20 transition shrink-0 ml-4"
                      >
                        Apagar
                      </button>
                    )}
                  </div>
                ))}
                {forumPosts.length === 0 && (
                  <p className="text-slate-500">
                    Nenhuma sugestão publicada ainda.
                  </p>
                )}
              </div>
            </div>
          )}

          {aba === "grade" && (
            <div className="max-w-6xl mx-auto space-y-6">
              <header>
                <h2 className="text-2xl font-bold text-white mb-1">
                  Grade Horária Semanal
                </h2>
                <p className="text-slate-400 text-sm">{gradeHoraria.turma}</p>
              </header>

              <div className="overflow-x-auto bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
                <table className="w-full text-left border-collapse text-xs md:text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="p-3 font-semibold w-24">Horário</th>
                      <th className="p-3 font-semibold">Segunda-feira</th>
                      <th className="p-3 font-semibold">Terça-feira</th>
                      <th className="p-3 font-semibold">Quarta-feira</th>
                      <th className="p-3 font-semibold">Quinta-feira</th>
                      <th className="p-3 font-semibold">Sexta-feira</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-200">
                    <tr className="bg-slate-950/40">
                      <td
                        colSpan="6"
                        className="p-2 text-xs font-bold text-emerald-400 tracking-wider uppercase"
                      >
                        Turno Matutino
                      </td>
                    </tr>
                    {slotsMatutino.map((slot, idx) => (
                      <tr key={`mat-${idx}`}>
                        <td className="p-3 font-medium text-slate-400">
                          {slot.horario}
                        </td>
                        {renderCelulaAula(slot.dias.segunda)}
                        {renderCelulaAula(slot.dias.terca)}
                        {renderCelulaAula(slot.dias.quarta)}
                        {renderCelulaAula(slot.dias.quinta)}
                        {renderCelulaAula(slot.dias.sexta)}
                      </tr>
                    ))}

                    <tr className="bg-slate-950/40">
                      <td
                        colSpan="6"
                        className="p-2 text-xs font-bold text-amber-400 tracking-wider uppercase"
                      >
                        Turno Vespertino
                      </td>
                    </tr>
                    {slotsVespertino.map((slot, idx) => (
                      <tr key={`vesp-${idx}`}>
                        <td className="p-3 font-medium text-slate-400">
                          {slot.horario}
                        </td>
                        {renderCelulaAula(slot.dias.segunda)}
                        {renderCelulaAula(slot.dias.terca)}
                        {renderCelulaAula(slot.dias.quarta)}
                        {renderCelulaAula(slot.dias.quinta)}
                        {renderCelulaAula(slot.dias.sexta)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>

        {overlaysNotificacao}
      </div>
    );
  }

  window.IFinityHub.App = App;
})();