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
      acessibilidade: a11yService,
    } = window.IFinityHub;

    const [mostrarLanding, setMostrarLanding] = useState(true);
    const [eventos, setEventos] = useState([]);
    const [materiais, setMateriais] = useState([]);
    const [gradeHoraria, setGradeHoraria] = useState(GRADE_PADRAO);
    const [aba, setAba] = useState("dashboard");

    // Preferências de Acessibilidade e Configurações
    const [preferencias, setPreferencias] = useState(() =>
      a11yService.carregarPreferencias()
    );

    useEffect(() => {
      a11yService.aplicarNoDocumento(preferencias);
      a11yService.salvarPreferencias(preferencias);
    }, [preferencias]);

    const atualizarPreferencia = (chave, valor) => {
      setPreferencias((prev) => ({ ...prev, [chave]: valor }));
    };

    const alterarEscalaFonte = (delta) => {
      setPreferencias((prev) => {
        const atual = Number(prev.escalaFonte) || 100;
        const proxima = Math.min(125, Math.max(85, atual + delta));
        return { ...prev, escalaFonte: proxima };
      });
    };

    const perfilVisaoAtual =
      a11yService.PERFIS_VISAO[preferencias.modoVisao] ||
      a11yService.PERFIS_VISAO.normal;

    const temAcessibilidadeAtiva =
      preferencias.modoVisao !== "normal" ||
      preferencias.escalaFonte !== 100 ||
      preferencias.espacamentoLeitura ||
      preferencias.reduzirAnimacoes ||
      preferencias.altoContrasteBordas ||
      preferencias.aplicarFiltroImagens ||
      preferencias.destacarLinksBotoes;

    // Estados de Notificações
    const [historicoNotif, setHistoricoNotif] = useState(() =>
      notifService.carregarHistorico()
    );
    const [toasts, setToasts] = useState([]);
    const [painelNotifAberto, setPainelNotifAberto] = useState(false);
    const [permissaoNativa, setPermissaoNativa] = useState(() =>
      "Notification" in window ? Notification.permission : "unsupported"
    );

    // Estados de Autenticação / Modal de Representante
    const [senhaEditor, setSenhaEditor] = useState("");
    const [modalLoginAberto, setModalLoginAberto] = useState(false);
    const [abrirPainelPosLogin, setAbrirPainelPosLogin] = useState(false);
    const [senhaInput, setSenhaInput] = useState("");
    const [mostrarSenha, setMostrarSenha] = useState(false);
    const [erroLogin, setErroLogin] = useState("");
    const [validandoLogin, setValidandoLogin] = useState(false);
    const inputSenhaRef = useRef(null);

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
      if (!modalLoginAberto) return;
      const timer = setTimeout(() => inputSenhaRef.current?.focus(), 60);
      const onKeyDown = (e) => {
        if (e.key === "Escape") fecharModalLogin();
      };
      window.addEventListener("keydown", onKeyDown);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("keydown", onKeyDown);
      };
    }, [modalLoginAberto]);

    const eventosAdaptados = useMemo(
      () =>
        eventos.map((evt) => ({
          ...evt,
          color: a11yService.obterCorEvento(evt.tipo, preferencias.modoVisao),
        })),
      [eventos, preferencias.modoVisao]
    );

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
          events: eventosAdaptados,
          height: "75vh",
        });
        calendar.render();
        calendarInstanceRef.current = calendar;
      }
    }, [mostrarLanding, aba, eventosAdaptados]);

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

    const limparHistoricoNotificacoes = () => {
      setHistoricoNotif([]);
      notifService.salvarHistorico([]);
    };

    const fecharModalLogin = () => {
      setModalLoginAberto(false);
      setSenhaInput("");
      setMostrarSenha(false);
      setErroLogin("");
      setValidandoLogin(false);
    };

    const abrirAcessoRepresentante = (abrirPainelAposLogin = false) => {
      if (isEditor) {
        setSenhaEditor("");
        setUsuarioAtual({
          nome: "Estudante",
          cargo: "Aluno",
          permissoes: ["ler_provas", "ler_materiais", "postar_forum", "ler_editais"],
        });
        return;
      }
      setAbrirPainelPosLogin(abrirPainelAposLogin);
      setSenhaInput("");
      setErroLogin("");
      setMostrarSenha(false);
      setModalLoginAberto(true);
    };

    const submeterLoginRepresentante = async (e) => {
      e.preventDefault();
      if (!senhaInput.trim() || validandoLogin) return;

      setValidandoLogin(true);
      setErroLogin("");

      try {
        const resposta = await api.login(senhaInput);
        const resultado = await resposta.json();

        if (resposta.ok && resultado.success) {
          setSenhaEditor(senhaInput);
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
          const deveAbrirPainel = abrirPainelPosLogin;
          fecharModalLogin();
          if (deveAbrirPainel) {
            setAba("dashboard");
            setMostrarLanding(false);
          }
        } else {
          setErroLogin("Credencial inválida. Verifique a senha e tente novamente.");
          inputSenhaRef.current?.select();
        }
      } catch (error) {
        setErroLogin("Não foi possível conectar ao servidor de autenticação.");
      } finally {
        setValidandoLogin(false);
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
        {
          id: "preferencias",
          title: "Configurações",
          description: "Acessibilidade e sistema",
          meta: temAcessibilidadeAtiva ? "Ativo" : undefined,
          icon: (
            <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          ),
        },
      ],
      [
        eventos.length,
        editais.length,
        materiais.length,
        forumPosts.length,
        temAcessibilidadeAtiva,
      ]
    );

    const indiceAbaAtiva = useMemo(
      () => menuAbas.findIndex((m) => m.id === aba),
      [menuAbas, aba]
    );

    const itensMural = useMemo(
      () =>
        eventosAdaptados.map((evt) => {
          const isProva = evt.tipo === "prova";
          const isDever = evt.tipo === "dever";

          return {
            ...evt,
            title: evt.nomeOriginal,
            description: evt.descricao,
            meta: formatarContagemRegressiva(evt.start),
            iconStyle: {
              backgroundColor: `${evt.color}24`,
              color: evt.color,
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
      [eventosAdaptados]
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

    const overlaysGlobais = (
      <>
        {modalLoginAberto && (
          <div
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
            onClick={fecharModalLogin}
          >
            <div
              className="relative w-full max-w-md rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800/90 p-7 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),inset_0_1px_0_0_rgba(255,255,255,0.08)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />

              <button
                type="button"
                onClick={fecharModalLogin}
                aria-label="Fechar janela de acesso"
                className="absolute top-5 right-5 w-8 h-8 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 flex items-center justify-center transition"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 shadow-[0_0_30px_-5px_rgba(16,185,129,0.35)] flex items-center justify-center text-emerald-400 mb-4">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                    />
                  </svg>
                </div>

                <span className="text-[11px] font-semibold uppercase tracking-widest text-emerald-400 mb-1">
                  Autenticação Restrita
                </span>
                <h3 className="text-xl font-bold text-white tracking-tight">
                  Área do Representante
                </h3>
                <p className="text-xs text-slate-400 mt-1.5 max-w-xs leading-relaxed">
                  Insira a chave de acesso da turma para gerenciar provas,
                  editais, materiais PDF e moderação do fórum.
                </p>
              </div>

              <form onSubmit={submeterLoginRepresentante} className="space-y-4">
                <div>
                  <label
                    htmlFor="input-senha-representante"
                    className="block text-xs font-medium text-slate-300 mb-1.5"
                  >
                    Chave de Acesso
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate-500">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                      </svg>
                    </span>

                    <input
                      ref={inputSenhaRef}
                      id="input-senha-representante"
                      type={mostrarSenha ? "text" : "password"}
                      value={senhaInput}
                      onChange={(e) => {
                        setSenhaInput(e.target.value);
                        if (erroLogin) setErroLogin("");
                      }}
                      placeholder="Digite a senha de representante..."
                      autoComplete="current-password"
                      className={`w-full bg-slate-950/90 border rounded-xl py-3 pl-10 pr-11 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition ${
                        erroLogin
                          ? "border-red-500/60 focus:ring-red-500/30"
                          : "border-slate-800 focus:border-emerald-500/60 focus:ring-emerald-500/20"
                      }`}
                      required
                    />

                    <button
                      type="button"
                      onClick={() => setMostrarSenha((v) => !v)}
                      tabIndex={-1}
                      title={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                      className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-200 transition"
                    >
                      {mostrarSenha ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {erroLogin && (
                  <div className="flex items-center gap-2 text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-xl px-3.5 py-2.5">
                    <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                    <span>{erroLogin}</span>
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={fecharModalLogin}
                    className="flex-1 py-2.5 px-4 rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white text-sm font-medium transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={validandoLogin || !senhaInput.trim()}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 disabled:opacity-50 disabled:pointer-events-none text-white text-sm font-bold shadow-[0_8px_20px_-6px_rgba(16,185,129,0.55)] transition inline-flex items-center justify-center gap-2"
                  >
                    {validandoLogin ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Validando...</span>
                      </>
                    ) : (
                      <>
                        <span>Desbloquear</span>
                        <span>→</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

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
                  accentColor={perfilVisaoAtual.destaqueHex}
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
            onEntrarRepresentante={() => abrirAcessoRepresentante(true)}
            onAbrirNotificacoes={() => setPainelNotifAberto(true)}
            onAbrirPreferencias={() => {
              setAba("preferencias");
              setMostrarLanding(false);
            }}
            modoVisao={preferencias.modoVisao}
            destaqueHex={perfilVisaoAtual.destaqueHex}
            isEditor={isEditor}
            naoLidas={naoLidas}
            totalEventos={eventos.length}
            totalEditais={editais.length}
            totalMateriais={materiais.length}
          />
          {overlaysGlobais}
        </>
      );
    }

    return (
      <div className="flex flex-col md:flex-row h-screen bg-slate-950 text-slate-100 font-sans">
        <aside className="w-full md:w-72 bg-slate-900/90 border-b md:border-b-0 md:border-r border-slate-800/80 p-5 flex flex-col justify-between shrink-0 overflow-y-auto">
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
              accentColor={perfilVisaoAtual.destaqueHex}
              width="100%"
              maxHeight={500}
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

          <div className="mt-5 space-y-2.5 pt-4 border-t border-slate-800/70">
            <div
              className={`rounded-2xl p-3 border transition-all ${
                isEditor
                  ? "bg-amber-500/10 border-amber-500/30"
                  : "bg-slate-950/70 border-slate-800/90"
              }`}
            >
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isEditor ? "bg-amber-400 animate-pulse" : "bg-emerald-400"
                    }`}
                  />
                  <span className="text-[11px] font-medium text-slate-400">
                    Sessão atual
                  </span>
                </div>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                    isEditor
                      ? "bg-amber-500/20 text-amber-300"
                      : "bg-slate-800 text-slate-300"
                  }`}
                >
                  {usuarioAtual.cargo}
                </span>
              </div>

              <button
                onClick={() => abrirAcessoRepresentante(false)}
                className={`w-full text-xs font-semibold py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 hover:-translate-y-0.5 ${
                  isEditor
                    ? "bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40"
                    : "bg-gradient-to-b from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 text-slate-200 hover:text-white border border-slate-700/80 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]"
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  {isEditor ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  )}
                </svg>
                <span>
                  {isEditor ? "Encerrar Modo Editor" : "Acesso Representante"}
                </span>
              </button>
            </div>

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
                  accentColor={perfilVisaoAtual.destaqueHex}
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

          {aba === "preferencias" && (
            <div className="max-w-5xl mx-auto space-y-8">
              <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800/70 pb-5">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
                    Personalização & Sistema
                  </span>
                  <h2 className="text-2xl font-bold text-white mt-0.5">
                    Configurações
                  </h2>
                  <p className="text-slate-400 text-sm mt-1">
                    Gerencie os recursos da Barra de Acessibilidade, perfis de
                    daltonismo, notificações e sessão do portal.
                  </p>
                </div>

                {temAcessibilidadeAtiva && (
                  <button
                    onClick={() =>
                      setPreferencias({ ...a11yService.PREFS_PADRAO })
                    }
                    className="self-start sm:self-auto text-xs font-semibold px-4 py-2 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 transition"
                  >
                    Restaurar Padrão
                  </button>
                )}
              </header>

              {/* BARRA DE ACESSIBILIDADE DEDICADA */}
              <section
                aria-label="Barra de Acessibilidade"
                className="bg-gradient-to-b from-slate-900 to-slate-900/70 border border-emerald-500/30 rounded-2xl p-5 space-y-4 shadow-xl"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3.5">
                  <div className="flex items-center gap-2.5">
                    <span className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </span>
                    <div>
                      <h3 className="text-base font-bold text-white">
                        Barra de Acessibilidade
                      </h3>
                      <p className="text-xs text-slate-400">
                        Controles rápidos de tipografia, contraste, leitura e
                        movimento
                      </p>
                    </div>
                  </div>

                  <span className="text-xs px-2.5 py-1 rounded-full bg-slate-950 border border-slate-800 text-slate-300">
                    Escala atual:{" "}
                    <strong className="text-emerald-400">
                      {preferencias.escalaFonte}%
                    </strong>
                  </span>
                </div>

                {/* Controles da Barra */}
                <div
                  role="toolbar"
                  aria-label="Ferramentas de Acessibilidade"
                  className="flex flex-wrap items-center gap-2.5"
                >
                  {/* Controle de Tamanho da Fonte */}
                  <div className="inline-flex items-center rounded-xl bg-slate-950 border border-slate-800 p-1">
                    <button
                      type="button"
                      onClick={() => alterarEscalaFonte(-5)}
                      disabled={preferencias.escalaFonte <= 85}
                      title="Diminuir tamanho da fonte"
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-200 hover:bg-slate-800 disabled:opacity-40 transition"
                    >
                      A-
                    </button>
                    <button
                      type="button"
                      onClick={() => atualizarPreferencia("escalaFonte", 100)}
                      title="Tamanho padrão da fonte (100%)"
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-400 hover:bg-slate-800 transition"
                    >
                      100%
                    </button>
                    <button
                      type="button"
                      onClick={() => alterarEscalaFonte(5)}
                      disabled={preferencias.escalaFonte >= 125}
                      title="Aumentar tamanho da fonte"
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-200 hover:bg-slate-800 disabled:opacity-40 transition"
                    >
                      A+
                    </button>
                  </div>

                  {/* Alto Contraste */}
                  <button
                    type="button"
                    aria-pressed={preferencias.altoContrasteBordas}
                    onClick={() =>
                      atualizarPreferencia(
                        "altoContrasteBordas",
                        !preferencias.altoContrasteBordas
                      )
                    }
                    className={`px-3.5 py-2 rounded-xl border text-xs font-semibold transition inline-flex items-center gap-2 ${
                      preferencias.altoContrasteBordas
                        ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                        : "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    <span>◐</span>
                    <span>Alto Contraste</span>
                  </button>

                  {/* Espaçamento de Leitura */}
                  <button
                    type="button"
                    aria-pressed={preferencias.espacamentoLeitura}
                    onClick={() =>
                      atualizarPreferencia(
                        "espacamentoLeitura",
                        !preferencias.espacamentoLeitura
                      )
                    }
                    className={`px-3.5 py-2 rounded-xl border text-xs font-semibold transition inline-flex items-center gap-2 ${
                      preferencias.espacamentoLeitura
                        ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                        : "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    <span>≡</span>
                    <span>Espaçamento de Leitura</span>
                  </button>

                  {/* Destacar Links e Foco */}
                  <button
                    type="button"
                    aria-pressed={preferencias.destacarLinksBotoes}
                    onClick={() =>
                      atualizarPreferencia(
                        "destacarLinksBotoes",
                        !preferencias.destacarLinksBotoes
                      )
                    }
                    className={`px-3.5 py-2 rounded-xl border text-xs font-semibold transition inline-flex items-center gap-2 ${
                      preferencias.destacarLinksBotoes
                        ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                        : "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    <span>⌘</span>
                    <span>Destacar Links & Foco</span>
                  </button>

                  {/* Reduzir Animações */}
                  <button
                    type="button"
                    aria-pressed={preferencias.reduzirAnimacoes}
                    onClick={() =>
                      atualizarPreferencia(
                        "reduzirAnimacoes",
                        !preferencias.reduzirAnimacoes
                      )
                    }
                    className={`px-3.5 py-2 rounded-xl border text-xs font-semibold transition inline-flex items-center gap-2 ${
                      preferencias.reduzirAnimacoes
                        ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                        : "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    <span>⏸</span>
                    <span>Reduzir Animações</span>
                  </button>
                </div>
              </section>

              {/* PERFIS DE DALTONISMO / VISÃO */}
              <section className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
                    Perfil de Percepção de Cores (Daltonismo)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Adapta automaticamente as cores de provas, deveres, eventos
                    no calendário e destaques do sistema.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {Object.values(a11yService.PERFIS_VISAO).map((perfil) => {
                    const selecionado = preferencias.modoVisao === perfil.id;
                    return (
                      <button
                        key={perfil.id}
                        type="button"
                        onClick={() =>
                          atualizarPreferencia("modoVisao", perfil.id)
                        }
                        className={`text-left rounded-2xl p-5 border transition-all duration-300 flex flex-col justify-between gap-4 ${
                          selecionado
                            ? "bg-slate-900 border-emerald-500/60 shadow-[0_12px_30px_-10px_rgba(16,185,129,0.25)]"
                            : "bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900"
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-white text-base">
                              {perfil.nome}
                            </span>
                            <span
                              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                                selecionado
                                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                  : "bg-slate-950 text-slate-500 border border-slate-800"
                              }`}
                            >
                              {selecionado ? "Ativo" : "Selecionar"}
                            </span>
                          </div>
                          <p className="text-xs font-medium text-emerald-400">
                            {perfil.subtitulo}
                          </p>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            {perfil.descricao}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                          <span className="text-[11px] text-slate-400">
                            Paleta de categorias:
                          </span>
                          <div className="flex items-center gap-2">
                            <span
                              title="Prova"
                              style={{ backgroundColor: perfil.coresEventos.prova }}
                              className="w-5 h-5 rounded-full border border-white/20"
                            />
                            <span
                              title="Dever"
                              style={{ backgroundColor: perfil.coresEventos.dever }}
                              className="w-5 h-5 rounded-full border border-white/20"
                            />
                            <span
                              title="Evento"
                              style={{ backgroundColor: perfil.coresEventos.evento }}
                              className="w-5 h-5 rounded-full border border-white/20"
                            />
                            <span
                              title="Destaque"
                              style={{ backgroundColor: perfil.destaqueHex }}
                              className="w-5 h-5 rounded-full border border-white/20"
                            />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Filtro SVG em imagens */}
                <label className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4 cursor-pointer">
                  <div>
                    <div className="font-semibold text-white text-sm">
                      Aplicar Matriz de Compensação em Imagens e Banners
                    </div>
                    <div className="text-xs text-slate-400">
                      Aplica filtro SVG de daltonismo sobre banners de editais e
                      ilustrações quando um modo diferente de Normal Vision está
                      ativo.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferencias.aplicarFiltroImagens}
                    onChange={(e) =>
                      atualizarPreferencia(
                        "aplicarFiltroImagens",
                        e.target.checked
                      )
                    }
                    className="w-5 h-5 accent-emerald-500 rounded cursor-pointer shrink-0"
                  />
                </label>

                {/* Pré-visualização */}
                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Pré-visualização em Tempo Real
                    </span>
                    <span className="text-xs text-slate-400">
                      Modo:{" "}
                      <strong className="text-white">
                        {perfilVisaoAtual.nome}
                      </strong>
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <span
                      style={{
                        backgroundColor: `${perfilVisaoAtual.coresEventos.prova}22`,
                        color: perfilVisaoAtual.coresEventos.prova,
                        borderColor: `${perfilVisaoAtual.coresEventos.prova}55`,
                      }}
                      className="px-3.5 py-1.5 rounded-xl border text-xs font-bold"
                    >
                      ● PROVA — Matemática
                    </span>
                    <span
                      style={{
                        backgroundColor: `${perfilVisaoAtual.coresEventos.dever}22`,
                        color: perfilVisaoAtual.coresEventos.dever,
                        borderColor: `${perfilVisaoAtual.coresEventos.dever}55`,
                      }}
                      className="px-3.5 py-1.5 rounded-xl border text-xs font-bold"
                    >
                      ▲ DEVER — Lista de POO
                    </span>
                    <span
                      style={{
                        backgroundColor: `${perfilVisaoAtual.coresEventos.evento}22`,
                        color: perfilVisaoAtual.coresEventos.evento,
                        borderColor: `${perfilVisaoAtual.coresEventos.evento}55`,
                      }}
                      className="px-3.5 py-1.5 rounded-xl border text-xs font-bold"
                    >
                      ■ EVENTO — Mostra Científica
                    </span>
                    <span className="px-3.5 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 text-xs font-bold">
                      ✓ Destaque Principal
                    </span>
                  </div>
                </div>
              </section>

              {/* NOTIFICAÇÕES, SINCRONIZAÇÃO E CONTA */}
              <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
                    Notificações & Sincronização
                  </h3>
                  <p className="text-xs text-slate-400">
                    Status de notificações do navegador:{" "}
                    <strong className="text-white">
                      {permissaoNativa === "granted"
                        ? "Ativadas"
                        : permissaoNativa === "denied"
                          ? "Bloqueadas no navegador"
                          : permissaoNativa === "unsupported"
                            ? "Não suportado"
                            : "Pendente"}
                    </strong>
                  </p>
                  <div className="flex flex-wrap gap-2.5">
                    {permissaoNativa === "default" && (
                      <button
                        type="button"
                        onClick={ativarNotificacoesNavegador}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition"
                      >
                        Ativar Notificações
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={sincronizarTudo}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2 rounded-xl transition"
                    >
                      Sincronizar Dados Agora
                    </button>
                    {historicoNotif.length > 0 && (
                      <button
                        type="button"
                        onClick={limparHistoricoNotificacoes}
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold px-4 py-2 rounded-xl transition"
                      >
                        Limpar Histórico ({historicoNotif.length})
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
                    Perfil & Permissões da Sessão
                  </h3>
                  <div className="text-xs text-slate-400 space-y-1">
                    <div>
                      Usuário:{" "}
                      <strong className="text-white">
                        {usuarioAtual.nome}
                      </strong>{" "}
                      ({usuarioAtual.cargo})
                    </div>
                    <div>
                      Modo de edição:{" "}
                      <strong
                        className={
                          isEditor ? "text-amber-400" : "text-slate-300"
                        }
                      >
                        {isEditor ? "Ativo (Representante)" : "Somente Leitura"}
                      </strong>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => abrirAcessoRepresentante(false)}
                    className={`text-xs font-semibold px-4 py-2 rounded-xl border transition ${
                      isEditor
                        ? "bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30"
                        : "bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
                    }`}
                  >
                    {isEditor
                      ? "Encerrar Sessão de Representante"
                      : "Autenticar como Representante"}
                  </button>
                </div>
              </section>
            </div>
          )}
        </main>

        {overlaysGlobais}
      </div>
    );
  }

  window.IFinityHub.App = App;
})();