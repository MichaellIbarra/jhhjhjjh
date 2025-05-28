
"use client";

import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookMarked, Construction, Loader2, Building2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCampusContext } from "@/contexts/CampusContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

export default function CourseAssignmentPage() {
  const { currentUser, isAuthLoading } = useAuth();
  const { selectedCampus, isLoadingSelection: campusLoading } = useCampusContext();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthLoading && (!currentUser || currentUser.role !== 'superuser')) {
       if (currentUser && currentUser.role === 'normal') {
        router.push('/teacher/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [currentUser, isAuthLoading, router]);

  if (isAuthLoading || !currentUser || campusLoading) {
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
                <p>No tiene permisos para acceder a esta página.</p>
                 <Button asChild className="mt-4">
                    <Link href="/admin/dashboard">Volver al Dashboard de Admin</Link>
                </Button>
            </CardContent>
          </Card>
      </DashboardLayout>
    );
  }
  
  if (!selectedCampus) {
    return (
      <DashboardLayout>
        <Card className="text-center">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Seleccione una Sede</CardTitle>
            <CardDescription>
              Por favor, seleccione una sede desde el <Link href="/admin/dashboard" className="text-primary hover:underline">Dashboard de Admin</Link> para gestionar la asignación de cursos.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <Construction className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">La asignación de cursos se realiza por sede.</p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }


  return (
    <DashboardLayout>
      <Card className="w-full shadow-lg">
        <CardHeader className="flex flex-row items-center gap-4">
          <BookMarked className="h-10 w-10 text-primary" />
          <div>
            <CardTitle className="text-2xl font-bold">Asignación de Cursos y Docentes</CardTitle>
            <CardDescription>
              Sede: {selectedCampus.name}. Distribuya las asignaturas a los maestros correspondientes. (Función de Superusuario)
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="min-h-[300px] flex flex-col items-center justify-center">
          <Construction className="h-24 w-24 text-primary/30 mb-6" />
          <h3 className="text-xl font-semibold text-muted-foreground mb-2">Funcionalidad en Desarrollo</h3>
          <p className="text-muted-foreground text-center max-w-md">
            Esta sección permitirá asignar materias/cursos a los docentes para cada grado y sección de la sede seleccionada.
            ¡Próximamente disponible!
          </p>
           <Button asChild className="mt-6" variant="outline">
             <Link href="/admin/dashboard">Volver al Dashboard de Admin</Link>
           </Button>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
