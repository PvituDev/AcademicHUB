(function () {
  window.IFinityHub = window.IFinityHub || {};

  function LandingPage({
    onEntrar,
    onEntrarRepresentante,
    onAbrirNotificacoes,
    onAbrirPreferencias,
    modoVisao = "normal",
    destaqueHex = "#10b981",
    isEditor = false,
    naoLidas = 0,
    totalEventos,
    totalEditais,
    totalMateriais,
  }) {
    const { BlurText, LogoIFinityDefMark } = window.IFinityHub;

    const recursos = [
      {
        aba: "dashboard",
        tag: "Organização",
        titulo: "Mural de Atividades",
        desc: "Provas, deveres e eventos da turma com contagem regressiva e limpeza automática após o prazo.",
        icone: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
        ),
      },
      {
        aba: "grade",
        tag: "Rotina",
        titulo: "Grade Horária",
        desc: "Horários completos dos turnos matutino e vespertino com disciplinas e docentes atualizados.",
        icone: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
          </svg>
        ),
      },
      {
        aba: "editais",
        tag: "Oportunidades",
        titulo: "Editais de Projetos",
        desc: "Chamadas abertas de iniciação científica, extensão e monitoria no IF Goiano com link direto.",
        icone: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
          </svg>
        ),
      },
      {
        aba: "materiais",
        tag: "Acervo",
        titulo: "Materiais & PDFs",
        desc: "Apostilas, listas de exercícios e slides organizados por disciplina para acesso imediato.",
        icone: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        ),
      },
      {
        aba: "calendario",
        tag: "Cronograma",
        titulo: "Calendário Interativo",
        desc: "Visão mensal e semanal integrada de todas as avaliações, seminários e entregas do semestre.",
        icone: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
        ),
      },
      {
        aba: "forum",
        tag: "Comunidade",
        titulo: "Fórum Construtivo",
        desc: "Canal direto da turma para propor melhorias acadêmicas com filtro automático de moderação.",
        icone: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
          </svg>
        ),
      },
    ];

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-x-hidden">
        <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[720px] h-[420px] rounded-full bg-emerald-500/10 blur-3xl" />

        <header className="relative z-10 max-w-6xl w-full mx-auto px-6 py-5 flex items-center justify-between border-b border-slate-800/70">
          <div className="flex items-center gap-3">
            <img
              src="./assets/lg%20IFinityHub.png"
              alt="IFinityHub"
              className="h-10 w-auto object-contain"
            />
            <span className="hidden sm:inline-block text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
              2º Téc. Informática • IF Goiano
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Botão Preferências & Acessibilidade na parte superior */}
            <button
              onClick={onAbrirPreferencias}
              title="Preferências e Barra de Acessibilidade"
              className={`px-3 py-2 rounded-xl border transition-all duration-300 hover:-translate-y-0.5 inline-flex items-center gap-2 text-xs font-semibold ${
                modoVisao !== "normal"
                  ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                  : "border-slate-800 hover:border-emerald-500/40 bg-slate-900/80 hover:bg-slate-800/90 text-slate-200 hover:text-emerald-400"
              }`}
            >
              <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
              </svg>
              <span className="hidden md:inline">
                {modoVisao === "normal"
                  ? "Preferências"
                  : `Preferências (${modoVisao.charAt(0).toUpperCase() + modoVisao.slice(1)})`}
              </span>
            </button>

            <button
              onClick={onAbrirNotificacoes}
              title="Central de Notificações"
              className="relative p-2.5 rounded-xl border border-slate-800 hover:border-emerald-500/40 bg-slate-900/80 hover:bg-slate-800/90 text-slate-300 hover:text-emerald-400 transition-all duration-300 hover:-translate-y-0.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
              {naoLidas > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-500 text-slate-950 font-bold text-[10px] flex items-center justify-center shadow">
                  {naoLidas}
                </span>
              )}
            </button>

            <button
              onClick={onEntrarRepresentante}
              className={`group text-xs sm:text-sm font-medium px-3.5 py-2 rounded-xl border transition-all duration-300 ease-out hover:-translate-y-0.5 inline-flex items-center gap-2 ${
                isEditor
                  ? "bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-[0_0_20px_-5px_rgba(245,158,11,0.35)]"
                  : "text-slate-300 hover:text-white border-slate-800 hover:border-emerald-500/40 bg-slate-900/90 hover:bg-slate-800/90 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] hover:shadow-lg hover:shadow-black/40"
              }`}
            >
              <span className="relative flex items-center justify-center">
                {isEditor && (
                  <span className="absolute inline-flex h-2.5 w-2.5 rounded-full bg-amber-400 opacity-75 animate-ping" />
                )}
                <svg
                  className={`w-4 h-4 transition-colors ${isEditor ? "text-amber-400" : "text-slate-400 group-hover:text-emerald-400"}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                  />
                </svg>
              </span>
              <span className="hidden sm:inline">
                {isEditor ? "Modo Editor Ativo" : "Área do Representante"}
              </span>
            </button>

            <button
              onClick={() => onEntrar("dashboard")}
              className="group text-xs sm:text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl shadow-[0_8px_20px_-6px_rgba(16,185,129,0.5),inset_0_1px_0_0_rgba(255,255,255,0.2)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_14px_28px_-6px_rgba(16,185,129,0.65)] active:translate-y-0 inline-flex items-center gap-1.5"
            >
              <span>Acessar Plataforma</span>
              <span className="transition-transform duration-300 group-hover:translate-x-0.5">→</span>
            </button>
          </div>
        </header>

        <main className="relative z-10 max-w-6xl w-full mx-auto px-6 py-12 md:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Central Acadêmica da Turma — 2026
              </div>

              <BlurText
                text="Toda a rotina do IFinityHub em um só lugar."
                highlightWord="IFinityHub"
                effect="tilt"
                animateBy="letters"
                direction="bottom"
                staggerFrom="start"
                trigger="view"
                delay={40}
                stepDuration={0.45}
                blur={8}
                distance={40}
                className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight justify-center lg:justify-start"
                loop={false}
                loopDelay={2}
                focusOnHover={false}
                color={destaqueHex}
                fromColor="#ffffff"
              />

              <p className="text-slate-400 text-base sm:text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Acompanhe datas de provas, grade horária semanal, editais de
                projetos do IF Goiano e baixe materiais de estudo sem
                depender de mensagens perdidas em grupos.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <button
                  onClick={() => onEntrar("dashboard")}
                  className="group w-full sm:w-auto bg-gradient-to-b from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold px-7 py-3.5 rounded-2xl shadow-[0_12px_28px_-8px_rgba(16,185,129,0.55),inset_0_1px_0_0_rgba(255,255,255,0.25)] transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-[0_20px_38px_-8px_rgba(16,185,129,0.7),inset_0_1px_0_0_rgba(255,255,255,0.35)] active:translate-y-0 text-base inline-flex items-center justify-center gap-2"
                >
                  <span>Entrar no Portal</span>
                  <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                </button>
                <button
                  onClick={() => onEntrar("editais")}
                  className="group w-full sm:w-auto bg-gradient-to-b from-slate-900 to-slate-900/70 hover:from-slate-800 hover:to-slate-900 text-slate-200 hover:text-white font-semibold px-6 py-3.5 rounded-2xl border border-slate-800 hover:border-emerald-500/40 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-[0_18px_34px_-12px_rgba(16,185,129,0.22),inset_0_1px_0_0_rgba(16,185,129,0.2)] active:translate-y-0 text-base inline-flex items-center justify-center gap-2.5"
                >
                  <svg className="w-4 h-4 text-emerald-400 transition-transform duration-300 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                  </svg>
                  <span>Ver Editais Abertos</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-800/80 max-w-md mx-auto lg:mx-0">
                <div>
                  <div className="text-2xl font-bold text-white">{totalEventos}</div>
                  <div className="text-xs text-slate-400">Atividades ativas</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-emerald-400">{totalEditais}</div>
                  <div className="text-xs text-slate-400">Editais abertos</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{totalMateriais}</div>
                  <div className="text-xs text-slate-400">PDFs disponíveis</div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center">
              <div className="relative w-full max-w-[440px] flex items-center justify-center">
                <div className="absolute inset-8 rounded-full bg-emerald-500/15 blur-2xl pointer-events-none" />
                <LogoIFinityDefMark />
              </div>
            </div>
          </div>

          <section className="mt-24">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4 border-b border-slate-800/70 pb-6">
              <div>
                <span className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
                  Módulos do Sistema
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1 tracking-tight">
                  Tudo o que você encontra no IFinityHub
                </h2>
              </div>
              <p className="text-slate-400 text-sm max-w-md">
                Ferramentas integradas para organizar prazos, aulas e
                oportunidades do 2º ano de Informática.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recursos.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => onEntrar(item.aba)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") onEntrar(item.aba);
                  }}
                  className="group relative cursor-pointer rounded-2xl p-6 bg-gradient-to-b from-slate-900/90 to-slate-900/40 border border-slate-800/90 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] transition-all duration-300 ease-out hover:-translate-y-2 hover:border-emerald-500/40 hover:shadow-[0_20px_40px_-15px_rgba(16,185,129,0.18),inset_0_1px_0_0_rgba(16,185,129,0.2)]"
                >
                  <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  <div className="flex items-center justify-between mb-5">
                    <div className="w-11 h-11 rounded-xl bg-slate-950 border border-slate-800 group-hover:border-emerald-500/30 group-hover:bg-emerald-500/10 flex items-center justify-center text-slate-300 group-hover:text-emerald-400 transition-colors duration-300">
                      {item.icone}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-slate-950/80 text-slate-400 border border-slate-800/80 group-hover:text-emerald-300 group-hover:border-emerald-500/20 transition-colors">
                        {item.tag}
                      </span>
                      <span className="text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300 text-sm">
                        ↗
                      </span>
                    </div>
                  </div>

                  <h3 className="font-semibold text-white text-lg tracking-tight mb-2 group-hover:text-emerald-300 transition-colors">
                    {item.titulo}
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </main>

        <footer className="relative z-10 border-t border-slate-800/70 py-6 px-6 text-center text-xs text-slate-500">
          IFinityHub • 2º Ano Técnico em Informática — IF Goiano
        </footer>
      </div>
    );
  }

  window.IFinityHub.LandingPage = LandingPage;
})();