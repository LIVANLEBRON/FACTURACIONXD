
 "use client";

 import React, { useState } from 'react';
 import { Button } from "@/components/ui/button";
 import { FileDown, CloudUpload, Loader2 } from "lucide-react";
 import { backupDataToDrive, exportDataAsCsv } from "@/lib/actions";
 import { useToast } from "@/hooks/use-toast";
 import { Separator } from '@/components/ui/separator';

 export function SettingsClient() {
   const [isBackingUp, setIsBackingUp] = useState(false);
   const [isExporting, setIsExporting] = useState(false);
   const { toast } = useToast();

   const handleBackup = async () => {
     setIsBackingUp(true);
     try {
       const result = await backupDataToDrive();
       if (result.success) {
         toast({ title: "Éxito", description: "Copia de seguridad iniciada (funcionalidad simulada)." });
       } else {
         toast({ title: "Aviso", description: result.error || "La copia de seguridad aún no está implementada.", variant: "default" });
       }
     } catch (error) {
       console.error("Backup Error:", error);
       toast({ title: "Error", description: "Error al intentar iniciar la copia de seguridad.", variant: "destructive" });
     } finally {
       setIsBackingUp(false);
     }
   };

   const handleExport = async () => {
     setIsExporting(true);
     try {
       const result = await exportDataAsCsv();
        if (result.data) {
          // Trigger download
          const blob = new Blob([result.data], { type: 'text/csv;charset=utf-8;' });
          const link = document.createElement("a");
          if (link.download !== undefined) { // Feature detection
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `invoicify_export_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
          toast({ title: "Éxito", description: "Exportación CSV generada (funcionalidad simulada)." });
        } else {
          toast({ title: "Aviso", description: result.error || "La exportación CSV aún no está implementada.", variant: "default" });
        }
     } catch (error) {
       console.error("Export Error:", error);
       toast({ title: "Error", description: "Error al intentar exportar los datos.", variant: "destructive" });
     } finally {
       setIsExporting(false);
     }
   };

   return (
     <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
                 <h3 className="font-medium">Copia de Seguridad en Google Drive</h3>
                 <p className="text-sm text-muted-foreground">Guarda una copia de tus datos en tu Google Drive.</p>
            </div>
             <Button onClick={handleBackup} disabled={isBackingUp || isExporting}>
                 {isBackingUp ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CloudUpload className="mr-2 h-4 w-4" />}
                 Iniciar Copia
             </Button>
         </div>

         <Separator />

         <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
             <div>
                 <h3 className="font-medium">Exportar a CSV</h3>
                 <p className="text-sm text-muted-foreground">Descarga tus clientes y facturas en formato CSV.</p>
             </div>
             <Button onClick={handleExport} disabled={isExporting || isBackingUp} variant="secondary">
                 {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
                 Exportar Datos
             </Button>
         </div>
     </div>
   );
 }
 