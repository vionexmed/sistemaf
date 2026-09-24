import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// Status e totais nunca são gravados: são calculados em src/lib/dominio a partir destas tabelas.
// Colunas de lista guardam a chave de src/lib/catalogos.ts.

export const usuarios = pgTable("usuarios", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  perfil: text("perfil").notNull(), // Perfil
});

export const atletas = pgTable("atletas", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  apelido: text("apelido").notNull(), // como o jogador é chamado
  camisa: integer("camisa"), // opcional: não identifica nem ordena nada
  posicao: text("posicao").notNull(), // Posicao
  nascimento: date("nascimento").notNull(),
  alturaCm: integer("altura_cm"),
  pesoKg: numeric("peso_kg", { precision: 5, scale: 1 }),
  pe: text("pe"), // Pe
  foto: text("foto"), // caminho relativo em .data/uploads
  alergias: text("alergias"),
  lesoesAnteriores: text("lesoes_anteriores"),
  ativo: boolean("ativo").notNull().default(true),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
});

export const atendimentos = pgTable(
  "atendimentos",
  {
    id: serial("id").primaryKey(),
    atletaId: integer("atleta_id").notNull().references(() => atletas.id),
    data: date("data").notNull(),
    periodo: text("periodo").notNull(), // PeriodoDia
    hd: text("hd").notNull(),
    local: text("local").notNull(), // Regiao
    objetivo: text("objetivo").notNull(),
    status: text("status").notNull(), // StatusAtendimento
    evolucao: text("evolucao"),
    registradoPor: integer("registrado_por").references(() => usuarios.id),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("atendimento_unico").on(t.atletaId, t.data, t.periodo),
    index("atendimento_data").on(t.data),
  ],
);

export const lesoes = pgTable(
  "lesoes",
  {
    id: serial("id").primaryKey(),
    atletaId: integer("atleta_id").notNull().references(() => atletas.id),
    dia: date("dia").notNull(),
    tipo: text("tipo").notNull(),
    estrutura: text("estrutura"),
    regiao: text("regiao").notNull(),
    lado: text("lado").notNull(), // Lado
    reincidencia: boolean("reincidencia").notNull().default(false),
    diasAfastamento: integer("dias_afastamento"), // vazio = em aberto
    campeonato: text("campeonato").notNull(),
    periodo: text("periodo").notNull(), // PeriodoTemporada
    observacao: text("observacao"),
    registradoPor: integer("registrado_por").references(() => usuarios.id),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("lesao_atleta").on(t.atletaId)],
);

export const testes = pgTable("testes", {
  id: serial("id").primaryKey(),
  atletaId: integer("atleta_id").notNull().references(() => atletas.id),
  tipo: text("tipo").notNull(),
  data: date("data").notNull(),
  dados: jsonb("dados").notNull().default({}), // campos [a definir]
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
});

export const documentos = pgTable("documentos", {
  id: serial("id").primaryKey(),
  atletaId: integer("atleta_id").notNull().references(() => atletas.id),
  tipo: text("tipo").notNull(), // TipoDocumento
  nomeArquivo: text("nome_arquivo").notNull(),
  caminho: text("caminho").notNull(),
  mime: text("mime").notNull(),
  tamanho: integer("tamanho").notNull(),
  enviadoPor: integer("enviado_por").references(() => usuarios.id),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
});

export type Usuario = typeof usuarios.$inferSelect;
export type Atleta = typeof atletas.$inferSelect;
export type Atendimento = typeof atendimentos.$inferSelect;
export type Lesao = typeof lesoes.$inferSelect;
export type Teste = typeof testes.$inferSelect;
export type Documento = typeof documentos.$inferSelect;
