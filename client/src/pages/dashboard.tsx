import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, RefreshCw, Calendar, Building2, Clock, CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";
import type { OrdemCompra, CentroCusto } from "@shared/schema";

function formatCurrency(value: string | number): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(num);
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("pt-BR");
}

function formatTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

function OrdemCard({
  ordem,
  variant,
  isFirst = false,
}: {
  ordem: OrdemCompra;
  variant: "pendente" | "aprovada" | "reprovada";
  isFirst?: boolean;
}) {
  const bgClass =
    variant === "pendente"
      ? isFirst
        ? "bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700"
        : "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800"
      : variant === "aprovada"
        ? isFirst
          ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700"
          : "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800"
        : isFirst
          ? "bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-700"
          : "bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-800";

  const statusLabel =
    variant === "pendente"
      ? "AGUARDANDO APROVAÇÃO"
      : variant === "aprovada"
        ? "APROVADA"
        : "REPROVADA";

  const statusColor =
    variant === "pendente"
      ? "text-amber-700 dark:text-amber-400"
      : variant === "aprovada"
        ? "text-emerald-700 dark:text-emerald-400"
        : "text-red-700 dark:text-red-400";

  if (isFirst) {
    return (
      <div
        className={`p-4 rounded-lg border-2 ${bgClass} mb-4`}
        data-testid={`ordem-card-${ordem.nrSeqOrdemCompra}`}
      >
        <p className={`text-xs font-semibold uppercase tracking-wide ${statusColor}`}>
          {statusLabel}
        </p>
        <h3 className="text-xl font-bold mt-1" data-testid={`ordem-number-${ordem.nrSeqOrdemCompra}`}>
          OC #{ordem.nrSeqOrdemCompra}
        </h3>
        <p className="text-2xl font-bold mt-1" data-testid={`ordem-value-${ordem.nrSeqOrdemCompra}`}>
          {formatCurrency(ordem.vlOrdemCompra)}
        </p>
        <p className="text-sm font-semibold mt-2">{ordem.nmEstabelecimento}</p>
        <p className="text-sm text-muted-foreground">{ordem.dsCentroCusto}</p>
        <p className="text-xs text-muted-foreground mt-1">
          Liberação: {formatDate(ordem.dtLiberacao as any)} {ordem.hrLiberacao || formatTime(ordem.dtLiberacao as any)}
        </p>
        {ordem.nmAprovador && (
          <p className="text-xs text-muted-foreground mt-1">
            Aprovado por: <span className="font-medium">{ordem.nmAprovador}</span>
          </p>
        )}
      </div>
    );
  }

  return (
    <div
      className={`p-3 rounded-lg border ${bgClass} hover:shadow-sm transition-shadow`}
      data-testid={`ordem-card-${ordem.nrSeqOrdemCompra}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="font-bold text-sm" data-testid={`ordem-number-${ordem.nrSeqOrdemCompra}`}>
              OC #{ordem.nrSeqOrdemCompra}
            </span>
            <span className="text-sm font-semibold" data-testid={`ordem-value-${ordem.nrSeqOrdemCompra}`}>
              - {formatCurrency(ordem.vlOrdemCompra)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {ordem.nmEstabelecimento} — {ordem.dsCentroCusto}
          </p>
          <p className="text-xs text-muted-foreground">
            Liberação: {formatDate(ordem.dtLiberacao as any)} {ordem.hrLiberacao || formatTime(ordem.dtLiberacao as any)}
          </p>
          {ordem.nmAprovador && (
            <p className="text-xs text-muted-foreground">
              Aprovado por: <span className="font-medium">{ordem.nmAprovador}</span>
            </p>
          )}
        </div>
        <div
          className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${
            variant === "pendente"
              ? "bg-amber-500"
              : variant === "aprovada"
                ? "bg-emerald-500"
                : "bg-red-500"
          }`}
        />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [dtInicio, setDtInicio] = useState(getTodayString());
  const [dtFim, setDtFim] = useState(getTodayString());
  const [centroCusto, setCentroCusto] = useState("all");

  const filters = {
    dtInicio,
    dtFim,
    ...(centroCusto !== "all" ? { cdCentroCusto: centroCusto } : {}),
  };

  const queryString = new URLSearchParams(
    Object.entries(filters).filter(([, v]) => v !== undefined) as [string, string][]
  ).toString();

  const { data: pendentes = [], isLoading: loadingPendentes } = useQuery<OrdemCompra[]>({
    queryKey: ["/api/ordens-compra/pendentes", queryString],
    queryFn: async () => {
      const res = await fetch(`/api/ordens-compra/pendentes?${queryString}`);
      if (!res.ok) throw new Error("Failed to fetch pendentes");
      return res.json();
    },
  });

  const { data: aprovadas = [], isLoading: loadingAprovadas } = useQuery<OrdemCompra[]>({
    queryKey: ["/api/ordens-compra/aprovadas", queryString],
    queryFn: async () => {
      const res = await fetch(`/api/ordens-compra/aprovadas?${queryString}`);
      if (!res.ok) throw new Error("Failed to fetch aprovadas");
      return res.json();
    },
  });

  const { data: centrosCusto = [] } = useQuery<CentroCusto[]>({
    queryKey: ["/api/centros-custo"],
  });

  const { data: stats } = useQuery<{
    totalPendentes: number;
    totalAprovadas: number;
    valorTotalPendentes: number;
    valorTotalAprovadas: number;
  }>({
    queryKey: ["/api/dashboard/stats", queryString],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard/stats?${queryString}`);
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
  });

  const isLoading = loadingPendentes || loadingAprovadas;

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/ordens-compra/pendentes"] });
    queryClient.invalidateQueries({ queryKey: ["/api/ordens-compra/aprovadas"] });
    queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
  };

  return (
    <div className="min-h-screen bg-background" data-testid="dashboard-page">
      <header className="bg-[#1a5632] text-white shadow-md" data-testid="header">
        <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="w-6 h-6" />
            <span className="font-bold text-lg" data-testid="header-brand">Samel</span>
          </div>
          <h1 className="text-lg font-bold tracking-wide text-center flex-1" data-testid="header-title">
            PAINEL DE CONTROLE DAS ORDENS DE COMPRA
          </h1>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-white border-white/30 text-xs">
              v 2%
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10"
              onClick={handleRefresh}
              data-testid="button-refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto px-4 py-3" data-testid="filters-section">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Badge className="bg-amber-500 hover:bg-amber-500 text-white text-xs gap-1">
              <span className="w-2 h-2 bg-white rounded-full" />
              PENDENTES
            </Badge>
            <Badge className="bg-emerald-500 hover:bg-emerald-500 text-white text-xs gap-1">
              <span className="w-2 h-2 bg-white rounded-full" />
              APROVADAS
            </Badge>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <Input
                type="date"
                value={dtInicio}
                onChange={(e) => setDtInicio(e.target.value)}
                className="w-36 h-8 text-xs"
                data-testid="input-date-start"
              />
            </div>
            <span className="text-muted-foreground text-sm">até</span>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <Input
                type="date"
                value={dtFim}
                onChange={(e) => setDtFim(e.target.value)}
                className="w-36 h-8 text-xs"
                data-testid="input-date-end"
              />
            </div>
            <Select value={centroCusto} onValueChange={setCentroCusto}>
              <SelectTrigger className="w-48 h-8 text-xs" data-testid="select-centro-custo">
                <SelectValue placeholder="Todos os centros" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os centros</SelectItem>
                {centrosCusto.map((c) => (
                  <SelectItem key={c.id} value={String(c.cdCentroCusto)}>
                    {c.dsCentroCusto}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="border-amber-300 dark:border-amber-700 border-2" data-testid="card-pendentes">
            <CardHeader className="bg-amber-500 text-white rounded-t-lg py-3 px-4">
              <CardTitle className="text-center text-lg font-bold flex items-center justify-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Pendentes
              </CardTitle>
              <p className="text-center text-sm opacity-90" data-testid="text-total-pendentes">
                {pendentes.length} ordem(ns)
              </p>
            </CardHeader>
            <CardContent className="p-4">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                </div>
              ) : pendentes.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground" data-testid="empty-pendentes">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-400" />
                  <p className="font-medium">Nenhuma ordem pendente</p>
                  <p className="text-sm">Todas as ordens foram processadas</p>
                </div>
              ) : (
                <ScrollArea className="max-h-[calc(100vh-280px)]">
                  {pendentes.length > 0 && (
                    <OrdemCard
                      ordem={pendentes[0]}
                      variant="pendente"
                      isFirst
                    />
                  )}
                  {pendentes.length > 1 && (
                    <>
                      <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-2 mt-3">
                        Próximas
                      </p>
                      <div className="space-y-2">
                        {pendentes.slice(1).map((o) => (
                          <OrdemCard
                            key={o.id}
                            ordem={o}
                            variant="pendente"
                          />
                        ))}
                      </div>
                    </>
                  )}
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          <Card className="border-emerald-300 dark:border-emerald-700 border-2" data-testid="card-aprovadas">
            <CardHeader className="bg-emerald-500 text-white rounded-t-lg py-3 px-4">
              <CardTitle className="text-center text-lg font-bold flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Aprovadas
              </CardTitle>
              <p className="text-center text-sm opacity-90" data-testid="text-total-aprovadas">
                {aprovadas.length} ordem(ns)
              </p>
            </CardHeader>
            <CardContent className="p-4">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                </div>
              ) : aprovadas.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground" data-testid="empty-aprovadas">
                  <XCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                  <p className="font-medium">Nenhuma ordem aprovada</p>
                  <p className="text-sm">Nenhuma ordem aprovada neste período</p>
                </div>
              ) : (
                <ScrollArea className="max-h-[calc(100vh-280px)]">
                  {aprovadas.length > 0 && (
                    <OrdemCard
                      ordem={aprovadas[0]}
                      variant="aprovada"
                      isFirst
                    />
                  )}
                  {aprovadas.length > 1 && (
                    <>
                      <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide mb-2 mt-3">
                        Demais Aprovadas
                      </p>
                      <div className="space-y-2">
                        {aprovadas.slice(1).map((o) => (
                          <OrdemCard
                            key={o.id}
                            ordem={o}
                            variant="aprovada"
                          />
                        ))}
                      </div>
                    </>
                  )}
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
