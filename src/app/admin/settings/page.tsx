
"use client";

import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Settings as SettingsIcon, Palette, Bell, Lock, UserCircle, ShieldAlert, Loader2 } from "lucide-react"; // Added Loader2
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext"; // Added useAuth
import { useRouter } from "next/navigation"; // Added useRouter
import { useEffect } from "react"; // Added useEffect

export default function AdminSettingsPage() { // Renamed
  const { toast } = useToast();
  const { currentUser, isAuthLoading } = useAuth(); // Added useAuth
  const router = useRouter(); // Added useRouter

  useEffect(() => {
    if (!isAuthLoading && (!currentUser || currentUser.role !== 'superuser')) {
        if (currentUser && currentUser.role === 'normal') {
            router.push('/teacher/settings'); // Redirect normal users
        } else {
            router.push('/login');
        }
    }
  }, [currentUser, isAuthLoading, router]);


  const handleSaveChanges = () => {
    toast({
      title: "Configuración Guardada (Simulación)",
      description: "Sus cambios han sido guardados (simulación). Esta función aún no está implementada.",
      variant: "default", 
    });
  };

  if (isAuthLoading || !currentUser) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (currentUser.role !== 'superuser') {
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
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center gap-3 mb-8">
            <SettingsIcon className="h-10 w-10 text-primary" />
            <div>
            <h1 className="text-3xl font-bold text-foreground">Configuración del Administrador</h1>
            <p className="text-muted-foreground">Ajuste las preferencias de su cuenta y de la aplicación.</p>
            </div>
        </div>
        
        <Card className="shadow-lg rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl"><UserCircle className="h-6 w-6 text-primary" /> Cuenta</CardTitle>
            <CardDescription>Administre los detalles de su perfil y preferencias de cuenta.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="profile-name">Nombre para mostrar</Label>
              <Input id="profile-name" defaultValue={currentUser.name} disabled />
               <p className="text-xs text-muted-foreground">Actualmente no se puede cambiar el nombre desde aquí.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-email">Correo Electrónico</Label>
              <Input id="profile-email" type="email" defaultValue={currentUser.email} disabled />
            </div>
             <Button variant="outline" disabled>Actualizar Perfil (No disponible)</Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl"><Palette className="h-6 w-6 text-primary" /> Apariencia</CardTitle>
            <CardDescription>Personalice cómo se ve y se siente la aplicación.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-3 border rounded-md">
              <Label htmlFor="dark-mode-switch" className="flex flex-col gap-1">
                <span>Modo Oscuro</span>
                <span className="text-xs text-muted-foreground">Habilite el tema oscuro para la aplicación.</span>
              </Label>
              <Switch id="dark-mode-switch" disabled aria-label="Toggle dark mode (disabled function)" />
            </div>
            <div className="space-y-2 p-3 border rounded-md">
              <Label htmlFor="language-select">Idioma</Label>
              <Input id="language-select" type="text" value="Español (Predeterminado)" disabled />
              <p className="text-xs text-muted-foreground">La selección de idioma no está disponible actualmente.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl"><Bell className="h-6 w-6 text-primary" /> Notificaciones</CardTitle>
            <CardDescription>Controle cómo recibe las alertas y actualizaciones.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-md">
              <Label htmlFor="email-notifications" className="flex flex-col gap-1">
                <span>Notificaciones por Correo</span>
                <span className="text-xs text-muted-foreground">Recibir alertas y actualizaciones importantes.</span>
              </Label>
              <Switch id="email-notifications" defaultChecked disabled aria-label="Toggle email notifications (disabled function)" />
            </div>
            <div className="flex items-center justify-between p-3 border rounded-md">
              <Label htmlFor="app-notifications" className="flex flex-col gap-1">
                <span>Notificaciones en la Aplicación</span>
                <span className="text-xs text-muted-foreground">Mostrar notificaciones dentro de EduAssist.</span>
              </Label>
              <Switch id="app-notifications" defaultChecked disabled aria-label="Toggle in-app notifications (disabled function)" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl"><Lock className="h-6 w-6 text-primary" /> Seguridad</CardTitle>
            <CardDescription>Gestione la seguridad de su cuenta.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 p-3 border rounded-md">
              <Label htmlFor="change-password">Cambiar Contraseña</Label>
              <Button variant="outline" disabled className="w-full sm:w-auto">Cambiar Contraseña (No disponible)</Button>
            </div>
            <div className="space-y-2 p-3 border rounded-md">
              <Label htmlFor="two-factor">Autenticación de Dos Factores (2FA)</Label>
              <Button variant="outline" disabled className="w-full sm:w-auto">Configurar 2FA (No disponible)</Button>
               <p className="text-xs text-muted-foreground">Mejore la seguridad de su cuenta activando 2FA.</p>
            </div>
          </CardContent>
        </Card>
        
        <Separator />

        <div className="flex justify-end pt-2">
          <Button onClick={handleSaveChanges} disabled size="lg">Guardar Cambios (Deshabilitado)</Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
