import { useEffect, useState } from "react";
import KpiCard from "../ml-cards/KpiCard";
import ForecastTile from "../ml-cards/ForecastTile";
import OperatorRow, { OperatorItem } from "../ml-cards/OperatorRow";

const API = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api").replace(/\/$/, "");

type Tile = { orders?: number; confidence?: number };
type ForecastResponse = {
  today?: Tile;
  tomorrow?: Tile;
  this_week?: Tile;
  this_month?: Tile;
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

  // ---------- API helpers ----------
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
        headers: { "Cache-Control": "no-store" },
        signal: ctrl.signal,
      });
      clearTimeout(t);
      const j = await resp.json();
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

      // Normalisation de la barre "volume commandes" sur le max hebdo
      const maxOrders = Math.max(1, ...o.map((x) => x?.orders ?? 0));
      const oScaled: OperatorItem[] = o.map((x) => ({
        ...x,
        // barPct: largeur visuelle de la barre vs autres opérateurs (0–100)
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
  const overloadCount = ops.filter((o) => o.status === "surcharge").length;
  const overloadPct = ops.length ? Math.round((overloadCount / ops.length) * 100) : 0;
  const overloadSub = ops.length ? `${overloadCount}/${ops.length} opérateurs` : undefined;

  const snapshot = forecast?.metadata?.snapshot_at
    ? new Date(forecast.metadata.snapshot_at).toLocaleDateString("fr-FR")
    : "";

  return (
    <div className="space-y-6">
      {/* En-tête + actions à droite */}
      <section className="rounded-2xl border bg-white">
        <div className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">Gestion des Commandes</h1>
            <p className="text-muted-foreground">Analyse et prévision des volumes de commandes</p>
          </div>

          {/* Actions à droite : Lancer une nouvelle prévisions + Upload & Réentraîner */}
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <button
              onClick={refreshAll}
              className="px-3 py-1.5 rounded-md border hover:bg-gray-50"
              disabled={loading}
              title="Rafraîchir les prévisions et KPIs"
            >
              Lancer une nouvelle prévisions
            </button>

            <div className="flex items-center gap-2">
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="text-sm"
              />
              <button
                onClick={handleRetrain}
                disabled={!file || isTraining}
                className="px-3 py-1.5 rounded-md border hover:bg-gray-50 disabled:opacity-50"
                title="Réentraînement du modèle à partir du CSV"
              >
                {isTraining ? "Réentraînement..." : "Réentraîner"}
              </button>
            </div>
          </div>
        </div>

        {/* KPIs en grille */}
        <div className="border-t p-4">
          {loading ? (
            <div className="text-sm text-gray-500">Chargement…</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard title="Commandes du jour" value={fmt(kpi.day_orders)} />
              <KpiCard title="Commandes de la semaine" value={fmt(kpi.week_orders)} />
              <KpiCard title="Opérateurs en surcharge" value={`${overloadPct}%`} sub={overloadSub} />
              <KpiCard title="Temps moyen picking" value="12.4 min" sub="(dernière mesure)" />
            </div>
          )}
          {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
        </div>
      </section>

      {/* === Disposition 2 colonnes : Gauche = Charge opérateurs / Droite = Prévisions === */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Colonne gauche : Charge opérateurs */}
        <div className="rounded-2xl border bg-white">
          <div className="p-4">
            <div className="text-sm text-gray-500 mb-1">Charge des opérateurs</div>
            <div className="text-xs text-gray-400 mb-3">
              Comparaison réel vs prédit (réel &lt; prédit ⇒ surcharge)
            </div>

            {loading ? (
              <div className="text-sm text-gray-500">Chargement…</div>
            ) : ops.length === 0 ? (
              <div className="text-sm text-gray-500">Aucun opérateur trouvé pour la période.</div>
            ) : (
              <div className="space-y-4">
                {ops.map((it, idx) => (
                  <OperatorRow key={`${it.name}-${idx}`} item={it} />
                ))}
              </div>
            )}

            {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
          </div>
        </div>

        {/* Colonne droite : Prévisions */}
        <div className="rounded-2xl border bg-white">
          <div className="p-4">
            <div className="text-sm text-gray-500 mb-3">Prévisions</div>

            {loading ? (
              <div className="text-sm text-gray-500">Chargement…</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ForecastTile title="Aujourd’hui" value={forecast?.today?.orders} conf={forecast?.today?.confidence} />
                <ForecastTile title="Demain" value={forecast?.tomorrow?.orders} conf={forecast?.tomorrow?.confidence} />
                <ForecastTile title="Cette semaine" value={forecast?.this_week?.orders} conf={forecast?.this_week?.confidence} />
                <ForecastTile title="Ce mois" value={forecast?.this_month?.orders} conf={forecast?.this_month?.confidence} />
              </div>
            )}

            {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
          </div>
        </div>
      </section>
    </div>
  );
}
