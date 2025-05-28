
"use client";

import React, { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import QRCode from 'qrcode.react';
import { Download, Fingerprint, ImageDown } from 'lucide-react';
import html2canvas from 'html2canvas';
import { useToast } from '@/hooks/use-toast';

interface QrCodeDisplayProps {
  isOpen: boolean;
  onClose: () => void;
  qrValue: string;
  studentName: string;
  studentDni?: string;
}

const QrCodeDisplay: React.FC<QrCodeDisplayProps> = ({
    isOpen,
    onClose,
    qrValue,
    studentName,
    studentDni = "N/A",
}) => {
  const dniCardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  if (!isOpen) return null;

  const handleDownloadCard = async () => {
    if (dniCardRef.current) {
      try {
        toast({
          title: "Generando Carnet",
          description: "Por favor espere...",
        });
        const canvas = await html2canvas(dniCardRef.current, {
          backgroundColor: null, // Use transparent background for the capture
          scale: 2, // Increase scale for better resolution
          useCORS: true, // If you had external images, this would be needed
        });
        const pngUrl = canvas
          .toDataURL("image/png")
          .replace("image/png", "image/octet-stream");
        const downloadLink = document.createElement("a");
        downloadLink.href = pngUrl;
        const safeStudentName = studentName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        downloadLink.download = `Carnet_Estudiante_${safeStudentName}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        toast({
          title: "Descarga Iniciada",
          description: "El carnet del estudiante se está descargando.",
          variant: "default",
        });
      } catch (error) {
        console.error("Error generating card image:", error);
        toast({
          title: "Error al Descargar",
          description: "No se pudo generar la imagen del carnet.",
          variant: "destructive",
        });
      }
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle>Identificación QR del Estudiante</DialogTitle>
          <DialogDescription>
            Carnet digital con código QR para {studentName}.
          </DialogDescription>
        </DialogHeader>

        {/* DNI-like Card */}
        <div
          ref={dniCardRef}
          className="my-6 p-5 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 rounded-xl shadow-lg border border-slate-300 dark:border-slate-600"
        >
          <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-primary/30">
            <div className='flex items-center gap-2'>
                <Fingerprint className="h-7 w-7 text-primary" />
                <h3 className="text-lg font-semibold text-primary">DOCUMENTO ESTUDIANTIL</h3>
            </div>
            <span className="text-xs font-mono text-muted-foreground">EduAssist ID</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-center">
            {/* Student Info */}
            <div className="flex-1 space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">NOMBRES Y APELLIDOS</p>
                <p className="text-lg font-semibold text-foreground leading-tight">{studentName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">NÚMERO DE DOCUMENTO (DNI)</p>
                <p className="text-md font-medium text-foreground">{studentDni}</p>
              </div>
            </div>
             {/* QR Code Section */}
            <div className="flex flex-col items-center justify-center p-2 bg-white rounded-md shadow">
                {qrValue ? (
                <QRCode value={qrValue} size={100} level="H" includeMargin={false} renderAs="canvas" />
                ) : (
                <p className="text-xs text-muted-foreground">Error QR</p>
                )}
            </div>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-4 pt-2 border-t border-primary/20">
            Este carnet es para identificación y registro de asistencia.
          </p>
        </div>

        <DialogFooter className="sm:justify-between gap-2 mt-2">
          <Button onClick={handleDownloadCard} variant="outline" disabled={!qrValue}>
            <ImageDown className="mr-2 h-4 w-4" />
            Descargar Carnet (PNG)
          </Button>
          <Button onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QrCodeDisplay;
