import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertOrdemCompraSchema, insertCentroCustoSchema } from "@shared/schema";
import cors from "cors";
import { z } from "zod";

function parseId(raw: string): number | null {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 && Number.isInteger(n) ? n : null;
}

const aprovarReprovarSchema = z.object({
  nmAprovador: z.string().min(1, "Nome do aprovador é obrigatório"),
  dsObservacao: z.string().optional(),
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.use(cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  }));

  app.get("/api/ordens-compra", async (req, res) => {
    try {
      const { dtInicio, dtFim, cdCentroCusto, status } = req.query;
      const ordens = await storage.getOrdensCompra({
        dtInicio: dtInicio as string,
        dtFim: dtFim as string,
        cdCentroCusto: cdCentroCusto ? Number(cdCentroCusto) : undefined,
        status: status as string,
      });
      res.json(ordens);
    } catch (error) {
      console.error("Error fetching ordens:", error);
      res.status(500).json({ message: "Erro ao buscar ordens de compra" });
    }
  });

  app.get("/api/ordens-compra/pendentes", async (req, res) => {
    try {
      const { dtInicio, dtFim, cdCentroCusto } = req.query;
      const ordens = await storage.getOrdensCompra({
        dtInicio: dtInicio as string,
        dtFim: dtFim as string,
        cdCentroCusto: cdCentroCusto ? Number(cdCentroCusto) : undefined,
        status: "P",
      });
      res.json(ordens);
    } catch (error) {
      console.error("Error fetching pendentes:", error);
      res.status(500).json({ message: "Erro ao buscar ordens pendentes" });
    }
  });

  app.get("/api/ordens-compra/aprovadas", async (req, res) => {
    try {
      const { dtInicio, dtFim, cdCentroCusto } = req.query;
      const ordens = await storage.getOrdensCompra({
        dtInicio: dtInicio as string,
        dtFim: dtFim as string,
        cdCentroCusto: cdCentroCusto ? Number(cdCentroCusto) : undefined,
        status: "A",
      });
      res.json(ordens);
    } catch (error) {
      console.error("Error fetching aprovadas:", error);
      res.status(500).json({ message: "Erro ao buscar ordens aprovadas" });
    }
  });

  app.get("/api/ordens-compra/reprovadas", async (req, res) => {
    try {
      const { dtInicio, dtFim, cdCentroCusto } = req.query;
      const ordens = await storage.getOrdensCompra({
        dtInicio: dtInicio as string,
        dtFim: dtFim as string,
        cdCentroCusto: cdCentroCusto ? Number(cdCentroCusto) : undefined,
        status: "R",
      });
      res.json(ordens);
    } catch (error) {
      console.error("Error fetching reprovadas:", error);
      res.status(500).json({ message: "Erro ao buscar ordens reprovadas" });
    }
  });

  app.get("/api/ordens-compra/:id", async (req, res) => {
    try {
      const id = parseId(req.params.id);
      if (!id) return res.status(400).json({ message: "ID inválido" });
      const ordem = await storage.getOrdemCompraById(id);
      if (!ordem) {
        return res.status(404).json({ message: "Ordem de compra não encontrada" });
      }
      res.json(ordem);
    } catch (error) {
      console.error("Error fetching ordem:", error);
      res.status(500).json({ message: "Erro ao buscar ordem de compra" });
    }
  });

  app.post("/api/ordens-compra", async (req, res) => {
    try {
      const validated = insertOrdemCompraSchema.parse(req.body);
      const ordem = await storage.createOrdemCompra(validated);
      res.status(201).json(ordem);
    } catch (error: any) {
      console.error("Error creating ordem:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro ao criar ordem de compra" });
    }
  });

  app.put("/api/ordens-compra/:id", async (req, res) => {
    try {
      const id = parseId(req.params.id);
      if (!id) return res.status(400).json({ message: "ID inválido" });
      const validated = insertOrdemCompraSchema.partial().parse(req.body);
      const ordem = await storage.updateOrdemCompra(id, validated);
      if (!ordem) {
        return res.status(404).json({ message: "Ordem de compra não encontrada" });
      }
      res.json(ordem);
    } catch (error: any) {
      console.error("Error updating ordem:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro ao atualizar ordem de compra" });
    }
  });

  app.delete("/api/ordens-compra/:id", async (req, res) => {
    try {
      const id = parseId(req.params.id);
      if (!id) return res.status(400).json({ message: "ID inválido" });
      const deleted = await storage.deleteOrdemCompra(id);
      if (!deleted) {
        return res.status(404).json({ message: "Ordem de compra não encontrada" });
      }
      res.json({ message: "Ordem de compra removida com sucesso" });
    } catch (error) {
      console.error("Error deleting ordem:", error);
      res.status(500).json({ message: "Erro ao remover ordem de compra" });
    }
  });

  app.post("/api/ordens-compra/:id/aprovar", async (req, res) => {
    try {
      const id = parseId(req.params.id);
      if (!id) return res.status(400).json({ message: "ID inválido" });
      const { nmAprovador, dsObservacao } = aprovarReprovarSchema.parse(req.body);
      const ordem = await storage.aprovarOrdemCompra(id, nmAprovador, dsObservacao);
      if (!ordem) {
        return res.status(404).json({ message: "Ordem de compra não encontrada" });
      }
      res.json(ordem);
    } catch (error: any) {
      console.error("Error approving ordem:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro ao aprovar ordem de compra" });
    }
  });

  app.post("/api/ordens-compra/:id/reprovar", async (req, res) => {
    try {
      const id = parseId(req.params.id);
      if (!id) return res.status(400).json({ message: "ID inválido" });
      const { nmAprovador, dsObservacao } = aprovarReprovarSchema.parse(req.body);
      const ordem = await storage.reprovarOrdemCompra(id, nmAprovador, dsObservacao);
      if (!ordem) {
        return res.status(404).json({ message: "Ordem de compra não encontrada" });
      }
      res.json(ordem);
    } catch (error: any) {
      console.error("Error rejecting ordem:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro ao reprovar ordem de compra" });
    }
  });

  app.get("/api/centros-custo", async (_req, res) => {
    try {
      const centros = await storage.getCentrosCusto();
      res.json(centros);
    } catch (error) {
      console.error("Error fetching centros de custo:", error);
      res.status(500).json({ message: "Erro ao buscar centros de custo" });
    }
  });

  app.post("/api/centros-custo", async (req, res) => {
    try {
      const validated = insertCentroCustoSchema.parse(req.body);
      const centro = await storage.createCentroCusto(validated);
      res.status(201).json(centro);
    } catch (error: any) {
      console.error("Error creating centro de custo:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro ao criar centro de custo" });
    }
  });

  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const { dtInicio, dtFim, cdCentroCusto } = req.query;
      const stats = await storage.getDashboardStats({
        dtInicio: dtInicio as string,
        dtFim: dtFim as string,
        cdCentroCusto: cdCentroCusto ? Number(cdCentroCusto) : undefined,
      });
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Erro ao buscar estatísticas" });
    }
  });

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  return httpServer;
}
