
"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { Sparkles, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { dataAnomalyChecker, type DataAnomalyCheckerOutput } from "@/ai/flows/data-anomaly-checker";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  studentName: z.string().min(3, { message: "El nombre debe tener al menos 3 caracteres." }).max(100),
  dni: z.string().min(8, { message: "El DNI debe tener al menos 8 caracteres." }).max(15),
});

type FormValues = z.infer<typeof formSchema>;

export default function AnomalyCheckerPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DataAnomalyCheckerOutput | null>(null);
  const { toast } = useToast();
  const { currentUser, isAuthLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthLoading && (!currentUser || currentUser.role !== 'superuser')) {
      toast({
        variant: "destructive",
        title: "Acceso Denegado",
        description: "No tiene permisos para acceder a esta página.",
      });
      // Redirect to a more appropriate page if not superuser, e.g., teacher dashboard or login
      if (currentUser && currentUser.role === 'normal') {
        router.push('/teacher/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [currentUser, isAuthLoading, router, toast]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      studentName: "",
      dni: "",
    },
  });

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    setResult(null);
    try {
      const aiResult = await dataAnomalyChecker(values);
      setResult(aiResult);
      toast({
        title: "Verificación Completa",
        description: "El análisis de anomalías ha finalizado.",
      });
    } catch (error) {
      console.error("Error calling AI flow:", error);
      toast({
        variant: "destructive",
        title: "Error en la Verificación",
        description: "No se pudo completar el análisis. Intente nuevamente.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (isAuthLoading || !currentUser) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }
  
  // This check is redundant if useEffect handles redirection, but kept for safety
  if (currentUser.role !== 'superuser') {
    return (
      <DashboardLayout>
        <Card>
          <CardHeader>
            <CardTitle>Acceso Denegado</CardTitle>
          </CardHeader>
          <CardContent>
            <p>No tiene los permisos necesarios para ver esta página.</p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }


  return (
    <DashboardLayout>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center gap-4">
            <Sparkles className="h-10 w-10 text-primary" />
            <div>
              <CardTitle className="text-2xl font-bold">Verificador de Anomalías IA</CardTitle>
              <CardDescription>
                Detecte posibles desajustes entre nombres de estudiantes y sus DNI. (Función de Superusuario)
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="studentName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del Estudiante</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Juan Pérez García" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dni"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>DNI del Estudiante</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: 12345678" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    "Verificar Datos"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {result && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Resultado del Análisis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={`flex items-center p-4 rounded-md ${result.isMatch ? 'bg-accent/20 text-accent-foreground' : 'bg-destructive/20 text-destructive-foreground'}`}>
                {result.isMatch ? (
                  <CheckCircle2 className="h-6 w-6 mr-3 text-accent" />
                ) : (
                  <AlertTriangle className="h-6 w-6 mr-3 text-destructive" />
                )}
                <span className="font-semibold text-lg">
                  {result.isMatch ? "Coincidencia probable" : "Posible Anomalía Detectada"}
                </span>
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Confianza:</h4>
                <div className="w-full bg-muted rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full ${result.isMatch ? 'bg-accent' : 'bg-destructive'}`}
                    style={{ width: `${result.confidence * 100}%` }}
                  ></div>
                </div>
                <p className="text-sm text-muted-foreground text-right">{(result.confidence * 100).toFixed(0)}%</p>
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Razón:</h4>
                <p className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-md">{result.reason}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
