
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, UserPlus, School, ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Link from "next/link";
import type { LegacyUserRole } from "@/types"; // Updated import

const registerFormSchema = z.object({
  name: z.string().min(3, { message: "El nombre debe tener al menos 3 caracteres." }).max(50),
  email: z.string().email({ message: "Por favor, ingrese un correo electrónico válido." }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres." }),
  confirmPassword: z.string().min(6, { message: "La confirmación de contraseña debe tener al menos 6 caracteres." }),
  role: z.enum(['superuser', 'normal'], { required_error: "Debe seleccionar un rol." }),
}).refine(data => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden.",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerFormSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { registerUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "normal",
    },
  });

  async function onSubmit(values: RegisterFormValues) {
    setIsLoading(true);
    const result = await registerUser(values.name, values.email, values.password, values.role as LegacyUserRole); // Updated type cast
    setIsLoading(false);

    if (result.success) {
      toast({
        title: "Registro Exitoso",
        description: result.message,
      });
      router.push("/login");
    } else {
      toast({
        variant: "destructive",
        title: "Error de Registro",
        description: result.message,
      });
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-primary hover:text-primary/80">
        <School className="h-6 w-6" />
        <span className="font-semibold text-lg">EduAssist</span>
      </Link>
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <UserPlus className="mx-auto h-10 w-10 text-primary mb-3" />
          <CardTitle className="text-2xl font-bold text-primary">Crear Cuenta</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Complete el formulario para registrar un nuevo usuario.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre Completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Ana Pérez" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo Electrónico</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="usuario@ejemplo.com" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar Contraseña</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rol de Usuario</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione un rol" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="normal">Usuario Normal (Profesor)</SelectItem>
                        <SelectItem value="superuser">Superusuario (Administrador)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full !mt-6" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="mr-2 h-4 w-4" />
                )}
                Registrar Usuario
              </Button>
            </form>
          </Form>
          <div className="mt-6 text-center">
            <Link href="/login" legacyBehavior>
              <a className="text-sm text-primary hover:underline inline-flex items-center gap-1">
                <ArrowLeft className="h-4 w-4" />
                Volver a Iniciar Sesión
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
