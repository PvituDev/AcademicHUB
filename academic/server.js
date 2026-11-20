const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

// Importação das classes POO
const { Representante } = require("./models/Usuario");
const { Atividade } = require("./models/Atividade");
const { MaterialPDF, SugestaoForum } = require("./models/Conteudo");
const { GradeHoraria } = require("./models/GradeHoraria");

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

const supabase = createClient(
  process.env.SUPABASE_URL || "https://jnkonklwmaseeylebhdt.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "sb_publishable_lQ1jnvO5jio3YqNRNDUkuw_a33pg5s7"
);

// Instâncias principais
const representanteTurma = new Representante(
  "Representante 2º Info",
  process.env.SENHA_REPRESENTANTE || "info2026"
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
      const nomeArquivoUnico = `${Date.now()}_${Math.random().toString(36).substring(7)}.${extensao}`;

      const { error: storageError } = await supabase.storage
        .from("MATERIAIS_PDF")
        .upload(nomeArquivoUnico, arquivo.buffer, {
          contentType: arquivo.mimetype,
        });

      if (storageError) throw storageError;

      const { data: publicUrlData } = supabase.storage
        .from("MATERIAIS_PDF")
        .getPublicUrl(nomeArquivoUnico);

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
      const partesUrl = material.url.split("/");
      const nomeArquivo = partesUrl[partesUrl.length - 1];
      await supabase.storage.from("MATERIAIS_PDF").remove([nomeArquivo]);
    }

    const { error } = await supabase.from("materiais").delete().eq("id", id);
    if (error) throw error;

    res.json({ message: "Material removido com sucesso" });
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