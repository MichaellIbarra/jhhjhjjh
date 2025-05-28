
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap, PlusCircle, Edit, Trash2, BookOpen, Users as UsersIcon, Loader2, Building2, Search, Filter, CalendarIcon, RotateCcw, Archive, CheckCircle, Book } from "lucide-react";
import type { Grade, StudentRef, CourseRef } from "@/types"; // Using new Grade type
import { useToast } from "@/hooks/use-toast";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
// StudentContext will be used for the list of students to select from
import { useStudentContext } from "@/contexts/StudentContext"; 
import { useCampusContext } from "@/contexts/CampusContext";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

/*
API Endpoints for Grades (Backend: https://8d3a-201-234-124-236.ngrok-free.app)

#### Get All Grades (Example - typically filtered by student/course in real app)
```bash
curl -X GET https://8d3a-201-234-124-236.ngrok-free.app/api/grades
```

#### Create a New Grade
StudentId and CourseId are associated by the backend through other means (e.g. different endpoint structure or context).
The body of this request only contains grade-specific information.
```bash
curl -X POST https://8d3a-201-234-124-236.ngrok-free.app/api/grades \
  -H "Content-Type: application/json" \
  -d '{"academicPeriod":"Bimester I","evaluationType":"Examen","grade":18.5,"evaluationDate":"2023-11-15","remarks":"Excellent performance"}'
```
Note: `studentId` and `courseId` are typically managed by other microservices or derived from the context and should not be sent in the request body for creating grades directly in this microservice when using the generic `/api/grades` endpoint.

#### Update an Existing Grade
```bash
curl -X PUT https://8d3a-201-234-124-236.ngrok-free.app/api/grades/{gradeId} \
  -H "Content-Type: application/json" \
  -d '{"academicPeriod":"Bimester II","evaluationType":"Tarea","grade":19.0,"evaluationDate":"2025-05-19","remarks":"Outstanding performance"}'
```

#### Logically Delete a Grade
```bash
curl -X DELETE https://8d3a-201-234-124-236.ngrok-free.app/api/grades/{gradeId}
```

#### Restore a Logically Deleted Grade
```bash
curl -X PUT https://8d3a-201-234-124-236.ngrok-free.app/api/grades/{gradeId}/restore
```

#### Example JSON for Creating or Updating a Grade (Body Payload)
This is what the frontend would send in the body for create/update if studentId/courseId are handled externally by the backend.
```json
{
  "academicPeriod": "Bimester I",
  "evaluationType": "Examen",
  "grade": 18.5,
  "evaluationDate": "2023-11-15",
  "remarks": "Excellent performance"
}
*/


const gradeSchema = z.object({
  studentId: z.string().min(1, "Debe seleccionar un estudiante."),
  courseId: z.string().min(1, "Debe seleccionar una materia/curso."),
  academicPeriod: z.string().min(1, "El periodo académico es requerido.").max(50),
  evaluationType: z.string().min(1, "El tipo de evaluación es requerido.").max(100),
  grade: z.coerce.number().min(0, "La nota mínima es 0.").max(20, "La nota máxima es 20."),
  evaluationDate: z.date({ required_error: "La fecha de evaluación es requerida." }),
  remarks: z.string().max(500, "Las observaciones no pueden exceder los 500 caracteres.").optional(),
  deleted: z.boolean().optional(),
});

type GradeFormData = z.infer<typeof gradeSchema>;

const getGradesStorageKey = (campusId?: string, studentId?: string, courseId?: string) => {
    // For simplicity, still using a single key per campus for all grades
    // In a real scenario with an API, you'd fetch grades based on student/course
    return `eduassist_grades_v2_${campusId ? campusId + '_' : ''}`;
}

const AUTO_REMARKS = {
  AD: "AD LMS (Logro Muy Satisfactorio)",
  A: "A LS (Logro Satisfactorio)",
  B: "B LB (Logro Básico)",
  C: "C LI (Logro Inicial)",
};
const ALL_AUTO_REMARK_VALUES = Object.values(AUTO_REMARKS);

function getRemarkForNumericGrade(numericGrade: number | null | undefined): string {
  if (numericGrade === null || numericGrade === undefined || isNaN(numericGrade)) return "";
  if (numericGrade >= 18 && numericGrade <= 20) return AUTO_REMARKS.AD;
  if (numericGrade >= 14 && numericGrade <= 17) return AUTO_REMARKS.A;
  if (numericGrade >= 11 && numericGrade <= 13) return AUTO_REMARKS.B;
  if (numericGrade >= 0 && numericGrade <= 10) return AUTO_REMARKS.C;
  return "";
}

// Mock data for students and courses (simulating data from other microservices)
const MOCK_STUDENTS: StudentRef[] = [
  { id: "student-1", fullName: "Ana García López", dni: "12345678", grade: "5to", section: "A" },
  { id: "student-2", fullName: "Luis Martínez Torres", dni: "87654321", grade: "3ro", section: "B"},
  { id: "student-3", fullName: "Sofía Rodríguez Paz", dni: "11223344", grade: "Kinder", section: "C"},
  { id: "student-4", fullName: "Carlos Sánchez Vera", dni: "44556677", grade: "5to", section: "A"},
];

const MOCK_COURSES: CourseRef[] = [
  { id: "course-1", name: "Matemáticas", code: "MAT01" },
  { id: "course-2", name: "Comunicación", code: "COM01" },
  { id: "course-3", name: "Ciencia y Tecnología", code: "CYT01" },
  { id: "course-4", name: "Personal Social", code: "PS01" },
];

const MOCK_ACADEMIC_PERIODS: string[] = ["Bimestre I", "Bimestre II", "Bimestre III", "Bimestre IV", "Trimestre I", "Trimestre II", "Trimestre III", "Anual"];


export default function GradesPage() {
  // Using legacyStudentContext to get the list of students for the dropdown
  const { students: legacyStudents, getStudentById: getLegacyStudentById, isLoaded: studentsLoaded } = useStudentContext(); 
  const { selectedCampus, isLoadingSelection: campusLoading } = useCampusContext();
  const { currentUser, isAuthLoading } = useAuth(); 
  const router = useRouter(); 
  
  const [grades, setGrades] = useState<Grade[]>([]); // State for new Grade type
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null);
  const { toast } = useToast();
  const [isLoadingGrades, setIsLoadingGrades] = useState(true);
  const [viewMode, setViewMode] = useState<'active' | 'deleted'>('active');

  const [selectedStudentFilterId, setSelectedStudentFilterId] = useState<string | null>(null); // For filtering which student's grades to show
  const [gradeSearchTerm, setGradeSearchTerm] = useState(""); // For searching within the selected student's grades table


  const form = useForm<GradeFormData>({
    resolver: zodResolver(gradeSchema),
    defaultValues: {
      studentId: "",
      courseId: "",
      academicPeriod: MOCK_ACADEMIC_PERIODS[0] || "",
      evaluationType: "Examen",
      grade: undefined, // Initialize as undefined for numeric input
      evaluationDate: new Date(),
      remarks: "",
      deleted: false,
    },
  });

  const watchedGradeValue = form.watch("grade");
  const watchedRemarks = form.watch("remarks");

  useEffect(() => {
    if (!isAuthLoading && currentUser && currentUser.role === 'superuser') {
      router.push('/admin/dashboard');
    }
  }, [currentUser, isAuthLoading, router]);

  useEffect(() => {
    if (typeof window !== 'undefined' && selectedCampus && !campusLoading) {
      setIsLoadingGrades(true);
      const storageKey = getGradesStorageKey(selectedCampus.id);
      const storedGrades = localStorage.getItem(storageKey);
      if (storedGrades) {
        try {
          setGrades(JSON.parse(storedGrades).map((g: any) => ({ ...g, evaluationDate: g.evaluationDate ? new Date(g.evaluationDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0] })));
        } catch (error) {
          console.error("Error parsing grades from localStorage:", error);
          setGrades([]);
        }
      } else {
        // Initialize with some mock grades if none are stored for the new model
        const initialMockGrades: Grade[] = [
            { id: 'grade-1', studentId: 'student-1', courseId: 'course-1', academicPeriod: 'Bimestre I', evaluationType: 'Examen Parcial', grade: 18.5, evaluationDate: '2023-11-15', remarks: 'Excelente desempeño', deleted: false },
            { id: 'grade-2', studentId: 'student-1', courseId: 'course-2', academicPeriod: 'Bimestre I', evaluationType: 'Presentación Oral', grade: 16, evaluationDate: '2023-11-20', remarks: 'Buena participación', deleted: false },
            { id: 'grade-3', studentId: 'student-2', courseId: 'course-1', academicPeriod: 'Bimestre I', evaluationType: 'Tarea', grade: 14, evaluationDate: '2023-11-10', deleted: true, remarks: 'Cumplió con la tarea' },
        ];
        setGrades(initialMockGrades);
      }
      setIsLoadingGrades(false);
    } else if (!selectedCampus && !campusLoading) {
      setGrades([]);
      setIsLoadingGrades(false);
    }
  }, [selectedCampus, campusLoading]);

  useEffect(() => {
    if (typeof window !== 'undefined' && !isLoadingGrades && selectedCampus) {
      const storageKey = getGradesStorageKey(selectedCampus.id);
      localStorage.setItem(storageKey, JSON.stringify(grades));
    }
  }, [grades, isLoadingGrades, selectedCampus]);

  useEffect(() => {
    if (isModalOpen) {
      if (editingGrade) {
        form.reset({
          studentId: editingGrade.studentId,
          courseId: editingGrade.courseId,
          academicPeriod: editingGrade.academicPeriod,
          evaluationType: editingGrade.evaluationType,
          grade: editingGrade.grade,
          evaluationDate: editingGrade.evaluationDate ? parseISO(editingGrade.evaluationDate) : new Date(),
          remarks: editingGrade.remarks || "",
          deleted: editingGrade.deleted || false,
        });
      } else {
        form.reset({
          studentId: selectedStudentFilterId || "", // Pre-fill student if one is selected for viewing
          courseId: "",
          academicPeriod: MOCK_ACADEMIC_PERIODS[0] || "",
          evaluationType: "Examen",
          grade: undefined,
          evaluationDate: new Date(),
          remarks: "",
          deleted: false,
        });
      }
    }
  }, [isModalOpen, editingGrade, form, selectedStudentFilterId]);

  useEffect(() => {
    if (form.formState.isSubmitting || !isModalOpen || typeof watchedGradeValue !== 'number') return;

    const newRemark = getRemarkForNumericGrade(watchedGradeValue);
    if (newRemark && (watchedRemarks === "" || ALL_AUTO_REMARK_VALUES.includes(watchedRemarks))) {
      form.setValue("remarks", newRemark, { shouldValidate: true, shouldDirty: true });
    } else if (watchedGradeValue === undefined && ALL_AUTO_REMARK_VALUES.includes(watchedRemarks)) {
      form.setValue("remarks", "", { shouldValidate: true, shouldDirty: true });
    }
  }, [watchedGradeValue, watchedRemarks, form, isModalOpen]);

  const onSubmit = (data: GradeFormData) => {
    if (!selectedCampus) {
      toast({ variant: "destructive", title: "Error", description: "No hay una sede seleccionada." });
      return;
    }
    // newGradeEntry is for the frontend state and includes studentId and courseId
    const newGradeEntry: Grade = {
      id: editingGrade ? editingGrade.id : `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      studentId: data.studentId,
      courseId: data.courseId,
      academicPeriod: data.academicPeriod,
      evaluationType: data.evaluationType,
      grade: data.grade,
      evaluationDate: format(data.evaluationDate, "yyyy-MM-dd"),
      remarks: data.remarks,
      deleted: editingGrade ? data.deleted : false,
    };

    // For actual API call, the payload might differ (e.g., exclude studentId, courseId from body)
    // const payloadForApi = {
    //   academicPeriod: data.academicPeriod,
    //   evaluationType: data.evaluationType,
    //   grade: data.grade,
    //   evaluationDate: format(data.evaluationDate, "yyyy-MM-dd"),
    //   remarks: data.remarks,
    //   // studentId and courseId might be part of URL path or handled differently by backend
    // };
    // If creating: POST /api/grades (or /api/students/{data.studentId}/courses/{data.courseId}/grades) with payloadForApi
    // If editing: PUT /api/grades/{editingGrade.id} with payloadForApi

    if (editingGrade) {
      setGrades(grades.map(g => g.id === editingGrade.id ? newGradeEntry : g));
      toast({ title: "Nota Actualizada", description: "La nota ha sido actualizada correctamente." });
    } else {
      setGrades([...grades, newGradeEntry]);
      toast({ title: "Nota Agregada", description: "La nueva nota ha sido registrada." });
    }
    setIsModalOpen(false);
    setEditingGrade(null);
  };

  const handleDeleteGrade = (gradeId: string) => {
    setGrades(grades.map(g => g.id === gradeId ? { ...g, deleted: true } : g));
    toast({ title: "Nota Eliminada", description: "La nota ha sido marcada como eliminada.", icon: <Archive className="h-5 w-5 text-destructive" /> });
  };

  const handleRestoreGrade = (gradeId: string) => {
    setGrades(grades.map(g => g.id === gradeId ? { ...g, deleted: false } : g));
    toast({ title: "Nota Restaurada", description: "La nota ha sido restaurada.", icon: <RotateCcw className="h-5 w-5 text-green-500" /> });
  };

  const openEditModal = (grade: Grade) => {
    setEditingGrade(grade);
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setEditingGrade(null);
    setIsModalOpen(true);
  };

  // Use legacyStudents for the main student filter dropdown
  const availableStudentsForFilter = useMemo(() => {
    return selectedCampus ? legacyStudents : [];
  }, [legacyStudents, selectedCampus]);


  const filteredGradesToDisplay = useMemo(() => {
    if (!selectedStudentFilterId) return []; // Only show grades if a student is selected for viewing
    return grades.filter(grade => {
      const isCorrectStudent = grade.studentId === selectedStudentFilterId;
      const isCorrectStatus = viewMode === 'active' ? !grade.deleted : grade.deleted;
      
      const studentDetails = MOCK_STUDENTS.find(s => s.id === grade.studentId);
      const courseDetails = MOCK_COURSES.find(c => c.id === grade.courseId);

      const matchesSearch =
        (courseDetails?.name.toLowerCase().includes(gradeSearchTerm.toLowerCase()) ||
          String(grade.grade).toLowerCase().includes(gradeSearchTerm.toLowerCase()) ||
          grade.academicPeriod.toLowerCase().includes(gradeSearchTerm.toLowerCase()) ||
          grade.evaluationType.toLowerCase().includes(gradeSearchTerm.toLowerCase())
        );
      return isCorrectStudent && isCorrectStatus && matchesSearch;
    });
  }, [grades, selectedStudentFilterId, gradeSearchTerm, viewMode]);

  const getStudentFullName = (studentId: string) => {
    const student = MOCK_STUDENTS.find(s => s.id === studentId);
    return student ? student.fullName : "Desconocido";
  };
  
  const getCourseName = (courseId: string) => {
    const course = MOCK_COURSES.find(c => c.id === courseId);
    return course ? course.name : "Desconocido";
  };

  const selectedStudentForViewingName = selectedStudentFilterId ? getStudentFullName(selectedStudentFilterId) : 'el estudiante';

  if (isAuthLoading || !currentUser || !studentsLoaded || isLoadingGrades || campusLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
          <p className="ml-4 text-lg text-muted-foreground">Cargando datos de notas...</p>
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
              Por favor, seleccione una sede desde el <Link href="/teacher/dashboard" className="text-primary hover:underline">Dashboard</Link> para gestionar las notas.
            </CardDescription>
          </CardHeader>
        </Card>
      </DashboardLayout>
    );
  }


  return (
    <DashboardLayout>
      <Card className="w-full shadow-lg">
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <GraduationCap className="h-10 w-10 text-primary" />
            <div>
              <CardTitle className="text-2xl font-bold">Registro Auxiliar de Notas</CardTitle>
              <CardDescription>
                Sede: {selectedCampus.name}. Gestione las calificaciones de los estudiantes.
              </CardDescription>
            </div>
          </div>
          {viewMode === 'active' && (
            <Button onClick={openAddModal} disabled={availableStudentsForFilter.length === 0}>
              <PlusCircle className="mr-2 h-5 w-5" />
              Agregar Nota
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 border rounded-md shadow-sm bg-muted/20">
            <h3 className="text-lg font-semibold mb-3 text-primary flex items-center">
              <UsersIcon className="mr-2 h-5 w-5" />
              Seleccionar Estudiante para Ver Notas
            </h3>
            <Select
              value={selectedStudentFilterId || ""}
              onValueChange={(value) => { setSelectedStudentFilterId(value); setGradeSearchTerm(""); }}
              disabled={availableStudentsForFilter.length === 0}
            >
              <SelectTrigger id="student-filter-select">
                <SelectValue placeholder={
                  availableStudentsForFilter.length === 0 ? "No hay estudiantes en esta sede" :
                      "Seleccione un estudiante..."
                } />
              </SelectTrigger>
              <SelectContent>
                {availableStudentsForFilter.map(student => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.firstName} {student.lastName} ({student.dni}) - {student.grade} &quot;{student.section}&quot;
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
             {availableStudentsForFilter.length === 0 && (
              <p className="text-sm text-muted-foreground mt-1">Agregue estudiantes en la sección de Gestión de Estudiantes.</p>
            )}
          </div>

          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'active' | 'deleted')} className="mb-4">
            <TabsList className="grid w-full grid-cols-2 md:w-1/2">
              <TabsTrigger value="active" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" /> Notas Activas
              </TabsTrigger>
              <TabsTrigger value="deleted" className="flex items-center gap-2">
                <Archive className="h-4 w-4" /> Notas Eliminadas
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {selectedStudentFilterId && (
            <div className="mb-4">
              <Label htmlFor="grade-search-table">Buscar en Notas de {selectedStudentForViewingName} (Materia, Nota, Periodo, Tipo Eval.)</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="grade-search-table"
                  type="search"
                  placeholder="Ej: Matemáticas, Examen Parcial, 15..."
                  value={gradeSearchTerm}
                  onChange={(e) => setGradeSearchTerm(e.target.value)}
                  className="pl-8 w-full"
                />
              </div>
            </div>
          )}

          {selectedStudentFilterId ? (
            filteredGradesToDisplay.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Materia/Curso</TableHead>
                      <TableHead>Tipo Evaluación</TableHead>
                      <TableHead>Nota</TableHead>
                      <TableHead>Periodo Académico</TableHead>
                      <TableHead>Fecha Eval.</TableHead>
                      <TableHead>Observaciones</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredGradesToDisplay.map((grade) => (
                      <TableRow key={grade.id} className={grade.deleted ? 'opacity-60 bg-muted/30 hover:bg-muted/40' : ''}>
                        <TableCell>{getCourseName(grade.courseId)}</TableCell>
                        <TableCell>{grade.evaluationType}</TableCell>
                        <TableCell>{grade.grade}</TableCell>
                        <TableCell>{grade.academicPeriod}</TableCell>
                        <TableCell>{grade.evaluationDate ? format(parseISO(grade.evaluationDate), "dd/MM/yyyy", { locale: es }) : "N/A"}</TableCell>
                        <TableCell className="max-w-[150px] truncate text-xs">{grade.remarks || "-"}</TableCell>
                        <TableCell className="text-right">
                          {viewMode === 'active' ? (
                            <>
                              <Button variant="ghost" size="icon" onClick={() => openEditModal(grade)} className="mr-2" title="Editar Nota">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteGrade(grade.id)} className="text-destructive hover:text-destructive" title="Eliminar Nota">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <Button variant="outline" size="sm" onClick={() => handleRestoreGrade(grade.id)} title="Restaurar Nota">
                              <RotateCcw className="mr-2 h-4 w-4" /> Restaurar
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-border rounded-lg bg-card/50">
                <BookOpen className="h-16 w-16 text-muted-foreground" />
                <p className="text-muted-foreground text-lg mt-4">
                  {gradeSearchTerm ? `No se encontraron notas ${viewMode === 'active' ? 'activas' : 'eliminadas'} con ese criterio para ${selectedStudentForViewingName}.` :
                   viewMode === 'active' ? `No hay notas activas registradas para ${selectedStudentForViewingName}.` : `No hay notas eliminadas para ${selectedStudentForViewingName}.`}
                </p>
                 {viewMode === 'active' && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {gradeSearchTerm ? "Intente con otros términos." : "Agregue una nueva nota para comenzar."}
                  </p>
                 )}
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-border rounded-lg bg-card/50 mt-6">
              <UsersIcon className="h-16 w-16 text-muted-foreground" />
              <p className="text-muted-foreground text-lg mt-4">Seleccione un estudiante</p>
              <p className="text-sm text-muted-foreground mt-2">Utilice el filtro de arriba para encontrar y seleccionar un estudiante y ver sus notas.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={(isOpen) => {
        setIsModalOpen(isOpen);
        if (!isOpen) setEditingGrade(null);
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingGrade ? "Editar Nota" : "Agregar Nueva Nota"}</DialogTitle>
            <DialogDescription>
              {editingGrade ? `Modifique los detalles de la nota.` :
              `Complete los detalles de la nueva nota.`}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
            <div>
              <Label htmlFor="studentId">Estudiante</Label>
              <Controller
                control={form.control}
                name="studentId"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value} disabled={!!editingGrade || availableStudentsForFilter.length === 0}>
                    <SelectTrigger id="studentId" className={cn(form.formState.errors.studentId && "border-destructive")}>
                      <SelectValue placeholder="Seleccione estudiante" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableStudentsForFilter.map(student => (
                        <SelectItem key={student.id} value={student.id}>{student.firstName} {student.lastName} ({student.dni})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.studentId && <p className="text-destructive text-sm mt-1">{form.formState.errors.studentId.message}</p>}
            </div>

            <div>
              <Label htmlFor="courseId">Materia/Curso</Label>
              <Controller
                control={form.control}
                name="courseId"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="courseId" className={cn(form.formState.errors.courseId && "border-destructive")}>
                      <SelectValue placeholder="Seleccione materia/curso" />
                    </SelectTrigger>
                    <SelectContent>
                      {MOCK_COURSES.map(course => (
                        <SelectItem key={course.id} value={course.id}>{course.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.courseId && <p className="text-destructive text-sm mt-1">{form.formState.errors.courseId.message}</p>}
            </div>
            
            <div>
              <Label htmlFor="academicPeriod">Periodo Académico</Label>
               <Controller
                control={form.control}
                name="academicPeriod"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="academicPeriod" className={cn(form.formState.errors.academicPeriod && "border-destructive")}>
                      <SelectValue placeholder="Seleccione periodo" />
                    </SelectTrigger>
                    <SelectContent>
                      {MOCK_ACADEMIC_PERIODS.map(period => (
                        <SelectItem key={period} value={period}>{period}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.academicPeriod && <p className="text-destructive text-sm mt-1">{form.formState.errors.academicPeriod.message}</p>}
            </div>

            <div>
              <Label htmlFor="evaluationType">Tipo de Evaluación</Label>
              <Input id="evaluationType" {...form.register("evaluationType")} placeholder="Ej: Examen Parcial, Tarea" className={cn(form.formState.errors.evaluationType && "border-destructive")} />
              {form.formState.errors.evaluationType && <p className="text-destructive text-sm mt-1">{form.formState.errors.evaluationType.message}</p>}
            </div>

            <div>
              <Label htmlFor="grade">Calificación (0-20)</Label>
              <Input id="grade" type="number" step="0.1" {...form.register("grade")} placeholder="Ej: 15.5" className={cn(form.formState.errors.grade && "border-destructive")} />
              {form.formState.errors.grade && <p className="text-destructive text-sm mt-1">{form.formState.errors.grade.message}</p>}
            </div>

            <div>
              <Label htmlFor="evaluationDate">Fecha de Evaluación</Label>
              <Controller
                control={form.control}
                name="evaluationDate"
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !field.value && "text-muted-foreground",
                          form.formState.errors.evaluationDate && "border-destructive"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(field.value, "PPP", { locale: es }) : <span>Seleccione una fecha</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                        locale={es}
                        disabled={(date) => date > new Date() || date < new Date("2000-01-01")}
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
              {form.formState.errors.evaluationDate && <p className="text-destructive text-sm mt-1">{form.formState.errors.evaluationDate.message}</p>}
            </div>

            <div>
              <Label htmlFor="remarks">Observaciones (Automático/Manual)</Label>
              <Textarea
                id="remarks"
                {...form.register("remarks")}
                placeholder="Ej: AD LMS (Logro Muy Satisfactorio)"
                className={cn(form.formState.errors.remarks && "border-destructive")}
                rows={3}
              />
              {form.formState.errors.remarks && <p className="text-destructive text-sm mt-1">{form.formState.errors.remarks.message}</p>}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button type="submit">{editingGrade ? "Guardar Cambios" : "Agregar Nota"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
