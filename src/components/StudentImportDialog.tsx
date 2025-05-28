"use client";

import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { LegacyStudent } from "@/types";
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { FileUp, Loader2, CheckCircle, AlertTriangle, Info } from 'lucide-react';

interface StudentImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (students: Omit<LegacyStudent, 'id'>[]) => void;
}

const EXPECTED_HEADERS = ["dni", "nombres", "apellidos", "grado", "sección", "nivel", "turno", "celular apoderado"];


const StudentImportDialog: React.FC<StudentImportDialogProps> = ({ isOpen, onClose, onImport }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedStudents, setParsedStudents] = useState<Omit<LegacyStudent, 'id'>[]>([]);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const resetStateForNewFileOrClose = () => {
    setParsedStudents([]);
    setErrorMessages([]);
    setIsLoading(false);
  };

  const clearSelectedFileAndInput = () => {
    setSelectedFile(null);
    const fileInput = document.getElementById('excel-file-input') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    resetStateForNewFileOrClose(); // Clear previous processing results and errors
    
    const file = event.target.files?.[0];
    if (file) {
      const isValidExcel = file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || file.type === "application/vnd.ms-excel";
      const isValidCsvByName = file.name.toLowerCase().endsWith(".csv");
      const isGenericTypeForCsv = file.type === "" || file.type === "application/octet-stream" || file.type === "text/csv";

      if (isValidExcel || (isValidCsvByName && isGenericTypeForCsv)) {
        setSelectedFile(file);
      } else {
        setErrorMessages([`Formato de archivo no válido: ${file.name} (tipo: ${file.type || 'desconocido'}). Por favor, suba un archivo .xlsx, .xls o .csv.`]);
        clearSelectedFileAndInput(); // Clear if invalid
      }
    } else {
      // No file selected (e.g., user cancelled file dialog)
      clearSelectedFileAndInput();
    }
  };

  const processFile = async () => {
    if (!selectedFile) {
      setErrorMessages(["Por favor, seleccione un archivo."]);
      return;
    }
    setIsLoading(true);
    setErrorMessages([]); // Clear previous errors before processing new file
    setParsedStudents([]); // Clear previous students

    try {
      const data = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      if (!jsonData || jsonData.length < 2) {
        throw new Error("El archivo está vacío o no tiene el formato esperado (mínimo una fila de encabezados y una de datos).");
      }

      const headers = (jsonData[0] as string[]).map(h => String(h || '').trim().toLowerCase());
      
      const headerMap: Record<string, number> = {};
      EXPECTED_HEADERS.forEach(expectedHeader => {
        const foundIndex = headers.findIndex(h => {
            if (expectedHeader === "sección") return h.includes("secci"); 
            if (expectedHeader === "celular apoderado") return (h.includes("celular") || h.includes("telefono") || h.includes("teléfono")) && (h.includes("apoderado") || h.includes("tutor"));
            if (expectedHeader === "nombres") return h === "nombres" || h === "nombre";
            return h === expectedHeader;
        });
        if (foundIndex !== -1) {
            headerMap[expectedHeader] = foundIndex;
        }
      });

      const missingHeaders = EXPECTED_HEADERS.filter(eh => !(eh in headerMap) && eh !== "celular apoderado"); 
       if (missingHeaders.length > 0) {
         const requiredMissing = missingHeaders.filter(h => h !== "celular apoderado"); // "celular apoderado" is optional
         if (requiredMissing.length > 0) {
            throw new Error(`Faltan los siguientes encabezados requeridos: ${requiredMissing.join(', ')}. Encabezados encontrados: ${headers.join(', ')}`);
         }
      }


      const students: Omit<LegacyStudent, 'id'>[] = [];
      const currentErrors: string[] = [];

      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row || row.every(cell => cell === null || cell === undefined || String(cell).trim() === "")) continue;

        const student: Partial<Omit<LegacyStudent, 'id'>> = {};
        student.dni = String(row[headerMap["dni"]] || '').trim();
        student.firstName = String(row[headerMap["nombres"]] || '').trim(); // This will use "nombres" which now maps to "nombre" or "nombres"
        student.lastName = String(row[headerMap["apellidos"]] || '').trim();
        student.grade = String(row[headerMap["grado"]] || '').trim();
        student.section = String(row[headerMap["sección"]] || '').trim().toUpperCase();
        student.level = String(row[headerMap["nivel"]] || '').trim() as LegacyStudent['level'];
        student.shift = String(row[headerMap["turno"]] || '').trim() as LegacyStudent['shift'];
        
        if (headerMap["celular apoderado"] !== undefined && row[headerMap["celular apoderado"]] !== undefined && row[headerMap["celular apoderado"]] !== null) {
            student.guardianPhoneNumber = String(row[headerMap["celular apoderado"]]).trim();
        } else {
            student.guardianPhoneNumber = ""; // Default to empty string if header or value is missing
        }


        // Basic validation
        if (!student.dni || !student.firstName || !student.lastName || !student.grade || !student.section || !student.level || !student.shift) {
          currentErrors.push(`Fila ${i + 1}: Faltan datos esenciales (DNI, Nombres, Apellidos, Grado, Sección, Nivel o Turno).`);
          continue;
        }
        if (!['Inicial', 'Primaria', 'Secundaria'].includes(student.level)) {
          currentErrors.push(`Fila ${i + 1} (DNI ${student.dni}): Nivel '${student.level}' no válido. Use 'Inicial', 'Primaria' o 'Secundaria'.`);
          continue;
        }
        if (!['Mañana', 'Tarde'].includes(student.shift)) {
          currentErrors.push(`Fila ${i + 1} (DNI ${student.dni}): Turno '${student.shift}' no válido. Use 'Mañana' o 'Tarde'.`);
          continue;
        }
        if (student.guardianPhoneNumber && !/^\d{7,15}$/.test(student.guardianPhoneNumber) && student.guardianPhoneNumber !== "") {
            currentErrors.push(`Fila ${i + 1} (DNI ${student.dni}): Número de celular del apoderado '${student.guardianPhoneNumber}' no es válido.`);
            // Allow import even if phone is invalid, but warn
        }
        students.push(student as Omit<LegacyStudent, 'id'>);
      }
      
      setParsedStudents(students);
      if (currentErrors.length > 0) {
          setErrorMessages(prev => [...prev, ...currentErrors.slice(0, 5)]); 
          if (currentErrors.length > 5) {
              setErrorMessages(prev => [...prev, `Y ${currentErrors.length - 5} errores más...`]);
          }
      }
      if (students.length === 0 && currentErrors.length === 0 && jsonData.length > 1) { // jsonData.length > 1 means there were data rows
         setErrorMessages(["No se encontraron estudiantes válidos en el archivo después del procesamiento."]);
      } else if (students.length === 0 && jsonData.length <=1) {
         setErrorMessages(["El archivo no contiene filas de datos de estudiantes."]);
      }


    } catch (e: any) {
      console.error("Error parsing Excel:", e);
      setErrorMessages([e.message || "Error al procesar el archivo Excel. Verifique el formato y los encabezados."]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmImport = () => {
    if (parsedStudents.length > 0) {
      onImport(parsedStudents);
      handleClose(); // Close after successful import
    } else {
      toast({
        variant: "destructive",
        title: "Importación Fallida",
        description: "No hay estudiantes válidos para importar. Por favor, revise el archivo y los errores."
      });
    }
  };

  const handleClose = () => {
    resetStateForNewFileOrClose();
    clearSelectedFileAndInput();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center">
            <FileUp className="mr-2 h-6 w-6 text-primary" />
            Importar Estudiantes desde Excel/CSV
          </DialogTitle>
          <DialogDescription>
            Suba un archivo (.xlsx, .xls, .csv) con los datos de los estudiantes.
            Asegúrese de que el archivo tenga los encabezados: {EXPECTED_HEADERS.join(', ')}.
            El encabezado &quot;celular apoderado&quot; es opcional.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div>
            <Label htmlFor="excel-file-input">Seleccionar Archivo</Label>
            <Input
              id="excel-file-input"
              type="file"
              accept=".xlsx,.xls,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
              onChange={handleFileChange}
              className="mt-1"
              disabled={isLoading}
            />
          </div>

          {errorMessages.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Errores Encontrados</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside max-h-32 overflow-y-auto text-xs">
                  {errorMessages.map((err, i) => <li key={i}>{err}</li>)}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {parsedStudents.length > 0 && !isLoading && errorMessages.length === 0 && (
             <Alert variant="default" className="bg-accent/10 border-accent">
                <CheckCircle className="h-4 w-4 text-accent" />
                <AlertTitle>Archivo Procesado Exitosamente</AlertTitle>
                <AlertDescription>
                    Se han encontrado {parsedStudents.length} estudiantes listos para importar.
                </AlertDescription>
             </Alert>
          )}
           {parsedStudents.length > 0 && !isLoading && errorMessages.length > 0 && (
             <Alert variant="default" className="bg-yellow-500/10 border-yellow-500">
                <Info className="h-4 w-4 text-yellow-600" />
                <AlertTitle>Archivo Procesado con Advertencias</AlertTitle>
                <AlertDescription>
                    Se han encontrado {parsedStudents.length} estudiantes para importar, pero algunas filas tuvieron problemas (ver errores arriba).
                </AlertDescription>
             </Alert>
          )}


           {selectedFile && parsedStudents.length === 0 && !isLoading && errorMessages.length === 0 && (
             <Alert variant="default">
                <Info className="h-4 w-4" />
                <AlertTitle>Archivo Seleccionado</AlertTitle>
                <AlertDescription>
                    Archivo: {selectedFile.name}. Haga clic en &quot;Procesar Archivo&quot;.
                </AlertDescription>
             </Alert>
          )}


        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancelar
          </Button>
          {parsedStudents.length === 0 || errorMessages.some(e => e.includes("Faltan los siguientes encabezados requeridos")) ? (
            <Button onClick={processFile} disabled={!selectedFile || isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Procesar Archivo
            </Button>
          ) : (
            <Button onClick={handleConfirmImport} disabled={isLoading || parsedStudents.length === 0} className="bg-accent hover:bg-accent/90">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
              Confirmar e Importar {parsedStudents.length > 0 ? `(${parsedStudents.length})` : ''}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StudentImportDialog;

