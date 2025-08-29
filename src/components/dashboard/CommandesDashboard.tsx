import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Package, 
  TrendingUp, 
  Users, 
  Clock, 
  AlertCircle,
  CheckCircle,
  BarChart3
} from "lucide-react";

const commandesStats = [
  {
    title: "Commandes en attente",
    value: "347",
    change: "+15.2%",
    icon: Clock,
    color: "text-warning"
  },
  {
    title: "Commandes traitées",
    value: "1,289",
    change: "+8.7%", 
    icon: CheckCircle,
    color: "text-success"
  },
  {
    title: "Charge opérateurs",
    value: "78%",
    change: "+3.1%",
    icon: Users,
    color: "text-primary"
  },
  {
    title: "Temps moyen picking",
    value: "12.4min",
    change: "-2.3%",
    icon: Package,
    color: "text-success"
  }
];

const operateurs = [
  { nom: "Marie Dubois", zone: "A", charge: 85, commandes: 47, status: "active" },
  { nom: "Jean Martin", zone: "B", charge: 92, commandes: 52, status: "surcharge" },
  { nom: "Sophie Chen", zone: "C", charge: 73, commandes: 38, status: "active" },
  { nom: "Pierre Durand", zone: "A", charge: 68, commandes: 34, status: "active" },
  { nom: "Anna Kowalski", zone: "B", charge: 95, commandes: 55, status: "surcharge" }
];

const previsions = [
  { periode: "Prochaine heure", volume: 156, confiance: 94 },
  { periode: "Fin de journée", volume: 892, confiance: 87 },
  { periode: "Demain", volume: 1247, confiance: 82 },
  { periode: "Cette semaine", volume: 6834, confiance: 76 }
];

export const CommandesDashboard = () => {
  return (
    <div className="space-y-6 p-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary">Gestion des Commandes</h1>
          <p className="text-muted-foreground">Analyse et prévision des volumes de commandes</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <BarChart3 className="h-4 w-4 mr-2" />
            Rapport
          </Button>
          <Button size="sm">
            Optimiser les vagues
          </Button>
        </div>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {commandesStats.map((stat, index) => (
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
        {/* Charge par opérateur */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Charge des opérateurs</span>
            </CardTitle>
            <CardDescription>
              Répartition en temps réel des commandes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {operateurs.map((op, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{op.nom}</span>
                    <Badge variant="outline">Zone {op.zone}</Badge>
                    <Badge 
                      variant={op.status === "surcharge" ? "destructive" : "default"}
                    >
                      {op.status === "surcharge" ? <AlertCircle className="h-3 w-3 mr-1" /> : <CheckCircle className="h-3 w-3 mr-1" />}
                      {op.status}
                    </Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {op.commandes} commandes
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Progress 
                    value={op.charge} 
                    className="flex-1 h-2"
                    style={{
                      background: op.charge > 90 ? 'var(--destructive)' : 
                                 op.charge > 80 ? 'var(--warning)' : 'var(--success)'
                    }}
                  />
                  <span className="text-sm font-medium w-12">{op.charge}%</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Prévisions IA */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Prévisions de volume</span>
            </CardTitle>
            <CardDescription>
              Algorithmes XGBoost et Prophet
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {previsions.map((prev, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">{prev.periode}</div>
                  <div className="text-sm text-muted-foreground">
                    Confiance: {prev.confiance}%
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">{prev.volume}</div>
                  <div className="text-sm text-muted-foreground">commandes</div>
                </div>
              </div>
            ))}
            <Button className="w-full mt-4">
              Lancer nouvelle prévision
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Graphique d'évolution */}
      <Card>
        <CardHeader>
          <CardTitle>Évolution des volumes de commandes</CardTitle>
          <CardDescription>
            Historique et tendances sur les 7 derniers jours
          </CardDescription>
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
};