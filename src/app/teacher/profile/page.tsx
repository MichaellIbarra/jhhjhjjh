
"use client";

import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { User, Mail, Shield, Briefcase, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function TeacherProfilePage() { // Renamed
  const { currentUser, isAuthLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthLoading && (!currentUser || currentUser.role === 'superuser')) {
      if (currentUser && currentUser.role === 'superuser') {
        router.push('/admin/profile'); // Redirect superusers to their profile
      } else {
        router.push('/login');
      }
    }
  }, [currentUser, isAuthLoading, router]);

  if (isAuthLoading || !currentUser) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (currentUser.role === 'superuser') {
    return (
      <DashboardLayout>
            <div className="flex items-center justify-center h-full">
                <p>Redirigiendo...</p> 
            </div>
        </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-lg rounded-xl overflow-hidden">
          <CardHeader className="items-center text-center bg-muted/30 p-8">
            <Avatar className="h-28 w-28 mb-4 border-4 border-primary shadow-md">
              <AvatarImage 
                src={`https://picsum.photos/seed/${currentUser.avatarSeed || currentUser.email}/120/120`} 
                alt={currentUser.name}
                data-ai-hint="profile large"
              />
              <AvatarFallback className="text-4xl bg-primary/20 text-primary font-semibold">
                {currentUser.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <CardTitle className="text-3xl font-bold text-primary">{currentUser.name}</CardTitle>
            <CardDescription className="text-lg text-muted-foreground">
              Usuario Normal (Profesor/Staff)
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 md:p-8 space-y-6">
            <div className="flex items-start space-x-4 p-4 bg-background border border-border rounded-lg shadow-sm">
              <User className="h-7 w-7 text-primary mt-1" />
              <div>
                <p className="text-xs text-muted-foreground font-medium">Nombre Completo</p>
                <p className="font-semibold text-lg text-foreground">{currentUser.name}</p>
              </div>
            </div>
            <div className="flex items-start space-x-4 p-4 bg-background border border-border rounded-lg shadow-sm">
              <Mail className="h-7 w-7 text-primary mt-1" />
              <div>
                <p className="text-xs text-muted-foreground font-medium">Correo Electrónico</p>
                <p className="font-semibold text-lg text-foreground">{currentUser.email}</p>
              </div>
            </div>
            <div className="flex items-start space-x-4 p-4 bg-background border border-border rounded-lg shadow-sm">
              <Shield className="h-7 w-7 text-primary mt-1" />
              <div>
                <p className="text-xs text-muted-foreground font-medium">Rol</p>
                <p className="font-semibold text-lg text-foreground">Usuario Normal</p>
              </div>
            </div>
             <div className="flex items-start space-x-4 p-4 bg-background border border-border rounded-lg shadow-sm">
              <Briefcase className="h-7 w-7 text-primary mt-1" />
              <div>
                <p className="text-xs text-muted-foreground font-medium">ID de Usuario</p>
                <p className="font-mono text-sm text-foreground bg-muted px-2 py-1 rounded">{currentUser.id}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
