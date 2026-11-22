const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

// Importação das classes POO
const { Representante } = require("./models/Usuario");
const { Atividade } = require("./models/Atividade");
const {
  MaterialPDF,
  SugestaoForum,
  EditalProjeto,
} = require("./models/Conteudo");
const { GradeHoraria } = require("./models/GradeHoraria");

const app = express();
app.use(cors());
app.use(express.json());

// Serve os arquivos do front-end (index.html, CSS, JS, assets)
app.use(express.static(path.join(__dirname)));

const upload = multer({ storage: multer.memoryStorage() });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BUCKET_NAME = "ifinityhub";

// Instâncias principais
const representanteTurma = new Representante(
  "Representante 2º Info",
  process.env.EDITOR_PASSWORD || process.env.SENHA_REPRESENTANTE || "info2026"
);
const gradeTurma = new GradeHoraria("2º ano Téc. Informática — IF Goiano");

const verificarAutenticacao = (req, res, next) => {
  const senhaEnviada = req.headers["x-admin-password"];
  if (!representanteTurma.autenticar(senhaEnviada)) {
    return res
      .status(401)
      .json({ error: "Acesso não autorizado. Senha incorreta." });
  }
  next();
};

// ==========================================
// LOGIN E GRADE HORÁRIA
// ==========================================
app.post("/api/login", (req, res) => {
  const { senha } = req.body;
  if (representanteTurma.autenticar(senha)) {
    return res.json({
      success: true,
      message: "Autenticado com sucesso",
      usuario: representanteTurma.toJSON(),
    });
  }
  return res.status(401).json({ success: false, message: "Senha incorreta" });
});

app.get("/api/grade", (req, res) => {
  res.json(gradeTurma.toJSON());
});

// ==========================================
// ROTAS DE PROVAS / ATIVIDADES
// ==========================================
app.get("/api/provas", async (req, res) => {
  const { data, error } = await supabase.from("provas").select("*");
  if (error) return res.status(500).json({ error: error.message });

  const atividades = data.map((item) => Atividade.criarPorTipo(item).toJSON());
  res.json(atividades);
});

app.post("/api/provas", verificarAutenticacao, async (req, res) => {
  try {
    const atividade = Atividade.criarPorTipo(req.body);
    const { data, error } = await supabase
      .from("provas")
      .insert([atividade.toDatabase()])
      .select();

    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json(Atividade.criarPorTipo(data[0]).toJSON());
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put("/api/provas/:id", verificarAutenticacao, async (req, res) => {
  try {
    const { id } = req.params;
    const atividade = Atividade.criarPorTipo({ ...req.body, id });

    const { data, error } = await supabase
      .from("provas")
      .update(atividade.toDatabase())
      .eq("id", id)
      .select();

    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0) {
      return res.status(404).json({ error: "Atividade não encontrada." });
    }

    res.json({
      message: "Atividade atualizada com sucesso",
      data: Atividade.criarPorTipo(data[0]).toJSON(),
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete("/api/provas/:id", verificarAutenticacao, async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from("provas").delete().eq("id", id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: "Atividade removida com sucesso" });
});

// ==========================================
// ROTAS DE MATERIAIS (PDFs)
// ==========================================
app.get("/api/materiais", async (req, res) => {
  const { data, error } = await supabase.from("materiais").select("*");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post(
  "/api/materiais",
  verificarAutenticacao,
  upload.single("arquivo"),
  async (req, res) => {
    try {
      const arquivo = req.file;
      if (!arquivo)
        return res.status(400).json({ error: "Nenhum arquivo enviado." });

      const material = new MaterialPDF({
        nome: req.body.nome,
        disciplina: req.body.disciplina,
      });
      material.validar();

      const extensao = arquivo.originalname.split(".").pop();
      const caminhoArquivo = `materiais/${Date.now()}_${Math.random().toString(36).substring(7)}.${extensao}`;

      const { error: storageError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(caminhoArquivo, arquivo.buffer, {
          contentType: arquivo.mimetype,
        });

      if (storageError) throw storageError;

      const { data: publicUrlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(caminhoArquivo);

      material.url = publicUrlData.publicUrl;

      const { error: dbError } = await supabase
        .from("materiais")
        .insert([material.toDatabase()]);

      if (dbError) throw dbError;

      res.status(201).json({ message: "Material enviado com sucesso!" });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

app.delete("/api/materiais/:id", verificarAutenticacao, async (req, res) => {
  try {
    const { id } = req.params;
    const { data: material } = await supabase
      .from("materiais")
      .select("url")
      .eq("id", id)
      .single();

    if (material && material.url) {
      const marcador = `/object/public/${BUCKET_NAME}/`;
      const idx = material.url.indexOf(marcador);
      if (idx !== -1) {
        const caminhoStorage = material.url.substring(idx + marcador.length);
        await supabase.storage.from(BUCKET_NAME).remove([caminhoStorage]);
      }
    }

    const { error } = await supabase.from("materiais").delete().eq("id", id);
    if (error) throw error;

    res.json({ message: "Material removido com sucesso" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// ROTAS DE EDITAIS DE PROJETOS
// ==========================================
app.get("/api/editais", async (req, res) => {
  const { data, error } = await supabase
    .from("editais")
    .select("*")
    .order("criado_em", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post(
  "/api/editais",
  verificarAutenticacao,
  upload.single("foto"),
  async (req, res) => {
    try {
      const edital = new EditalProjeto({
        titulo: req.body.titulo,
        descricao: req.body.descricao,
        link_formulario: req.body.link_formulario,
        prazo: req.body.prazo,
      });
      edital.validar();

      if (req.file) {
        const extensao = req.file.originalname.split(".").pop();
        const caminhoArquivo = `editais/${Date.now()}_${Math.random().toString(36).substring(7)}.${extensao}`;

        const { error: storageError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(caminhoArquivo, req.file.buffer, {
            contentType: req.file.mimetype,
          });

        if (storageError) throw storageError;

        const { data: publicUrlData } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(caminhoArquivo);

        edital.imagemUrl = publicUrlData.publicUrl;
      }

      const { data, error: dbError } = await supabase
        .from("editais")
        .insert([edital.toDatabase()])
        .select();

      if (dbError) throw dbError;

      res
        .status(201)
        .json({ message: "Edital publicado com sucesso!", data: data[0] });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

app.delete("/api/editais/:id", verificarAutenticacao, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: edital } = await supabase
      .from("editais")
      .select("imagem_url")
      .eq("id", id)
      .single();

    if (edital && edital.imagem_url) {
      const marcador = `/object/public/${BUCKET_NAME}/`;
      const idx = edital.imagem_url.indexOf(marcador);
      if (idx !== -1) {
        const caminhoStorage = edital.imagem_url.substring(idx + marcador.length);
        await supabase.storage.from(BUCKET_NAME).remove([caminhoStorage]);
      }
    }

    const { error } = await supabase.from("editais").delete().eq("id", id);
    if (error) throw error;

    res.json({ message: "Edital removido com sucesso" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// ROTAS DO FÓRUM
// ==========================================
app.get("/api/forum", async (req, res) => {
  const { data, error } = await supabase
    .from("forum")
    .select("*")
    .order("criado_em", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post("/api/forum", async (req, res) => {
  try {
    const sugestao = new SugestaoForum(req.body);
    sugestao.validar();

    const { data, error } = await supabase
      .from("forum")
      .insert([sugestao.toDatabase()])
      .select();

    if (error) return res.status(500).json({ error: error.message });
    res
      .status(201)
      .json({ message: "Sugestão publicada com sucesso!", data: data[0] });
  } catch (err) {
    res.status(422).json({ error: err.message });
  }
});

app.delete("/api/forum/:id", verificarAutenticacao, async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from("forum").delete().eq("id", id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: "Sugestão removida com sucesso" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend POO rodando na porta ${PORT}`));