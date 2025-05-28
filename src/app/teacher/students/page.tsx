
// @ts-nocheck
"use client";

import React, { useState, useEffect, useMemo } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"; 
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Users, PlusCircle, Edit, Trash2, Eye, MoreVertical, Search, Building2, Loader2, UploadCloud, ChevronLeft, ChevronRight, Filter, UserSquare, Phone, GraduationCap, UserCheck, Tag, Briefcase } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { LegacyStudent } from "@/types"; 
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useStudentContext } from "@/contexts/StudentContext";
import { useCampusContext } from "@/contexts/CampusContext";
import Link from "next/link";
import StudentImportDialog from "@/components/StudentImportDialog";
import { useAuth } from "@/contexts/AuthContext"; // Added useAuth
import { useRouter } from "next/navigation"; // Added useRouter

const gradeOptions = ["Todos", "Kinder", "1ro", "2do", "3ro", "4to", "5to"]; 
const sectionOptions = ["Todas", "A", "B", "C", "D", "E"];
const levelOptions = ["Todos", "Inicial", "Primaria", "Secundaria"];

const studentSchema = z.object({
  dni: z.string().min(8, "El DNI debe tener al menos 8 caracteres.").max(15, "El DNI no debe exceder los 15 caracteres."),
  firstName: z.string().min(2, "El nombre debe tener al menos 2 caracteres.").max(50),
  lastName: z.string().min(2, "El apellido debe tener al menos 2 caracteres.").max(50),
  grade: z.string().min(1, "El grado es requerido."),
  section: z.string().min(1, "La sección es requerida."),
  level: z.enum(['Inicial', 'Primaria', 'Secundaria'], { required_error: "El nivel es requerido." }),
  shift: z.enum(['Mañana', 'Tarde'], { required_error: "El turno es requerido." }),
  guardianPhoneNumber: z.string().regex(/^\d{7,15}$/, "Número de celular inválido.").optional().or(z.literal('')),
});

type StudentFormData = z.infer<typeof studentSchema>;

const ITEMS_PER_PAGE = 10;

export default function StudentsPage() {
  const { students, addStudent, updateStudent, deleteStudent, isLoaded: studentsLoaded, addMultipleStudents } = useStudentContext();
  const { selectedCampus, isLoadingSelection: campusLoading } = useCampusContext();
  const { currentUser, isAuthLoading } = useAuth(); // Added useAuth
  const router = useRouter(); // Added useRouter
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<LegacyStudent | null>(null); 
  const [viewingStudent, setViewingStudent] = useState<LegacyStudent | null>(null); 
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>("Todos");
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<string>("Todas");
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<string>("Todos");
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();

  const form = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      dni: "",
      firstName: "",
      lastName: "",
      grade: "",
      section: "",
      level: undefined,
      shift: undefined,
      guardianPhoneNumber: "",
    },
  });

  useEffect(() => {
    if (!isAuthLoading && currentUser && currentUser.role === 'superuser') {
      router.push('/admin/dashboard');
    }
  }, [currentUser, isAuthLoading, router]);


  useEffect(() => {
    if (isModalOpen) { 
      if (editingStudent) {
        form.reset(editingStudent);
      } else if (!viewingStudent) { 
        form.reset({
          dni: "",
          firstName: "",
          lastName: "",
          grade: "",
          section: "",
          level: undefined,
          shift: undefined,
          guardianPhoneNumber: "",
        });
      }
    }
  }, [editingStudent, viewingStudent, form, isModalOpen]);


  const onSubmit = (data: StudentFormData) => {
    if (!selectedCampus) {
        toast({ variant: "destructive", title: "Error", description: "No hay una sede seleccionada." });
        return;
    }
    
    if (editingStudent) {
      updateStudent({ ...editingStudent, ...data }); 
      toast({ title: "Estudiante Actualizado", description: "Los datos del estudiante han sido actualizados." });
    } else {
      addStudent(data as Omit<LegacyStudent, 'id'>); 
      toast({ title: "Estudiante Agregado", description: "El nuevo estudiante ha sido agregado." });
    }
    setIsModalOpen(false);
    setEditingStudent(null);
  };

  const handleDelete = (id: string) => {
    deleteStudent(id);
    toast({ title: "Estudiante Eliminado", description: "El estudiante ha sido eliminado.", variant: "destructive" });
  };

  const openEditModal = (student: LegacyStudent) => { 
    setEditingStudent(student);
    setViewingStudent(null);
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setEditingStudent(null);
    setViewingStudent(null);
    setIsModalOpen(true);
  };
  
  const openViewModal = (student: LegacyStudent) => { 
    setViewingStudent(student);
    setEditingStudent(null);
    setIsModalOpen(true);
  };
  
  const handleImportStudents = (importedStudents: Omit<LegacyStudent, 'id'>[]) => {
    if (!selectedCampus) {
      toast({ variant: "destructive", title: "Error de Importación", description: "No hay una sede seleccionada para asignar los estudiantes." });
      return;
    }
    
    addMultipleStudents(importedStudents); 
    toast({
      title: "Importación Exitosa",
      description: `${importedStudents.length} estudiantes han sido agregados/actualizados.`,
    });
    setIsImportModalOpen(false);
  };

  const studentsForSelectedCampus = useMemo(() => {
    return selectedCampus ? students : [];
  }, [students, selectedCampus]);

  const fullyFilteredStudents = useMemo(() => {
    setCurrentPage(1); 
    return studentsForSelectedCampus.filter(student =>
      (selectedGradeFilter === "Todos" || student.grade === selectedGradeFilter) &&
      (selectedSectionFilter === "Todas" || student.section === selectedSectionFilter) &&
      (selectedLevelFilter === "Todos" || student.level === selectedLevelFilter) &&
      (`${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
       (student.dni && student.dni.toLowerCase().includes(searchTerm.toLowerCase())))
    );
  }, [studentsForSelectedCampus, searchTerm, selectedGradeFilter, selectedSectionFilter, selectedLevelFilter]);

  const totalPages = Math.ceil(fullyFilteredStudents.length / ITEMS_PER_PAGE);
  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return fullyFilteredStudents.slice(startIndex, endIndex);
  }, [fullyFilteredStudents, currentPage]);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };


  if (isAuthLoading || !currentUser || campusLoading || !studentsLoaded) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-2">Cargando datos de estudiantes...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!selectedCampus) {
    return (
      <DashboardLayout>
        <Card className="text-center">
          <CardHeader>
            <Building2 className="mx-auto h-12 w-12 text-primary mb-4" />
            <CardTitle>No hay Sede Seleccionada</CardTitle>
            <CardDescription>
              Por favor, seleccione una sede desde el <Link href="/teacher/dashboard" className="text-primary hover:underline">Dashboard</Link> para gestionar estudiantes.
            </CardDescription>
          </CardHeader>
        </Card>
      </DashboardLayout>
    );
  }


  return (
    <DashboardLayout>
      <Card className="w-full shadow-lg">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Users className="h-10 w-10 text-primary" />
            <div>
              <CardTitle className="text-2xl font-bold">Gestión de Estudiantes</CardTitle>
              <CardDescription>
                Administre la información de los estudiantes de la sede: {selectedCampus.name}.
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <Button onClick={openAddModal} className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-5 w-5" />
              Agregar Estudiante
            </Button>
            <Button onClick={() => setIsImportModalOpen(true)} variant="outline" className="w-full sm:w-auto">
              <UploadCloud className="mr-2 h-5 w-5" />
              Importar desde Excel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 border rounded-md shadow-sm bg-muted/20">
            <h3 className="text-lg font-semibold mb-3 text-primary flex items-center">
              <Filter className="mr-2 h-5 w-5" />
              Filtrar Estudiantes
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-1">
                <Label htmlFor="student-search-input">Buscar (Nombre/DNI)</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="student-search-input"
                    placeholder="Ej: Ana García o 123..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 w-full"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="grade-filter-select">Grado</Label>
                <Select value={selectedGradeFilter} onValueChange={setSelectedGradeFilter}>
                  <SelectTrigger id="grade-filter-select">
                    <SelectValue placeholder="Todos los grados" />
                  </SelectTrigger>
                  <SelectContent>
                    {gradeOptions.map(grade => (
                      <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="section-filter-select">Sección</Label>
                <Select value={selectedSectionFilter} onValueChange={setSelectedSectionFilter}>
                  <SelectTrigger id="section-filter-select">
                    <SelectValue placeholder="Todas las secciones" />
                  </SelectTrigger>
                  <SelectContent>
                    {sectionOptions.map(section => (
                      <SelectItem key={section} value={section}>{section}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="level-filter-select">Nivel</Label>
                <Select value={selectedLevelFilter} onValueChange={setSelectedLevelFilter}>
                  <SelectTrigger id="level-filter-select">
                    <SelectValue placeholder="Todos los niveles" />
                  </SelectTrigger>
                  <SelectContent>
                    {levelOptions.map(level => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {paginatedStudents.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>DNI</TableHead>
                      <TableHead>Nombre Completo</TableHead>
                      <TableHead>Grado</TableHead>
                      <TableHead>Sección</TableHead>
                      <TableHead>Nivel</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>{student.dni}</TableCell>
                        <TableCell>{student.firstName} {student.lastName}</TableCell>
                        <TableCell>{student.grade}</TableCell>
                        <TableCell>{student.section}</TableCell>
                        <TableCell>{student.level}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-5 w-5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openViewModal(student)}>
                                <Eye className="mr-2 h-4 w-4" /> Ver
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEditModal(student)}>
                                <Edit className="mr-2 h-4 w-4" /> Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDelete(student.id)} className="text-destructive-foreground bg-destructive hover:bg-destructive/90 focus:bg-destructive/90">
                                <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-end gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handlePrevPage}
                        disabled={currentPage === 1}
                        aria-label="Página anterior"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">
                        Página {currentPage} de {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages}
                        aria-label="Siguiente página"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-border rounded-lg bg-card/50">
              <Users className="h-16 w-16 text-muted-foreground" />
              <p className="text-muted-foreground text-lg mt-4">
                {searchTerm || selectedGradeFilter !== "Todos" || selectedSectionFilter !== "Todas" || selectedLevelFilter !== "Todos" 
                  ? "No se encontraron estudiantes con los filtros aplicados." 
                  : "No hay estudiantes registrados en esta sede."}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Agregue un nuevo estudiante para comenzar o importe desde un archivo Excel.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={(isOpen) => {
          setIsModalOpen(isOpen);
          if (!isOpen) {
            setEditingStudent(null);
            setViewingStudent(null);
            form.reset(); 
          }
      }}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl">{viewingStudent ? "Detalles del Estudiante" : editingStudent ? "Editar Estudiante" : "Agregar Estudiante"}</DialogTitle>
            {viewingStudent ? (
              <DialogDescription>
                Información detallada del estudiante {viewingStudent.firstName} {viewingStudent.lastName}.
              </DialogDescription>
            ) : (
              <DialogDescription>
                {editingStudent ? "Modifique los datos del estudiante." : `Complete los datos del nuevo estudiante para la sede ${selectedCampus?.name}.`}
              </DialogDescription>
            )}
          </DialogHeader>
          {viewingStudent ? (
            <div className="space-y-6 py-4">
              <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle className="text-xl text-primary flex items-center gap-2"><UserSquare className="h-6 w-6"/> Datos Personales</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                    <div><Label>DNI:</Label><p>{viewingStudent.dni}</p></div>
                    <div><Label>Nombres:</Label><p>{viewingStudent.firstName}</p></div>
                    <div><Label>Apellidos:</Label><p>{viewingStudent.lastName}</p></div>
                </CardContent>
              </Card>
               <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle className="text-xl text-primary flex items-center gap-2"><GraduationCap className="h-6 w-6"/> Datos Académicos</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                    <div><Label>Grado:</Label><p>{viewingStudent.grade}</p></div>
                    <div><Label>Sección:</Label><p>{viewingStudent.section}</p></div>
                    <div><Label>Nivel:</Label><p>{viewingStudent.level}</p></div>
                    <div><Label>Turno:</Label><p>{viewingStudent.shift}</p></div>
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle className="text-xl text-primary flex items-center gap-2"><Phone className="h-6 w-6"/> Contacto Apoderado</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-x-6 gap-y-4 text-sm">
                    <div><Label>Celular Apoderado:</Label><p>{viewingStudent.guardianPhoneNumber || "No registrado"}</p></div>
                </CardContent>
              </Card>
               <DialogFooter className="mt-4">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cerrar</Button>
              </DialogFooter>
            </div>
          ) : (
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6 py-4">
              <section className="space-y-4 p-4 border rounded-md shadow-sm">
                <h3 className="text-lg font-semibold text-primary flex items-center gap-2"><UserCheck className="h-5 w-5"/>Identificación</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dni">DNI</Label>
                    <Input id="dni" {...form.register("dni")} className={cn(form.formState.errors.dni && "border-destructive")} />
                    {form.formState.errors.dni && <p className="text-destructive text-sm mt-1">{form.formState.errors.dni.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="firstName">Nombres</Label>
                    <Input id="firstName" {...form.register("firstName")} className={cn(form.formState.errors.firstName && "border-destructive")} />
                    {form.formState.errors.firstName && <p className="text-destructive text-sm mt-1">{form.formState.errors.firstName.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="lastName">Apellidos</Label>
                    <Input id="lastName" {...form.register("lastName")} className={cn(form.formState.errors.lastName && "border-destructive")} />
                    {form.formState.errors.lastName && <p className="text-destructive text-sm mt-1">{form.formState.errors.lastName.message}</p>}
                  </div>
                </div>
              </section>
              
              <section className="space-y-4 p-4 border rounded-md shadow-sm">
                 <h3 className="text-lg font-semibold text-primary flex items-center gap-2"><Tag className="h-5 w-5"/>Información Académica</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="grade">Grado</Label>
                    <Controller
                      control={form.control}
                      name="grade"
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value || ""}>
                          <SelectTrigger id="grade" className={cn(form.formState.errors.grade && "border-destructive")}>
                            <SelectValue placeholder="Seleccione grado" />
                          </SelectTrigger>
                          <SelectContent>
                            {gradeOptions.filter(g => g !== "Todos").map(option => (
                              <SelectItem key={option} value={option}>{option}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {form.formState.errors.grade && <p className="text-destructive text-sm mt-1">{form.formState.errors.grade.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="section">Sección</Label>
                    <Controller
                      control={form.control}
                      name="section"
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value || ""}>
                          <SelectTrigger id="section" className={cn(form.formState.errors.section && "border-destructive")}>
                            <SelectValue placeholder="Seleccione sección" />
                          </SelectTrigger>
                          <SelectContent>
                            {sectionOptions.filter(s => s !== "Todas").map(option => (
                              <SelectItem key={option} value={option}>{option}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {form.formState.errors.section && <p className="text-destructive text-sm mt-1">{form.formState.errors.section.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="level">Nivel</Label>
                    <Controller
                      control={form.control}
                      name="level"
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value || ""}>
                          <SelectTrigger className={cn(form.formState.errors.level && "border-destructive")}>
                            <SelectValue placeholder="Seleccione nivel" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Inicial">Inicial</SelectItem>
                            <SelectItem value="Primaria">Primaria</SelectItem>
                            <SelectItem value="Secundaria">Secundaria</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {form.formState.errors.level && <p className="text-destructive text-sm mt-1">{form.formState.errors.level.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="shift">Turno</Label>
                    <Controller
                      control={form.control}
                      name="shift"
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value || ""}>
                          <SelectTrigger className={cn(form.formState.errors.shift && "border-destructive")}>
                            <SelectValue placeholder="Seleccione turno" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Mañana">Mañana</SelectItem>
                            <SelectItem value="Tarde">Tarde</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {form.formState.errors.shift && <p className="text-destructive text-sm mt-1">{form.formState.errors.shift.message}</p>}
                  </div>
                </div>
              </section>

              <section className="space-y-4 p-4 border rounded-md shadow-sm">
                <h3 className="text-lg font-semibold text-primary flex items-center gap-2"><Briefcase className="h-5 w-5"/>Contacto Apoderado</h3>
                <div>
                  <Label htmlFor="guardianPhoneNumber">Celular del Apoderado (Opcional)</Label>
                  <Input id="guardianPhoneNumber" {...form.register("guardianPhoneNumber")} className={cn(form.formState.errors.guardianPhoneNumber && "border-destructive")} />
                  {form.formState.errors.guardianPhoneNumber && <p className="text-destructive text-sm mt-1">{form.formState.errors.guardianPhoneNumber.message}</p>}
                </div>
              </section>
              
              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                <Button type="submit">{editingStudent ? "Guardar Cambios" : "Agregar Estudiante"}</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <StudentImportDialog
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportStudents}
      />
    </DashboardLayout>
  );
}
