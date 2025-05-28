
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LogIn, School, UserPlus } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const { login, currentUser, isAuthLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!isAuthLoading && currentUser) {
      if (currentUser.role === 'superuser') {
        router.push("/admin/dashboard");
      } else {
        router.push("/teacher/dashboard");
      }
    }
  }, [currentUser, isAuthLoading, router]);

  if (isAuthLoading || (!isAuthLoading && currentUser)) {
     return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const success = await login(email, password);
    setIsLoading(false);
    if (success) {
      toast({ 
        title: "Inicio de Sesión Exitoso", 
        description: "Bienvenido de nuevo. Redirigiendo a su panel..." 
      });
      // Redirection is handled by useEffect based on currentUser update
    } else {
      toast({
        variant: "destructive",
        title: "Error de Inicio de Sesión",
        description: "Credenciales incorrectas. Por favor, inténtelo de nuevo.",
      });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
       <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-primary hover:text-primary/80">
        <School className="h-6 w-6" />
        <span className="font-semibold text-lg">EduAssist</span>
      </Link>
      <Card className="w-full max-w-sm shadow-xl">
        <CardHeader className="text-center">
          <LogIn className="mx-auto h-10 w-10 text-primary mb-3" />
          <CardTitle className="text-2xl font-bold text-primary">Iniciar Sesión</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Acceda a su cuenta EduAssist.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="usuario@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="text-base"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="text-base"
              />
              <p className="text-xs text-muted-foreground pt-1">
                <span className="font-semibold">Hint Demo:</span>
                <br />
                Admin: admin@eduassist.com / super1
                <br />
                Profesor: profesor@eduassist.com / normal1
              </p>
            </div>
            <Button type="submit" className="w-full !mt-6" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogIn className="mr-2 h-4 w-4" />
              )}
              Acceder
            </Button>
          </form>
          <div className="mt-6 text-center">
            <Link href="/register" legacyBehavior>
              <a className="text-sm text-primary hover:underline inline-flex items-center gap-1">
                <UserPlus className="h-4 w-4" />
                Crear nueva cuenta
              </a>
            </Link>
          </div>
        </CardContent>
      </Card>
       <footer className="mt-8 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} EduAssist. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
