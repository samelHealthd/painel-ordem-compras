import {
  type User, type InsertUser,
  type OrdemCompra, type InsertOrdemCompra,
  type CentroCusto, type InsertCentroCusto,
  users, ordensCompra, centrosCusto,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, desc, sql, count } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getOrdensCompra(filters?: {
    dtInicio?: string;
    dtFim?: string;
    cdCentroCusto?: number;
    status?: string;
  }): Promise<OrdemCompra[]>;
  getOrdemCompraById(id: number): Promise<OrdemCompra | undefined>;
  getOrdemCompraByNrSeq(nrSeq: number): Promise<OrdemCompra | undefined>;
  createOrdemCompra(ordem: InsertOrdemCompra): Promise<OrdemCompra>;
  updateOrdemCompra(id: number, data: Partial<InsertOrdemCompra>): Promise<OrdemCompra | undefined>;
  deleteOrdemCompra(id: number): Promise<boolean>;
  aprovarOrdemCompra(id: number, nmAprovador: string, dsObservacao?: string): Promise<OrdemCompra | undefined>;
  reprovarOrdemCompra(id: number, nmAprovador: string, dsObservacao?: string): Promise<OrdemCompra | undefined>;

  getCentrosCusto(): Promise<CentroCusto[]>;
  createCentroCusto(centro: InsertCentroCusto): Promise<CentroCusto>;

  getDashboardStats(filters?: {
    dtInicio?: string;
    dtFim?: string;
    cdCentroCusto?: number;
  }): Promise<{
    totalPendentes: number;
    totalAprovadas: number;
    totalReprovadas: number;
    valorTotalPendentes: number;
    valorTotalAprovadas: number;
    valorTotalReprovadas: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getOrdensCompra(filters?: {
    dtInicio?: string;
    dtFim?: string;
    cdCentroCusto?: number;
    status?: string;
  }): Promise<OrdemCompra[]> {
    const conditions = [];

    if (filters?.dtInicio) {
      conditions.push(gte(ordensCompra.dtLiberacao, new Date(filters.dtInicio)));
    }
    if (filters?.dtFim) {
      const dtFim = new Date(filters.dtFim);
      dtFim.setHours(23, 59, 59, 999);
      conditions.push(lte(ordensCompra.dtLiberacao, dtFim));
    }
    if (filters?.cdCentroCusto) {
      conditions.push(eq(ordensCompra.cdCentroCusto, filters.cdCentroCusto));
    }
    if (filters?.status) {
      conditions.push(eq(ordensCompra.ieAprovReprov, filters.status));
    }

    if (conditions.length > 0) {
      return db.select().from(ordensCompra).where(and(...conditions)).orderBy(desc(ordensCompra.nrSeqOrdemCompra));
    }

    return db.select().from(ordensCompra).orderBy(desc(ordensCompra.nrSeqOrdemCompra));
  }

  async getOrdemCompraById(id: number): Promise<OrdemCompra | undefined> {
    const [ordem] = await db.select().from(ordensCompra).where(eq(ordensCompra.id, id));
    return ordem;
  }

  async getOrdemCompraByNrSeq(nrSeq: number): Promise<OrdemCompra | undefined> {
    const [ordem] = await db.select().from(ordensCompra).where(eq(ordensCompra.nrSeqOrdemCompra, nrSeq));
    return ordem;
  }

  async createOrdemCompra(ordem: InsertOrdemCompra): Promise<OrdemCompra> {
    const [created] = await db.insert(ordensCompra).values(ordem).returning();
    return created;
  }

  async updateOrdemCompra(id: number, data: Partial<InsertOrdemCompra>): Promise<OrdemCompra | undefined> {
    const [updated] = await db.update(ordensCompra).set(data).where(eq(ordensCompra.id, id)).returning();
    return updated;
  }

  async deleteOrdemCompra(id: number): Promise<boolean> {
    const result = await db.delete(ordensCompra).where(eq(ordensCompra.id, id)).returning();
    return result.length > 0;
  }

  async aprovarOrdemCompra(id: number, nmAprovador: string, dsObservacao?: string): Promise<OrdemCompra | undefined> {
    const [updated] = await db.update(ordensCompra).set({
      ieAprovReprov: "A",
      dsStatusAprovacao: "APROVADO",
      nmAprovador,
      dtAprovReprov: new Date(),
      dsObservacaoAprovador: dsObservacao || null,
    }).where(eq(ordensCompra.id, id)).returning();
    return updated;
  }

  async reprovarOrdemCompra(id: number, nmAprovador: string, dsObservacao?: string): Promise<OrdemCompra | undefined> {
    const [updated] = await db.update(ordensCompra).set({
      ieAprovReprov: "R",
      dsStatusAprovacao: "REPROVADO",
      nmAprovador,
      dtAprovReprov: new Date(),
      dsObservacaoAprovador: dsObservacao || null,
    }).where(eq(ordensCompra.id, id)).returning();
    return updated;
  }

  async getCentrosCusto(): Promise<CentroCusto[]> {
    return db.select().from(centrosCusto).orderBy(centrosCusto.dsCentroCusto);
  }

  async createCentroCusto(centro: InsertCentroCusto): Promise<CentroCusto> {
    const [created] = await db.insert(centrosCusto).values(centro).returning();
    return created;
  }

  async getDashboardStats(filters?: {
    dtInicio?: string;
    dtFim?: string;
    cdCentroCusto?: number;
  }): Promise<{
    totalPendentes: number;
    totalAprovadas: number;
    totalReprovadas: number;
    valorTotalPendentes: number;
    valorTotalAprovadas: number;
    valorTotalReprovadas: number;
  }> {
    const conditions = [];

    if (filters?.dtInicio) {
      conditions.push(gte(ordensCompra.dtLiberacao, new Date(filters.dtInicio)));
    }
    if (filters?.dtFim) {
      const dtFim = new Date(filters.dtFim);
      dtFim.setHours(23, 59, 59, 999);
      conditions.push(lte(ordensCompra.dtLiberacao, dtFim));
    }
    if (filters?.cdCentroCusto) {
      conditions.push(eq(ordensCompra.cdCentroCusto, filters.cdCentroCusto));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const pendentes = await db.select({
      total: count(),
      valor: sql<string>`COALESCE(SUM(CAST(${ordensCompra.vlOrdemCompra} AS NUMERIC)), 0)`,
    }).from(ordensCompra).where(whereClause ? and(whereClause, eq(ordensCompra.ieAprovReprov, "P")) : eq(ordensCompra.ieAprovReprov, "P"));

    const aprovadas = await db.select({
      total: count(),
      valor: sql<string>`COALESCE(SUM(CAST(${ordensCompra.vlOrdemCompra} AS NUMERIC)), 0)`,
    }).from(ordensCompra).where(whereClause ? and(whereClause, eq(ordensCompra.ieAprovReprov, "A")) : eq(ordensCompra.ieAprovReprov, "A"));

    const reprovadas = await db.select({
      total: count(),
      valor: sql<string>`COALESCE(SUM(CAST(${ordensCompra.vlOrdemCompra} AS NUMERIC)), 0)`,
    }).from(ordensCompra).where(whereClause ? and(whereClause, eq(ordensCompra.ieAprovReprov, "R")) : eq(ordensCompra.ieAprovReprov, "R"));

    return {
      totalPendentes: Number(pendentes[0]?.total || 0),
      totalAprovadas: Number(aprovadas[0]?.total || 0),
      totalReprovadas: Number(reprovadas[0]?.total || 0),
      valorTotalPendentes: Number(pendentes[0]?.valor || 0),
      valorTotalAprovadas: Number(aprovadas[0]?.valor || 0),
      valorTotalReprovadas: Number(reprovadas[0]?.valor || 0),
    };
  }
}

export const storage = new DatabaseStorage();
