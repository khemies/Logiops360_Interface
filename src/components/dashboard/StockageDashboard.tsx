import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Warehouse, 
  Package, 
  TrendingUp, 
  MapPin, 
  AlertTriangle,
  RefreshCw,
  BarChart3,
  Search
} from "lucide-react";

const stockageStats = [
  {
    title: "Taux d'occupation",
    value: "87.3%",
    change: "+2.1%",
    icon: Warehouse,
    color: "text-success"
  },
  {
    title: "Emplacements actifs", 
    value: "2,847",
    change: "+12",
    icon: MapPin,
    color: "text-primary"
  },
  {
    title: "Produits différents",
    value: "8,945",
    change: "+127",
    icon: Package,
    color: "text-success"
  },
  {
    title: "Rotations/jour",
    value: "156",
    change: "-3.2%",
    icon: RefreshCw,
    color: "text-warning"
  }
];

const zones = [
  { nom: "Zone A - Fast Moving", occupation: 95, emplacements: 450, type: "haute_rotation", alert: true },
  { nom: "Zone B - Medium", occupation: 78, emplacements: 650, type: "moyenne_rotation", alert: false },
  { nom: "Zone C - Slow Moving", occupation: 62, emplacements: 890, type: "basse_rotation", alert: false },
  { nom: "Zone D - Réserve", occupation: 45, emplacements: 1200, type: "reserve", alert: false }
];

const optimisations = [
  {
    type: "Slotting",
    description: "Repositionner 47 produits haute rotation",
    economie: "2.3h/jour",
    priorite: "haute"
  },
  {
    type: "Réassort",
    description: "14 références en rupture prévue",
    economie: "Éviter rupture",
    priorite: "critique"
  },
  {
    type: "Clustering",
    description: "Regrouper produits complémentaires",
    economie: "1.8h/jour",
    priorite: "moyenne"
  }
];

const emplacementsCritiques = [
  { emplacement: "A12-05", produit: "REF-001", probleme: "Surcharge", capacite: 120 },
  { emplacement: "B08-12", produit: "REF-156", probleme: "Rupture prévue", capacite: 0 },
  { emplacement: "C15-07", produit: "REF-289", probleme: "Mauvais slotting", capacite: 45 },
  { emplacement: "A05-23", produit: "REF-078", probleme: "Accès difficile", capacite: 78 }
];

export const StockageDashboard = () => {
  return (
    <div className="space-y-6 p-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary">Gestion du Stockage</h1>
          <p className="text-muted-foreground">Optimisation de l'entrepôt et slotting intelligent</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Search className="h-4 w-4 mr-2" />
            Chercher produit
          </Button>
          <Button size="sm">
            Optimiser slotting
          </Button>
        </div>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stockageStats.map((stat, index) => (
          <Card key={index} className="transition-all duration-300 hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stat.value}</div>
              <div className={`text-xs flex items-center mt-1 ${stat.color}`}>
                <TrendingUp className="h-3 w-3 mr-1" />
                {stat.change} vs hier
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Occupation par zones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5" />
              <span>Occupation par zones</span>
            </CardTitle>
            <CardDescription>
              État en temps réel de l'entrepôt
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {zones.map((zone, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{zone.nom}</span>
                    {zone.alert && (
                      <Badge variant="destructive">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Critique
                      </Badge>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {zone.emplacements} empl.
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Progress 
                    value={zone.occupation} 
                    className="flex-1 h-2"
                  />
                  <span className="text-sm font-medium w-12">{zone.occupation}%</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Optimisations recommandées */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Optimisations IA</span>
            </CardTitle>
            <CardDescription>
              Recommandations KMeans + heuristiques
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {optimisations.map((opt, index) => (
              <div key={index} className="p-3 border rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-medium">{opt.type}</div>
                    <div className="text-sm text-muted-foreground">{opt.description}</div>
                  </div>
                  <Badge 
                    variant={
                      opt.priorite === "critique" ? "destructive" :
                      opt.priorite === "haute" ? "default" : "secondary"
                    }
                  >
                    {opt.priorite}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-success">
                    Économie: {opt.economie}
                  </span>
                  <Button size="sm" variant="outline">
                    Appliquer
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Emplacements critiques */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5" />
            <span>Emplacements nécessitant attention</span>
          </CardTitle>
          <CardDescription>
            Analyse unified_storage_view + clean_storage_location
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {emplacementsCritiques.map((emp, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="font-mono text-sm bg-muted px-2 py-1 rounded">
                    {emp.emplacement}
                  </div>
                  <div>
                    <div className="font-medium">{emp.produit}</div>
                    <div className="text-sm text-muted-foreground">{emp.probleme}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Capacité</div>
                    <div className="font-medium">{emp.capacite}%</div>
                  </div>
                  <Button size="sm" variant="outline">
                    Corriger
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Schéma de l'entrepôt */}
      <Card>
        <CardHeader>
          <CardTitle>Plan de l'entrepôt</CardTitle>
          <CardDescription>
            Visualisation interactive des zones et emplacements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
            <div className="text-center">
              <Warehouse className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Schéma interactif de l'entrepôt</p>
              <p className="text-sm">Visualisation SVG/Canvas avec données clean_storage_location</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};