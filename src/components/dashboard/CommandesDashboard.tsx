import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Package, TrendingUp, Users, Clock, AlertCircle, CheckCircle, BarChart3, Upload } from "lucide-react";
import OperatorRow, { OperatorItem } from "../ml-cards/OperatorRow"; // RESTAURE : composant d'origine
import ForecastTile from "../ml-cards/ForecastTile";

const API = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api").replace(/\/$/, "");

// ---------- Types ----------
type Tile = { orders?: number; confidence?: number };
type ForecastResponse = {
  today?: Tile; tomorrow?: Tile; this_week?: Tile; this_month?: Tile;
  metadata?: { model_version?: number | string; trained_at?: string; snapshot_at?: string };
};

export default function CommandesDashboard() {
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [kpi, setKpi] = useState<{ day_orders?: number; week_orders?: number; avg_operator_load?: number }>({});
  const [ops, setOps] = useState<OperatorItem[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [isTraining, setIsTraining] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ---------- API helpers (inchangés côté logique) ----------
  const fetchForecast = async () => {
    const r = await fetch(`${API}/forecast?t=${Date.now()}`, { cache: "no-store" as RequestCache });
    const j = await r.json();
    if (!r.ok) throw new Error(j?.error || `GET /forecast ${r.status}`);
    return j as ForecastResponse;
  };
  const fetchKpi = async () => {
    const r = await fetch(`${API}/kpi/orders_summary?t=${Date.now()}`, { cache: "no-store" as RequestCache });
    const j = await r.json();
    if (!r.ok) throw new Error(j?.error || `GET /kpi/orders_summary ${r.status}`);
    return j as { day_orders?: number; week_orders?: number; avg_operator_load?: number };
  };
  const fetchOps = async () => {
    const r = await fetch(`${API}/operators/load_status?t=${Date.now()}`, { cache: "no-store" as RequestCache });
    const j = await r.json();
    if (!r.ok) throw new Error(j?.error || `GET /operators/load_status ${r.status}`);
    return (j.items ?? []) as OperatorItem[];
  };
  const uploadAndRetrain = async (f: File) => {
    const fd = new FormData();
    fd.append("file", f, f.name);
    // Timeout de sécurité (15 min)
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 15 * 60 * 1000);
    try {
      const resp = await fetch(`${API}/orders/upload`, {
        method: "POST",
        body: fd,
        //headers: { "Cache-Control": "no-store" },
        signal: ctrl.signal,
      });
      clearTimeout(t);
      const j = await resp.json();
      console.log("Réponse upload:", resp.status, j);   // <--- AJOUT
      if (!resp.ok) throw new Error(j?.error || `POST /orders/upload ${resp.status}`);
      return j;
    } catch (e) {
      throw e;
    }
  };

  const refreshAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [f, k, o] = await Promise.all([fetchForecast(), fetchKpi(), fetchOps()]);
      // Normalisation de la barre sur le max hebdo (inchangé)
      const maxOrders = Math.max(1, ...o.map((x) => x?.orders ?? 0));
      const oScaled: OperatorItem[] = o.map((x) => ({
        ...x,
        // barPct: largeur visuelle de la barre vs autres opérateurs (0–100)
        // @ts-ignore: propriété auxiliaire pour l'affichage
        barPct: Math.round(((x?.orders ?? 0) / maxOrders) * 100),
      }));
      setForecast(f);
      setKpi(k);
      setOps(oScaled);
    } catch (e: any) {
      setError(e?.message || "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRetrain = async () => {
    if (!file) return;
    setIsTraining(true);
    setError(null);
    try {
      await uploadAndRetrain(file);
      await refreshAll(); // recharge les nouvelles sorties du modèle
    } catch (e: any) {
      setError(e?.message || "Réentraînement impossible");
    } finally {
      setIsTraining(false);
    }
  };
  const fmt = (n?: number) => (typeof n === "number" ? n.toLocaleString("fr-FR") : "—");

  // % d'opérateurs en surcharge (basé sur ops/status)
  const overloadCount = ops.filter((o: any) => o.status === "surcharge").length;
  const overloadPct = ops.length ? Math.round((overloadCount / ops.length) * 100) : 0;
  const overloadSub = ops.length ? `${overloadCount}/${ops.length} opérateurs` : undefined;
  const snapshot = forecast?.metadata?.snapshot_at ? new Date(forecast.metadata.snapshot_at).toLocaleDateString("fr-FR") : "";

  // Cartes KPI (style unifié shadcn/ui)
  const kpiCards = [
    { title: "Commandes du jour", value: fmt(kpi.day_orders), change: undefined, icon: Clock, color: "text-warning" },
    { title: "Commandes de la semaine", value: fmt(kpi.week_orders), change: undefined, icon: Package, color: "text-success" },
    { title: "Opérateurs en surcharge", value: `${overloadPct}%`, change: overloadSub, icon: Users, color: "text-primary" },
    { title: "Temps moyen picking", value: "12.4 min", change: "(dernière mesure)", icon: TrendingUp, color: "text-success" },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary">Gestion des Commandes</h1>
          <p className="text-muted-foreground">Analyse et prévision des volumes de commandes</p>
          {snapshot && (
            <p className="text-xs text-muted-foreground mt-1">Snapshot: {snapshot}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2 justify-end items-center">
          <Button variant="outline" size="sm">
            <BarChart3 className="h-4 w-4 mr-2" /> Rapport
          </Button>
          <Button size="sm" onClick={refreshAll} disabled={loading}>
            Lancer nouvelle prévision
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <Button size="sm" onClick={handleRetrain} disabled={!file || isTraining}>
            {isTraining ? "Réentraînement…" : "Réentraîner"}
          </Button>
        </div>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((stat, index) => (
          <Card key={index} className="transition-all duration-300 hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stat.value}</div>
              {stat.change ? (
                <div className={`text-xs flex items-center mt-1 ${stat.color}`}>
                  <TrendingUp className="h-3 w-3 mr-1" /> {stat.change}
                </div>
              ) : (
                <div className="text-xs mt-1 text-muted-foreground">—</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* === Disposition 2 colonnes : Gauche = Charge opérateurs / Droite = Prévisions === */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Charge par opérateur (GAUCHE) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Charge des opérateurs</span>
            </CardTitle>
            <CardDescription>Répartition en temps réel des commandes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="text-sm text-muted-foreground">Chargement…</div>
            ) : ops.length === 0 ? (
              <div className="text-sm text-muted-foreground">Aucun opérateur trouvé pour la période.</div>
            ) : (
              <div className="space-y-4">
                {ops.map((it: any, idx: number) => (
                  <OperatorRow key={`${it?.name ?? 'op'}-${idx}`} item={it} />
                ))}
              </div>
            )}
            {error && <div className="text-sm text-red-600">{error}</div>}
          </CardContent>
        </Card>

        {/* Prévisions IA (DROITE) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Prévisions de volume</span>
            </CardTitle>
            <CardDescription>
              Algorithmes internes (v{forecast?.metadata?.model_version ?? '—'})
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="text-sm text-muted-foreground">Chargement…</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ForecastTile title="Aujourd’hui" value={forecast?.today?.orders} conf={forecast?.today?.confidence} />
                <ForecastTile title="Demain" value={forecast?.tomorrow?.orders} conf={forecast?.tomorrow?.confidence} />
                <ForecastTile title="Cette semaine" value={forecast?.this_week?.orders} conf={forecast?.this_week?.confidence} />
                <ForecastTile title="Ce mois" value={forecast?.this_month?.orders} conf={forecast?.this_month?.confidence} />
              </div>
            )}
            <Button className="w-full mt-1" onClick={refreshAll} disabled={loading}>
              Lancer nouvelle prévision
            </Button>
            {error && <div className="text-sm text-red-600">{error}</div>}
          </CardContent>
        </Card>
      </div>

      {/* Graphique d'évolution (placeholder comme l'exemple) */}
      <Card>
        <CardHeader>
          <CardTitle>Évolution des volumes de commandes</CardTitle>
          <CardDescription>Historique et tendances sur les 7 derniers jours</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Graphique d'évolution des commandes</p>
              <p className="text-sm">Intégration API clean_customer_orders + visualization</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
