
// @ts-nocheck
"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { FileText, UserCircle, BarChart2, ClipboardList, AlertCircle, CalendarCheck, Download, Loader2, Building2 } from "lucide-react";
import type { LegacyStudent, LegacyProgressReport, LegacyGrade, LegacyAttendanceRecord } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import jsPDF from 'jspdf';
import 'jspdf-autotable'; 
import * as XLSX from 'xlsx';
import { useStudentContext } from "@/contexts/StudentContext";
import { useCampusContext } from "@/contexts/CampusContext";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext"; // Added useAuth
import { useRouter } from "next/navigation"; // Added useRouter

const getGradesStorageKey = (campusId?: string) => 
  `eduassist_grades_${campusId ? campusId + '_' : ''}`;
const getAttendanceStorageKey = (date: Date, campusId?: string) => 
  `eduassist_attendance_${campusId ? campusId + '_' : ''}${format(date, "yyyy-MM-dd")}`;

const mockPeriods: string[] = ["Bimestre 1", "Bimestre 2", "Bimestre 3", "Bimestre 4"];

function generateReport(student: LegacyStudent | undefined, period: string, allGrades: LegacyGrade[], campusId: string): LegacyProgressReport | null {
  if (!student) return null;

  const studentGrades = allGrades.filter(g => g.studentId === student.id && g.period === period);
  
  let presentDays = 0;
  let absentDays = 0;
  let lateDays = 0;
  let totalConsideredDays = 0;

  const today = new Date();
  for (let i = 0; i < 60; i++) { 
      const dateToCheck = new Date(today);
      dateToCheck.setDate(today.getDate() - i);
      const attendanceForDateKey = getAttendanceStorageKey(dateToCheck, campusId);
      
      let dailyAttendance = null;
      if (typeof window !== 'undefined') {
          const storedData = localStorage.getItem(attendanceForDateKey);
          if (storedData) {
              try {
                dailyAttendance = JSON.parse(storedData);
              } catch (e) { /* ignore */ }
          }
      }

      if (dailyAttendance && dailyAttendance[student.id]) {
          totalConsideredDays++;
          const status = dailyAttendance[student.id];
          if (status === 'Presente') presentDays++;
          else if (status === 'Ausente') absentDays++;
          else if (status === 'Tardanza') lateDays++;
      }
  }

  return {
    id: `report-${student.id}-${period.replace(" ", "-")}`,
    studentId: student.id,
    period: period,
    summary: `Informe de progreso para ${student.firstName} ${student.lastName} durante el ${period}. En general, ${student.firstName} ha demostrado un progreso ${studentGrades.length > 1 && (studentGrades[0].gradeValue === "AD" || Number(studentGrades[0].gradeValue) > 15) ? "sobresaliente" : "adecuado"} en sus asignaturas. Se recomienda seguir fomentando la participación activa en clase.`,
    gradesBySubject: studentGrades.map(g => ({ subject: g.subjectArea, grade: g.gradeValue, comments: "Buen desempeño." })),
    behavioralObservations: "Muestra una actitud positiva y colaboradora en el aula. A veces se distrae durante las explicaciones, pero responde bien a los recordatorios.",
    futRequests: [ 
      { date: new Date(Date.now() - 86400000 * 5).toISOString(), reason: "Solicitud de constancia de estudios.", status: "Atendido" },
    ],
    attendanceSummary: {
      totalDays: totalConsideredDays, 
      present: presentDays,
      absent: absentDays,
      late: lateDays,
    }
  };
}


function downloadFile(blob: Blob, filename: string) {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

function createPdf(report: LegacyProgressReport, student: LegacyStudent): jsPDF {
  const doc = new jsPDF();
  const generationDate = format(new Date(), "dd/MM/yyyy HH:mm", { locale: es });

  doc.setFontSize(18);
  doc.text(`Informe de Progreso - ${report.period}`, 14, 22);
  doc.setFontSize(11);
  doc.text(`Estudiante: ${student.firstName} ${student.lastName}`, 14, 30);
  doc.text(`Grado y Sección: ${student.grade} "${student.section}" (${student.level})`, 14, 36);
  doc.text(`Generado el: ${generationDate}`, 14, 42);

  let yPos = 55;

  doc.setFontSize(14);
  doc.text("Resumen General", 14, yPos);
  yPos += 7;
  doc.setFontSize(10);
  const summaryLines = doc.splitTextToSize(report.summary, 180);
  doc.text(summaryLines, 14, yPos);
  yPos += summaryLines.length * 5 + 10;

  if (report.gradesBySubject.length > 0) {
    doc.setFontSize(14);
    doc.text("Calificaciones por Área", 14, yPos);
    yPos += 7;
    (doc as any).autoTable({
      startY: yPos,
      head: [['Área/Asignatura', 'Calificación', 'Comentarios']],
      body: report.gradesBySubject.map(g => [g.subject, String(g.grade), g.comments || 'N/A']),
      theme: 'striped',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontSize: 10 },
      margin: { top: yPos },
    });
    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  if (report.attendanceSummary) {
    doc.setFontSize(14);
    doc.text("Resumen de Asistencia", 14, yPos);
    yPos += 7;
    doc.setFontSize(10);
    doc.text(`Total Días (Ref.): ${report.attendanceSummary.totalDays}`, 14, yPos); yPos += 5;
    doc.text(`Presente: ${report.attendanceSummary.present}`, 14, yPos); yPos += 5;
    doc.text(`Ausente: ${report.attendanceSummary.absent}`, 14, yPos); yPos += 5;
    doc.text(`Tardanzas: ${report.attendanceSummary.late}`, 14, yPos); yPos += 10;
  }

  doc.setFontSize(14);
  doc.text("Observaciones Conductuales", 14, yPos);
  yPos += 7;
  doc.setFontSize(10);
  const obsLines = doc.splitTextToSize(report.behavioralObservations || "Sin observaciones.", 180);
  doc.text(obsLines, 14, yPos);
  yPos += obsLines.length * 5 + 10;

  if (report.futRequests && report.futRequests.length > 0) {
    doc.setFontSize(14);
    doc.text("Solicitudes (FUT)", 14, yPos);
    yPos += 7;
    (doc as any).autoTable({
      startY: yPos,
      head: [['Fecha', 'Motivo', 'Estado']],
      body: report.futRequests.map(f => [format(new Date(f.date), "dd/MM/yyyy", { locale: es }), f.reason, f.status]),
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontSize: 10 },
    });
  }
  return doc;
}

function createCsv(report: LegacyProgressReport, student: LegacyStudent): string {
  let csvContent = "Tipo de Dato,Clave,Valor\n";

  csvContent += `Información del Estudiante,ID,"${student.id}"\n`;
  csvContent += `Información del Estudiante,Nombre,"${student.firstName} ${student.lastName}"\n`;
  csvContent += `Información del Estudiante,Grado,"${student.grade}"\n`;
  csvContent += `Información del Estudiante,Sección,"${student.section}"\n`;
  csvContent += `Información del Estudiante,Nivel,"${student.level}"\n`;
  csvContent += `Información del Estudiante,Periodo,"${report.period}"\n\n`;
  
  csvContent += `Resumen General,"${report.summary.replace(/"/g, '""')}"\n\n`;

  csvContent += "Calificaciones,Materia,Nota,Comentarios\n";
  report.gradesBySubject.forEach(g => {
    csvContent += `Calificaciones,"${g.subject}","${g.grade}","${g.comments ? g.comments.replace(/"/g, '""') : 'N/A'}"\n`;
  });
  csvContent += "\n";

  if (report.attendanceSummary) {
    csvContent += "Asistencia,Total Días (Ref.),Presente,Ausente,Tardanzas\n";
    csvContent += `Asistencia,${report.attendanceSummary.totalDays},${report.attendanceSummary.present},${report.attendanceSummary.absent},${report.attendanceSummary.late}\n\n`;
  }

  csvContent += `Observaciones Conductuales,"${report.behavioralObservations ? report.behavioralObservations.replace(/"/g, '""') : 'Sin observaciones.'}"\n\n`;
  
  if (report.futRequests && report.futRequests.length > 0) {
    csvContent += "Solicitudes FUT,Fecha,Motivo,Estado\n";
    report.futRequests.forEach(f => {
      csvContent += `Solicitudes FUT,"${format(new Date(f.date), "dd/MM/yyyy", { locale: es })}","${f.reason.replace(/"/g, '""')}","${f.status}"\n`;
    });
  }
  return csvContent;
}

function createXls(report: LegacyProgressReport, student: LegacyStudent): ArrayBuffer {
  const wb = XLSX.utils.book_new();

  const summaryData = [
    ["Informe de Progreso -", report.period],
    ["Estudiante:", `${student.firstName} ${student.lastName}`],
    ["Grado y Sección:", `${student.grade} "${student.section}" (${student.level})`],
    ["Generado el:", format(new Date(), "dd/MM/yyyy HH:mm", { locale: es })],
    [], 
    ["Resumen General:"],
    [report.summary],
    [],
    ["Observaciones Conductuales:"],
    [report.behavioralObservations || "Sin observaciones."],
  ];
  if (report.attendanceSummary) {
    summaryData.push(
      [],
      ["Resumen de Asistencia:"],
      ["Total Días (Ref.)", report.attendanceSummary.totalDays],
      ["Presente", report.attendanceSummary.present],
      ["Ausente", report.attendanceSummary.absent],
      ["Tardanzas", report.attendanceSummary.late]
    );
  }
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, "Resumen");

  if (report.gradesBySubject.length > 0) {
    const gradesHeader = ["Área/Asignatura", "Calificación", "Comentarios"];
    const gradesBody = report.gradesBySubject.map(g => [g.subject, String(g.grade), g.comments || 'N/A']);
    const wsGrades = XLSX.utils.aoa_to_sheet([gradesHeader, ...gradesBody]);
    XLSX.utils.book_append_sheet(wb, wsGrades, "Calificaciones");
  }

  if (report.futRequests && report.futRequests.length > 0) {
    const futHeader = ["Fecha", "Motivo", "Estado"];
    const futBody = report.futRequests.map(f => [format(new Date(f.date), "dd/MM/yyyy", { locale: es }), f.reason, f.status]);
    const wsFut = XLSX.utils.aoa_to_sheet([futHeader, ...futBody]);
    XLSX.utils.book_append_sheet(wb, wsFut, "Solicitudes FUT");
  }

  return XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
}


export default function ReportsPage() {
  const { students, getStudentById, isLoaded: studentsLoaded } = useStudentContext();
  const { selectedCampus, isLoadingSelection: campusLoading } = useCampusContext();
  const { currentUser, isAuthLoading } = useAuth(); // Added useAuth
  const router = useRouter(); // Added useRouter
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>(mockPeriods[0]);
  const [reportData, setReportData] = useState<LegacyProgressReport | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();
  const [allGrades, setAllGrades] = useState<LegacyGrade[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    if (!isAuthLoading && currentUser && currentUser.role === 'superuser') {
      router.push('/admin/dashboard');
    }
  }, [currentUser, isAuthLoading, router]);


  useEffect(() => {
    if (typeof window !== 'undefined' && selectedCampus && !campusLoading) {
      setIsLoadingData(true);
      const gradesKey = getGradesStorageKey(selectedCampus.id);
      const storedGrades = localStorage.getItem(gradesKey);
      if (storedGrades) {
        try {
          setAllGrades(JSON.parse(storedGrades));
        } catch (e) { console.error("Failed to parse grades for reports", e); setAllGrades([]); }
      } else {
        setAllGrades([]);
      }
      setIsLoadingData(false);
    } else if (!selectedCampus && !campusLoading) {
        setAllGrades([]);
        setIsLoadingData(false);
    }
  }, [selectedCampus, campusLoading]);


  const handleGenerateReport = () => {
    if (!selectedStudentId || !selectedPeriod || !selectedCampus) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Por favor, seleccione una sede, un estudiante y un periodo.",
      });
      return;
    }
    const student = getStudentById(selectedStudentId);
    const generatedReport = generateReport(student, selectedPeriod, allGrades, selectedCampus.id);
    setReportData(generatedReport);
    if (generatedReport) {
      toast({
        title: "Informe Generado",
        description: `Se ha generado el informe para el estudiante seleccionado.`,
      });
    } else {
       toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo generar el informe para el estudiante seleccionado.",
      });
    }
  };

  const handleExportReport = async (formatType: 'pdf' | 'csv' | 'xls') => {
    const studentDetails = selectedStudentId ? getStudentById(selectedStudentId) : null;
    if (!reportData || !studentDetails) {
      toast({
        variant: "destructive",
        title: "Error de Exportación",
        description: "No hay informe generado o datos del estudiante para exportar.",
      });
      return;
    }
    
    setIsExporting(true);
    toast({ title: "Preparando descarga...", description: `Generando informe en formato ${formatType.toUpperCase()}.` });

    let blob: Blob;
    let filename: string;
    const baseFilename = `Informe_${studentDetails.firstName.replace(/\s+/g, "_")}_${studentDetails.lastName.replace(/\s+/g, "_")}_${reportData.period.replace(/\s+/g, "_")}`;

    try {
      await new Promise(resolve => setTimeout(resolve, 500)); 

      if (formatType === 'pdf') {
        filename = `${baseFilename}.pdf`;
        const pdfDoc = createPdf(reportData, studentDetails);
        pdfDoc.save(filename); 
        toast({ title: "Descarga Iniciada", description: `El informe PDF '${filename}' se está descargando.` });
      } else if (formatType === 'csv') {
        filename = `${baseFilename}.csv`;
        const csvData = createCsv(reportData, studentDetails);
        blob = new Blob([String.fromCharCode(0xFEFF), csvData], { type: 'text/csv;charset=utf-8;' }); 
        downloadFile(blob, filename);
        toast({ title: "Descarga Iniciada", description: `El informe CSV '${filename}' se está descargando.` });
      } else if (formatType === 'xls') {
        filename = `${baseFilename}.xlsx`;
        const xlsBuffer = createXls(reportData, studentDetails); 
        blob = new Blob([xlsBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        downloadFile(blob, filename);
        toast({ title: "Descarga Iniciada", description: `El informe XLS '${filename}' se está descargando.` });
      }
    } catch (error) {
      console.error("Error exporting report:", error);
      toast({ variant: "destructive", title: "Error de Exportación", description: "No se pudo generar el archivo." });
    } finally {
      setIsExporting(false);
    }
  };
  
  const studentsForSelectedCampus = selectedCampus ? students : []; 
  const currentStudentDetails = selectedStudentId ? getStudentById(selectedStudentId) : null;

  if (isAuthLoading || !currentUser || !studentsLoaded || isLoadingData || campusLoading) {
    return (
     <DashboardLayout>
       <div className="flex items-center justify-center h-full">
         <Loader2 className="h-16 w-16 animate-spin text-primary" />
          <p className="ml-4 text-lg text-muted-foreground">Cargando datos para informes...</p>
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
             Por favor, seleccione una sede desde el <Link href="/teacher/dashboard" className="text-primary hover:underline">Dashboard</Link> para generar informes.
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
            <FileText className="h-10 w-10 text-primary" />
            <div>
              <CardTitle className="text-2xl font-bold">Informes de Progreso</CardTitle>
              <CardDescription>
                Sede: {selectedCampus.name}. Genere y consulte los informes de progreso.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div>
              <label htmlFor="student-select" className="block text-sm font-medium text-foreground mb-1">Estudiante</label>
              <Select value={selectedStudentId || ""} onValueChange={setSelectedStudentId} disabled={studentsForSelectedCampus.length === 0}>
                <SelectTrigger id="student-select">
                  <SelectValue placeholder="Seleccione estudiante" />
                </SelectTrigger>
                <SelectContent>
                  {studentsForSelectedCampus.map(student => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.firstName} {student.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {studentsForSelectedCampus.length === 0 && (
                <p className="text-xs text-muted-foreground mt-1">No hay estudiantes en esta sede.</p>
            )}
            </div>
            <div>
              <label htmlFor="period-select" className="block text-sm font-medium text-foreground mb-1">Periodo</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger id="period-select">
                  <SelectValue placeholder="Seleccione periodo" />
                </SelectTrigger>
                <SelectContent>
                  {mockPeriods.map(period => (
                    <SelectItem key={period} value={period}>
                      {period}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:self-end">
              <Button onClick={handleGenerateReport} className="w-full" disabled={!selectedStudentId || !selectedPeriod}>
                Generar Informe
              </Button>
            </div>
          </div>

          {reportData && currentStudentDetails ? (
            <Card className="mt-6 border-primary shadow-md">
              <CardHeader className="bg-primary/10">
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="text-xl text-primary">Informe de Progreso - {reportData.period}</CardTitle>
                        <CardDescription>Estudiante: {currentStudentDetails.firstName} {currentStudentDetails.lastName} - {currentStudentDetails.grade} &quot;{currentStudentDetails.section}&quot; ({currentStudentDetails.level})</CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" disabled={isExporting}>
                            {isExporting ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                            ) : (
                                <Download className="mr-2 h-4 w-4"/>
                            )}
                            Descargar Informe
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleExportReport('pdf')} disabled={isExporting}>
                          Exportar como PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExportReport('csv')} disabled={isExporting}>
                          Exportar como CSV
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExportReport('xls')} disabled={isExporting}>
                          Exportar como XLS
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <section>
                  <h3 className="text-lg font-semibold mb-2 flex items-center"><UserCircle className="mr-2 h-5 w-5 text-primary" /> Resumen General</h3>
                  <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md">{reportData.summary}</p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-2 flex items-center"><BarChart2 className="mr-2 h-5 w-5 text-primary" /> Calificaciones por Área</h3>
                  {reportData.gradesBySubject.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Área/Asignatura</TableHead>
                          <TableHead>Calificación</TableHead>
                          <TableHead>Comentarios</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.gradesBySubject.map((gradeItem, index) => (
                          <TableRow key={index}>
                            <TableCell>{gradeItem.subject}</TableCell>
                            <TableCell className="font-medium">{String(gradeItem.grade)}</TableCell>
                            <TableCell className="text-xs italic">{gradeItem.comments}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                     <p className="text-sm text-muted-foreground">No hay calificaciones registradas para este periodo.</p>
                  )}
                </section>
                
                {reportData.attendanceSummary && (
                <section>
                  <h3 className="text-lg font-semibold mb-2 flex items-center"><CalendarCheck className="mr-2 h-5 w-5 text-primary" /> Resumen de Asistencia</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="bg-muted/30 p-3 rounded-md"><strong>Total Días (Ref.):</strong> {reportData.attendanceSummary.totalDays}</div>
                    <div className="bg-accent/10 p-3 rounded-md"><strong>Presente:</strong> {reportData.attendanceSummary.present}</div>
                    <div className="bg-destructive/10 p-3 rounded-md"><strong>Ausente:</strong> {reportData.attendanceSummary.absent}</div>
                    <div className="bg-yellow-400/10 p-3 rounded-md"><strong>Tardanzas:</strong> {reportData.attendanceSummary.late}</div>
                  </div>
                </section>
                )}

                <section>
                  <h3 className="text-lg font-semibold mb-2 flex items-center"><ClipboardList className="mr-2 h-5 w-5 text-primary" /> Observaciones Conductuales</h3>
                  <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md">{reportData.behavioralObservations || "Sin observaciones conductuales registradas."}</p>
                </section>

                {reportData.futRequests && reportData.futRequests.length > 0 && (
                  <section>
                    <h3 className="text-lg font-semibold mb-2 flex items-center"><FileText className="mr-2 h-5 w-5 text-primary" /> Solicitudes (FUT)</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Motivo</TableHead>
                          <TableHead>Estado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.futRequests.map((fut, index) => (
                          <TableRow key={index}>
                            <TableCell>{format(new Date(fut.date), "dd/MM/yyyy", { locale: es })}</TableCell>
                            <TableCell>{fut.reason}</TableCell>
                            <TableCell>{fut.status}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </section>
                )}
              </CardContent>
              <CardFooter className="text-xs text-muted-foreground border-t pt-4">
                Generado el: {format(new Date(), "dd/MM/yyyy HH:mm", { locale: es })}
              </CardFooter>
            </Card>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-border rounded-lg bg-card/50">
              <AlertCircle className="h-16 w-16 text-muted-foreground" />
              <p className="text-muted-foreground text-lg mt-4">
                {selectedStudentId && selectedPeriod ? "No se encontró información para generar el informe." : "Seleccione un estudiante y un periodo para generar el informe."}
              </p>
              <p className="text-sm text-muted-foreground mt-2">Asegúrese de que haya datos de calificaciones y asistencia registrados.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
