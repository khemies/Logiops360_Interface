import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

interface LoginFormProps {
  onLogin: (profile: string) => void;
}

const profileOptions = [
  { value: "commande", label: "Gestionnaire Commande" },
  { value: "stockage", label: "Gestionnaire Stockage" },
  { value: "transport", label: "Gestionnaire Transport" },
  { value: "superviseur", label: "Superviseur" }
];

export const LoginForm = ({ onLogin }: LoginFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [profile, setProfile] = useState("");
  const [nom, setNom] = useState("");
  const { toast } = useToast();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !profile) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive"
      });
      return;
    }
    
    // Simulation de connexion
    onLogin(profile);
    toast({
      title: "Connexion réussie",
      description: `Bienvenue dans LogiOps`,
      variant: "default"
    });
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !nom || !profile) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive"
      });
      return;
    }

    // Simulation de création de compte
    onLogin(profile);
    toast({
      title: "Compte créé avec succès",
      description: `Bienvenue dans LogiOps, ${nom}`,
      variant: "default"
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" 
         style={{ background: 'var(--gradient-bg)' }}>
      <Card className="w-full max-w-md" style={{ boxShadow: 'var(--shadow-elegant)' }}>
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">LogiOps</CardTitle>
          <CardDescription className="text-lg">
            Gestion intelligente de la supply chain
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Connexion</TabsTrigger>
              <TabsTrigger value="signup">Créer un compte</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="profile">Profil</Label>
                  <Select value={profile} onValueChange={setProfile}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez votre profil" />
                    </SelectTrigger>
                    <SelectContent>
                      {profileOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Button type="submit" className="w-full">
                  Se connecter
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nom">Nom complet</Label>
                  <Input
                    id="nom"
                    placeholder="Votre nom"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Mot de passe</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-profile">Profil</Label>
                  <Select value={profile} onValueChange={setProfile}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez votre profil" />
                    </SelectTrigger>
                    <SelectContent>
                      {profileOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Button type="submit" className="w-full">
                  Créer un compte
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};