import { useState } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { Navbar } from "@/components/layout/Navbar";
import { SupervisorDashboard } from "@/components/dashboard/SupervisorDashboard";
import { CommandesDashboard } from "@/components/dashboard/CommandesDashboard";
import { StockageDashboard } from "@/components/dashboard/StockageDashboard";
import { TransportDashboard } from "@/components/dashboard/TransportDashboard";

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState<string>("");
  const [currentView, setCurrentView] = useState("dashboard");

  const handleLogin = (profile: string) => {
    setUserProfile(profile);
    setIsAuthenticated(true);
    setCurrentView("dashboard");
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserProfile("");
    setCurrentView("dashboard");
  };

  const renderDashboard = () => {
    if (currentView === "dashboard") {
      return userProfile === "superviseur" ? 
        <SupervisorDashboard /> : 
        renderSpecializedDashboard();
    }
    
    switch (currentView) {
      case "commandes":
        return <CommandesDashboard />;
      case "stockage":
        return <StockageDashboard />;
      case "transport":
        return <TransportDashboard />;
      default:
        return renderSpecializedDashboard();
    }
  };

  const renderSpecializedDashboard = () => {
    switch (userProfile) {
      case "commande":
        return <CommandesDashboard />;
      case "stockage":
        return <StockageDashboard />;
      case "transport":
        return <TransportDashboard />;
      default:
        return <SupervisorDashboard />;
    }
  };

  if (!isAuthenticated) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar 
        currentProfile={userProfile}
        currentView={currentView}
        onViewChange={setCurrentView}
        onLogout={handleLogout}
      />
      <main>
        {renderDashboard()}
      </main>
    </div>
  );
};

export default Index;
