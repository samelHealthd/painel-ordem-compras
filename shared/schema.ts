import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, numeric, timestamp, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const ordensCompra = pgTable("ordens_compra", {
  id: serial("id").primaryKey(),
  nrSeqOrdemCompra: integer("nr_seq_ordem_compra").notNull(),
  cdEstabelecimento: integer("cd_estabelecimento"),
  nmEstabelecimento: text("nm_estabelecimento"),
  vlOrdemCompra: numeric("vl_ordem_compra", { precision: 15, scale: 2 }).notNull(),
  dsCentroCusto: text("ds_centro_custo"),
  cdCentroCusto: integer("cd_centro_custo"),
  dtLiberacao: timestamp("dt_liberacao"),
  hrLiberacao: text("hr_liberacao"),
  ieAprovReprov: text("ie_aprov_reprov").notNull().default("P"),
  dsStatusAprovacao: text("ds_status_aprovacao").notNull().default("PENDENTE"),
  nmAprovador: text("nm_aprovador"),
  cdAprovador: text("cd_aprovador"),
  dtAprovReprov: timestamp("dt_aprov_reprov"),
  nmPessoaFisicaComprador: text("nm_pessoa_fisica_comprador"),
  nmPjFornecedor: text("nm_pj_fornecedor"),
  nmPessoaSolicitante: text("nm_pessoa_solicitante"),
  ieUrgencia: text("ie_urgencia"),
  dsObservacao: text("ds_observacao"),
  dsObservacaoAprovador: text("ds_observacao_aprovador"),
  nrSeqPedidoAutorizacao: integer("nr_seq_pedido_autorizacao"),
});

export const insertOrdemCompraSchema = createInsertSchema(ordensCompra).omit({
  id: true,
});

export type InsertOrdemCompra = z.infer<typeof insertOrdemCompraSchema>;
export type OrdemCompra = typeof ordensCompra.$inferSelect;

export const centrosCusto = pgTable("centros_custo", {
  id: serial("id").primaryKey(),
  cdCentroCusto: integer("cd_centro_custo").notNull().unique(),
  dsCentroCusto: text("ds_centro_custo").notNull(),
});

export const insertCentroCustoSchema = createInsertSchema(centrosCusto).omit({
  id: true,
});

export type InsertCentroCusto = z.infer<typeof insertCentroCustoSchema>;
export type CentroCusto = typeof centrosCusto.$inferSelect;
