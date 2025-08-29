import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Truck, 
  Clock, 
  TrendingUp, 
  MapPin, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  Route
} from "lucide-react";

const transportStats = [
  {
    title: "Livraisons en cours",
    value: "342",
    change: "-5.2%",
    icon: Truck,
    color: "text-primary"
  },
  {
    title: "ETA moyen respecté",
    value: "91.5%",
    change: "+2.8%",
    icon: Clock,
    color: "text-success"
  },
  {
    title: "Transporteurs actifs",
    value: "18",
    change: "+2",
    icon: Route,
    color: "text-primary"
  },
  {
    title: "Anomalies détectées",
    value: "7",
    change: "-12",
    icon: AlertTriangle,
    color: "text-success"
  }
];

const livraisons = [
  {
    id: "TRK-001",
    transporteur: "Express Logistic",
    destination: "Paris 15ème",
    eta: "14:30",
    retard: 0,
    statut: "en_temps",
    colis: 15
  },
  {
    id: "TRK-002", 
    transporteur: "Rapid Transport",
    destination: "Lyon Centre",
    eta: "16:45",
    retard: 25,
    statut: "retard",
    colis: 23
  },
  {
    id: "TRK-003",
    transporteur: "Swift Delivery",
    destination: "Marseille Nord",
    eta: "18:15",
    retard: -10,
    statut: "avance",
    colis: 8
  },
  {
    id: "TRK-004",
    transporteur: "Express Logistic", 
    destination: "Toulouse",
    eta: "19:30",
    retard: 45,
    statut: "retard_critique",
    colis: 31
  }
];

const transporteurs = [
  {
    nom: "Express Logistic",
    fiabilite: 94.2,
    cout: "€€",
    livraisons: 45,
    retards: 2
  },
  {
    nom: "Rapid Transport",
    fiabilite: 88.7,
    cout: "€",
    livraisons: 38,
    retards: 5
  },
  {
    nom: "Swift Delivery",
    fiabilite: 96.1,
    cout: "€€€",
    livraisons: 28,
    retards: 1
  },
  {
    nom: "Eco Transport",
    fiabilite: 85.3,
    cout: "€",
    livraisons: 52,
    retards: 8
  }
];

const anomalies = [
  {
    type: "Retard inhabituel",
    transporteur: "Rapid Transport",
    impact: "23 commandes",
    severite: "haute"
  },
  {
    type: "Changement d'itinéraire",
    transporteur: "Express Logistic",
    impact: "5 commandes",
    severite: "moyenne"
  },
  {
    type: "Problème véhicule",
    transporteur: "Eco Transport",
    impact: "12 commandes",
    severite: "haute"
  }
];

export const TransportDashboard = () => {
  const getStatutColor = (statut: string) => {
    switch (statut) {
      case "en_temps": return "default";
      case "avance": return "default"; 
      case "retard": return "destructive";
      case "retard_critique": return "destructive";
      default: return "secondary";
    }
  };

  const getStatutIcon = (statut: string) => {
    switch (statut) {
      case "en_temps": return <CheckCircle className="h-3 w-3" />;
      case "avance": return <CheckCircle className="h-3 w-3" />;
      case "retard": return <Clock className="h-3 w-3" />;
      case "retard_critique": return <XCircle className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary">Gestion du Transport</h1>
          <p className="text-muted-foreground">Suivi ETA et optimisation transporteurs</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analyser retards
          </Button>
          <Button size="sm">
            Optimiser routes
          </Button>
        </div>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {transportStats.map((stat, index) => (
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
        {/* Livraisons en cours */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Truck className="h-5 w-5" />
              <span>Livraisons en temps réel</span>
            </CardTitle>
            <CardDescription>
              Suivi ETA avec prédictions XGBoost
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {livraisons.map((liv, index) => (
              <div key={index} className="p-3 border rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-sm">{liv.id}</span>
                      <Badge variant={getStatutColor(liv.statut)}>
                        {getStatutIcon(liv.statut)}
                        {liv.statut.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {liv.transporteur} → {liv.destination}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{liv.eta}</div>
                    <div className="text-sm text-muted-foreground">{liv.colis} colis</div>
                  </div>
                </div>
                {liv.retard !== 0 && (
                  <div className={`text-xs ${liv.retard > 0 ? 'text-destructive' : 'text-success'}`}>
                    {liv.retard > 0 ? '+' : ''}{liv.retard} min
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Performance transporteurs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Route className="h-5 w-5" />
              <span>Performance transporteurs</span>
            </CardTitle>
            <CardDescription>
              Algorithme de recommandation multicritère
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {transporteurs.map((trans, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{trans.nom}</span>
                    <Badge variant="outline">{trans.cout}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {trans.livraisons} livraisons
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-muted-foreground w-16">Fiabilité</span>
                  <Progress 
                    value={trans.fiabilite} 
                    className="flex-1 h-2"
                  />
                  <span className="text-sm font-medium w-12">{trans.fiabilite}%</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {trans.retards} retards ce mois
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Anomalies détectées */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5" />
            <span>Anomalies détectées</span>
          </CardTitle>
          <CardDescription>
            Isolation Forest + autoencoder pour détection proactive
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {anomalies.map((anom, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <Badge 
                    variant={anom.severite === "haute" ? "destructive" : "default"}
                  >
                    {anom.severite}
                  </Badge>
                  <div>
                    <div className="font-medium">{anom.type}</div>
                    <div className="text-sm text-muted-foreground">
                      {anom.transporteur} • {anom.impact}
                    </div>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  Analyser
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Carte des livraisons */}
      <Card>
        <CardHeader>
          <CardTitle>Suivi géographique des livraisons</CardTitle>
          <CardDescription>
            Localisation temps réel et optimisation des routes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
            <div className="text-center">
              <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Carte interactive des livraisons</p>
              <p className="text-sm">Intégration avec données shipments + shipment_events</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};