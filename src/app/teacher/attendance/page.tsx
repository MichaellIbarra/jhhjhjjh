
// @ts-nocheck
"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CalendarCheck, CalendarIcon, Users, QrCode, ScanLine, CheckCircle, XCircle, Loader2, AlertTriangle, Building2, Search, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { LegacyStudent, LegacyAttendanceRecord } from "@/types";
import { useToast } from "@/hooks/use-toast";
import QrCodeDisplay from "@/components/QrCodeDisplay";
import QrScanner from "@/components/QrScanner";
import { useStudentContext } from "@/contexts/StudentContext";
import { useCampusContext } from "@/contexts/CampusContext";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext"; // Added useAuth
import { useRouter } from "next/navigation"; // Added useRouter

type AttendanceStatus = LegacyAttendanceRecord["status"];

const getAttendanceStorageKey = (date: Date, campusId?: string) => 
  `eduassist_attendance_${campusId ? campusId + '_' : ''}${format(date, "yyyy-MM-dd")}`;

interface QrScannerModalContentProps {
  selectedDate: Date;
  onAttendanceRecorded: (studentId: string, studentName: string) => void;
  onClose: () => void;
  getStudentById: (studentId: string) => LegacyStudent | undefined;
  isQrScannerModalOpen: boolean;
}

const QrScannerModalContent: React.FC<QrScannerModalContentProps> = ({ selectedDate, onAttendanceRecorded, onClose, getStudentById, isQrScannerModalOpen }) => {
  const { toast } = useToast();
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [lastScannedData, setLastScannedData] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const html5QrCodeRef = useRef(null); 

  const resetScanner = async () => {
    setScanResult(null);
    setError(null);
    setLastScannedData(null);
    setHasCameraPermission(null); 
    setIsScanning(false); 
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
      } catch (e) {
        console.error("Error stopping scanner on reset:", e);
      }
    }
  };

  useEffect(() => {
    let streamInstance: MediaStream | null = null;
    const requestCameraPermission = async () => {
      if (typeof navigator !== "undefined" && navigator.mediaDevices) {
        try {
          streamInstance = await navigator.mediaDevices.getUserMedia({ video: true });
          setHasCameraPermission(true);
          setIsScanning(true); 
        } catch (err) {
          setHasCameraPermission(false);
          setError("No se pudo acceder a la cámara. Por favor, verifique los permisos.");
          console.error("Camera permission error:", err);
          toast({
            variant: "destructive",
            title: "Error de Cámara",
            description: "Por favor, habilite los permisos de cámara en su navegador.",
          });
        }
      } else {
         setHasCameraPermission(false);
         setError("El acceso a multimedia no está disponible en este navegador.");
      }
    };

    if (isQrScannerModalOpen && hasCameraPermission === null) { 
        requestCameraPermission();
    }
    
    return () => { 
      if (streamInstance) {
        streamInstance.getTracks().forEach(track => track.stop());
      }
       if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch(console.error);
      }
    };
  }, [toast, hasCameraPermission, isQrScannerModalOpen]);


  const handleScanSuccess = (decodedText: string) => {
    if (decodedText === lastScannedData) {
      return; 
    }
    setLastScannedData(decodedText);
    setIsScanning(false); 
    setScanResult(decodedText);
    setError(null);

    try {
      const qrData = JSON.parse(decodedText);
      if (qrData.type === "eduassist_student_id" && qrData.studentId && qrData.studentName) {
        const student = getStudentById(qrData.studentId);
        if (student) {
          onAttendanceRecorded(qrData.studentId, qrData.studentName);
          toast({
            title: "Asistencia Registrada por QR",
            description: `${qrData.studentName} marcado(a) como presente para el ${format(selectedDate, "PPP", { locale: es })}.`,
            className: "bg-accent text-accent-foreground",
          });
        } else {
           throw new Error("Estudiante no encontrado en la lista actual.");
        }
      } else {
        throw new Error("Código QR no es válido para identificación de estudiante.");
      }
    } catch (e: any) {
      console.error("Error processing QR code:", e);
      setError(e.message || "Error al procesar el código QR.");
      toast({
        title: "Error de QR",
        description: e.message || "El código QR escaneado no es válido o está malformado.",
        variant: "destructive",
      });
    }
  };
  
  const handleScanFailure = (errorMessage: string) => {
     // console.warn(`QR Scan Failure: ${errorMessage}`);
  };
  
  if (hasCameraPermission === null && isQrScannerModalOpen) { 
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg">Verificando permisos de cámara...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-2">
       <Alert variant="default">
        <CalendarCheck className="h-4 w-4" />
        <AlertTitle>Fecha de Asistencia</AlertTitle>
        <AlertDescription>
          Registrando asistencia para el: <strong>{format(selectedDate, "PPP", { locale: es })}</strong>.
        </AlertDescription>
      </Alert>

      {!hasCameraPermission && isQrScannerModalOpen && ( 
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error de Cámara</AlertTitle>
          <AlertDescription>
            {error || "No se pudo acceder a la cámara. Por favor, asegúrese de que la aplicación tiene permisos para usar la cámara en la configuración de su navegador e inténtelo de nuevo."}
            <Button onClick={resetScanner} variant="link" className="p-0 h-auto ml-1 underline">Reintentar</Button>
          </AlertDescription>
        </Alert>
      )}

      {hasCameraPermission && isScanning && (
         <div className="border-2 border-dashed border-primary/50 p-4 rounded-lg bg-primary/5 aspect-video flex items-center justify-center min-h-[300px] overflow-hidden">
          <QrScanner
            onScanSuccess={handleScanSuccess}
            onScanFailure={handleScanFailure}
            qrboxSize={200} 
            fps={5}
          />
        </div>
      )}

      {scanResult && !isScanning && (
        <Alert className="bg-accent/10 border-accent text-accent-foreground">
          <CheckCircle className="h-5 w-5 text-accent" />
          <AlertTitle>Escaneo Exitoso</AlertTitle>
          <AlertDescription>
            Código QR procesado. Verifique la notificación para más detalles.
            <pre className="mt-2 p-2 bg-muted/50 rounded text-xs overflow-auto max-h-20">{scanResult}</pre>
          </AlertDescription>
        </Alert>
      )}
       {error && !isScanning && !hasCameraPermission && ( 
        <Alert variant="destructive">
          <XCircle className="h-5 w-5" />
          <AlertTitle>Error en Escaneo</AlertTitle>
          <AlertDescription>{error} <Button onClick={resetScanner} variant="link" className="p-0 h-auto ml-1 underline">Reintentar</Button></AlertDescription>
        </Alert>
      )}
       {error && !isScanning && hasCameraPermission && ( 
        <Alert variant="destructive">
          <XCircle className="h-5 w-5" />
          <AlertTitle>Error al Procesar QR</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!isScanning && hasCameraPermission && ( 
        <Button onClick={() => { setScanResult(null); setError(null); setLastScannedData(null); setIsScanning(true);}} className="w-full">
          Escanear Otro Código
        </Button>
      )}
       <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>Cerrar Escáner</Button>
      </DialogFooter>
    </div>
  );
};


const ITEMS_PER_PAGE = 10;
const gradeOptions = ["Todos", "Kinder", "1ro", "2do", "3ro", "4to", "5to"];
const sectionOptions = ["Todas", "A", "B", "C", "D", "E"];

export default function AttendancePage() {
  const { students, getStudentById, isLoaded: studentsLoaded } = useStudentContext();
  const { selectedCampus, isLoadingSelection: campusLoading } = useCampusContext();
  const { currentUser, isAuthLoading } = useAuth(); // Added useAuth
  const router = useRouter(); // Added useRouter
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [attendanceData, setAttendanceData] = useState<Record<string, AttendanceStatus>>({});
  const { toast } = useToast();
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(true);

  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isQrScannerModalOpen, setIsQrScannerModalOpen] = useState(false);
  const [selectedStudentForQr, setSelectedStudentForQr] = useState<LegacyStudent | null>(null);
  const [qrValue, setQrValue] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>("Todos");
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<string>("Todas");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!isAuthLoading && currentUser && currentUser.role === 'superuser') {
      router.push('/admin/dashboard');
    }
  }, [currentUser, isAuthLoading, router]);


  useEffect(() => {
    if (typeof window !== 'undefined' && selectedDate && studentsLoaded && selectedCampus && !campusLoading) {
      setIsLoadingAttendance(true);
      const storageKey = getAttendanceStorageKey(selectedDate, selectedCampus.id);
      const storedAttendance = localStorage.getItem(storageKey);
      
      const campusStudents = students; 

      if (storedAttendance) {
        try {
          setAttendanceData(JSON.parse(storedAttendance));
        } catch (error) {
          console.error("Error parsing attendance from localStorage:", error);
          const initialData: Record<string, AttendanceStatus> = {};
          campusStudents.forEach(student => { initialData[student.id] = 'Presente'; });
          setAttendanceData(initialData);
        }
      } else {
        const initialData: Record<string, AttendanceStatus> = {};
        campusStudents.forEach(student => { initialData[student.id] = 'Presente'; });
        setAttendanceData(initialData);
      }
      setIsLoadingAttendance(false);
    } else if (!selectedCampus && !campusLoading) {
      setAttendanceData({});
      setIsLoadingAttendance(false);
    }
  }, [selectedDate, students, studentsLoaded, selectedCampus, campusLoading]);

  useEffect(() => {
    if (typeof window !== 'undefined' && selectedDate && !isLoadingAttendance && Object.keys(attendanceData).length > 0 && selectedCampus) {
      const storageKey = getAttendanceStorageKey(selectedDate, selectedCampus.id);
      localStorage.setItem(storageKey, JSON.stringify(attendanceData));
    }
  }, [attendanceData, selectedDate, isLoadingAttendance, selectedCampus]);


  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceData(prevData => ({
      ...prevData,
      [studentId]: status,
    }));
  };

  const handleSaveAttendance = () => {
    if (!selectedDate || !selectedCampus) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Por favor, seleccione una fecha y asegúrese de que una sede esté activa.",
      });
      return;
    }
    toast({
      title: "Asistencia Guardada",
      description: `Se ha guardado la asistencia para el ${format(selectedDate, "PPP", { locale: es })} en la sede ${selectedCampus.name}.`,
    });
  };

  const handleShowQr = (student: LegacyStudent) => {
    setSelectedStudentForQr(student);
    const qrData = {
      type: "eduassist_student_id",
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`
    };
    setQrValue(JSON.stringify(qrData));
    setIsQrModalOpen(true);
  };
  
  const handleAttendanceRecordedByQr = (studentId: string, studentName: string) => {
    handleStatusChange(studentId, 'Presente');
  };
  
  const studentsForSelectedCampus = useMemo(() => {
    return selectedCampus ? students : [];
  }, [students, selectedCampus]);

  const filteredStudents = useMemo(() => {
    setCurrentPage(1); 
    return studentsForSelectedCampus.filter(student =>
      (selectedGradeFilter === "Todos" || student.grade === selectedGradeFilter) &&
      (selectedSectionFilter === "Todas" || student.section === selectedSectionFilter) &&
      (`${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
       (student.dni && student.dni.toLowerCase().includes(searchTerm.toLowerCase())))
    );
  }, [studentsForSelectedCampus, searchTerm, selectedGradeFilter, selectedSectionFilter]);

  const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE);
  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredStudents.slice(startIndex, endIndex);
  }, [filteredStudents, currentPage]);

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


  if (isAuthLoading || !currentUser || !studentsLoaded || isLoadingAttendance || campusLoading) {
     return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
           <p className="ml-4 text-lg text-muted-foreground">Cargando datos de asistencia...</p>
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
              Por favor, seleccione una sede desde el <Link href="/teacher/dashboard" className="text-primary hover:underline">Dashboard</Link> para gestionar la asistencia.
            </CardDescription>
          </CardHeader>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Card className="w-full shadow-lg">
        <CardHeader className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <CalendarCheck className="h-10 w-10 text-primary" />
            <div>
              <CardTitle className="text-2xl font-bold">Registro de Asistencia Digital</CardTitle>
              <CardDescription>
                Sede: {selectedCampus.name}. Registre asistencia manual, genere QR o escanee.
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className="w-full sm:w-[240px] justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP", { locale: es }) : <span>Seleccione una fecha</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                  locale={es}
                  disabled={(date) => date > new Date() || date < new Date("2000-01-01")}
                />
              </PopoverContent>
            </Popover>
             <Dialog open={isQrScannerModalOpen} onOpenChange={setIsQrScannerModalOpen}>
              <DialogTrigger asChild>
                <Button className="w-full md:w-auto" variant="outline" disabled={!selectedDate} onClick={() => setIsQrScannerModalOpen(true)}>
                  <ScanLine className="mr-2 h-5 w-5" />
                  Escanear Asistencia QR
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md md:max-w-lg lg:max-w-xl">
                <DialogHeader>
                  <DialogTitle>Escanear Código QR de Asistencia</DialogTitle>
                  <DialogDescription>
                    Apunte la cámara al QR del estudiante para registrar su asistencia.
                  </DialogDescription>
                </DialogHeader>
                {selectedDate && isQrScannerModalOpen && ( 
                  <QrScannerModalContent
                    selectedDate={selectedDate}
                    onAttendanceRecorded={handleAttendanceRecordedByQr}
                    onClose={() => setIsQrScannerModalOpen(false)}
                    getStudentById={getStudentById}
                    isQrScannerModalOpen={isQrScannerModalOpen}
                  />
                )}
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-2 flex-grow sm:flex-grow-0">
                <Search className="text-muted-foreground" />
                <Input
                placeholder="Buscar por nombre o DNI..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-xs" 
                />
            </div>
            <div className="flex items-center gap-2">
                <Filter className="text-muted-foreground h-5 w-5" />
                <Select value={selectedGradeFilter} onValueChange={setSelectedGradeFilter}>
                    <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Filtrar por Grado" />
                    </SelectTrigger>
                    <SelectContent>
                        {gradeOptions.map(grade => (
                            <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={selectedSectionFilter} onValueChange={setSelectedSectionFilter}>
                    <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Filtrar por Sección" />
                    </SelectTrigger>
                    <SelectContent>
                        {sectionOptions.map(section => (
                            <SelectItem key={section} value={section}>{section}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
          </div>

          {paginatedStudents.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Estudiante</TableHead>
                      <TableHead>Grado y Sección</TableHead>
                      <TableHead className="w-[200px]">Estado</TableHead>
                      <TableHead className="text-center">Código QR</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>{student.firstName} {student.lastName}</TableCell>
                        <TableCell>{student.grade} &quot;{student.section}&quot;</TableCell>
                        <TableCell>
                          <Select
                            value={attendanceData[student.id] || 'Presente'}
                            onValueChange={(value: AttendanceStatus) => handleStatusChange(student.id, value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione estado" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Presente">Presente</SelectItem>
                              <SelectItem value="Ausente">Ausente</SelectItem>
                              <SelectItem value="Tardanza">Tardanza</SelectItem>
                              <SelectItem value="Justificado">Justificado</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button variant="ghost" size="icon" onClick={() => handleShowQr(student)} title="Mostrar Código QR">
                            <QrCode className="h-5 w-5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                <Button onClick={handleSaveAttendance} className="w-full sm:w-auto">
                  Guardar Asistencia Manual
                </Button>
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handlePrevPage}
                      disabled={currentPage === 1}
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
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-border rounded-lg bg-card/50">
              <Users className="h-16 w-16 text-muted-foreground" />
              <p className="text-muted-foreground text-lg mt-4">
                {searchTerm || selectedGradeFilter !== "Todos" || selectedSectionFilter !== "Todas" ? "No se encontraron estudiantes con los filtros aplicados." : "No hay estudiantes para mostrar en esta sede."}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {searchTerm ? "Intente con otros términos de búsqueda o " : ""}
                {(selectedGradeFilter !== "Todos" || selectedSectionFilter !== "Todas") ? "ajuste los filtros o " : ""}
                Agregue estudiantes en la sección de Gestión de Estudiantes para esta sede.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedStudentForQr && (
        <QrCodeDisplay
          isOpen={isQrModalOpen}
          onClose={() => setIsQrModalOpen(false)}
          qrValue={qrValue}
          studentName={`${selectedStudentForQr.firstName} ${selectedStudentForQr.lastName}`}
          studentDni={selectedStudentForQr.dni}
        />
      )}
    </DashboardLayout>
  );
}
