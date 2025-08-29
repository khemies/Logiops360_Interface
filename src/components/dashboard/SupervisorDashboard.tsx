import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  Package, 
  Warehouse, 
  Truck, 
  Users, 
  AlertTriangle,
  Bot,
  BarChart3,
  Zap
} from "lucide-react";

const kpiData = [
  {
    title: "Commandes du jour",
    value: "1,247",
    change: "+12.5%",
    trend: "up",
    icon: Package,
    color: "text-success"
  },
  {
    title: "Taux de remplissage",
    value: "87.3%",
    change: "+2.1%",
    trend: "up",
    icon: Warehouse,
    color: "text-success"
  },
  {
    title: "Livraisons en cours",
    value: "342",
    change: "-5.2%",
    trend: "down", 
    icon: Truck,
    color: "text-warning"
  },
  {
    title: "Opérateurs actifs",
    value: "156",
    change: "+3.8%",
    trend: "up",
    icon: Users,
    color: "text-success"
  }
];

const aiModels = [
  {
    name: "Prévision de demande",
    endpoint: "/forecast-demand",
    status: "active",
    lastRun: "Il y a 2h",
    accuracy: "94.2%"
  },
  {
    name: "Optimisation slotting",
    endpoint: "/optimize-slotting", 
    status: "ready",
    lastRun: "Il y a 6h",
    accuracy: "89.7%"
  },
  {
    name: "Prédiction ETA",
    endpoint: "/predict-eta",
    status: "active",
    lastRun: "Il y a 15min",
    accuracy: "91.5%"
  },
  {
    name: "Détection d'anomalies",
    endpoint: "/detect-anomalies",
    status: "alert",
    lastRun: "Il y a 30min",
    accuracy: "96.1%"
  }
];

const alerts = [
  {
    type: "warning",
    message: "Retard de livraison détecté pour 12 commandes",
    time: "Il y a 5min"
  },
  {
    type: "info",
    message: "Nouveau lot de produits A247 arrivé en entrepôt",
    time: "Il y a 15min"
  },
  {
    type: "error",
    message: "Anomalie détectée en zone de picking C",
    time: "Il y a 25min"
  }
];

export const SupervisorDashboard = () => {
  const handleTriggerAI = (endpoint: string) => {
    console.log(`Déclenchement du modèle IA: ${endpoint}`);
    // Ici, on ferait l'appel API vers le microservice
  };

  return (
    <div className="space-y-6 p-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary">Dashboard Superviseur</h1>
          <p className="text-muted-foreground">Vue d'ensemble de la chaîne logistique</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <BarChart3 className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button size="sm">
            <Zap className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* KPIs principaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((kpi, index) => (
          <Card key={index} className="transition-all duration-300 hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {kpi.title}
              </CardTitle>
              <kpi.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{kpi.value}</div>
              <div className={`text-xs flex items-center mt-1 ${kpi.color}`}>
                <TrendingUp className="h-3 w-3 mr-1" />
                {kpi.change} depuis hier
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Modèles IA */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bot className="h-5 w-5" />
              <span>Modèles IA</span>
            </CardTitle>
            <CardDescription>
              Déclenchement et monitoring des algorithmes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {aiModels.map((model, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium">{model.name}</h4>
                    <Badge 
                      variant={
                        model.status === "active" ? "default" :
                        model.status === "alert" ? "destructive" : "secondary"
                      }
                    >
                      {model.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Précision: {model.accuracy} • {model.lastRun}
                  </div>
                  <Progress 
                    value={parseFloat(model.accuracy)} 
                    className="mt-2 h-2"
                  />
                </div>
                <Button 
                  size="sm" 
                  onClick={() => handleTriggerAI(model.endpoint)}
                  className="ml-4"
                >
                  Déclencher
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Alertes et notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5" />
              <span>Alertes en temps réel</span>
            </CardTitle>
            <CardDescription>
              Notifications importantes de la supply chain
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.map((alert, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  alert.type === "error" ? "bg-destructive" :
                  alert.type === "warning" ? "bg-warning" : "bg-secondary"
                }`} />
                <div className="flex-1">
                  <p className="text-sm font-medium">{alert.message}</p>
                  <p className="text-xs text-muted-foreground">{alert.time}</p>
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full mt-4">
              Voir toutes les alertes
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques de performance */}
      <Card>
        <CardHeader>
          <CardTitle>Performance de la chaîne logistique</CardTitle>
          <CardDescription>
            Métriques clés sur les dernières 24h
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Graphiques de performance</p>
              <p className="text-sm">Intégration avec Plotly/Chart.js à venir</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};