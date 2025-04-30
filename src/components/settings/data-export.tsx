'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { 
  FileDownIcon, 
  DatabaseBackupIcon, 
  Loader2Icon, 
  CheckIcon 
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { exportDataAsCsv, backupDataToDrive } from '@/lib/actions';
import { useToast } from "@/hooks/use-toast";

export function DataExport() {
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const { toast } = useToast();

  const handleExportCsv = async () => {
    setIsExportingCsv(true);
    try {
      const result = await exportDataAsCsv();
      
      if (result.error) {
        toast({
          title: "Error al exportar datos",
          description: result.error,
          variant: "destructive"
        });
        return;
      }
      
      if (result.data) {
        // Descargar archivos CSV
        downloadCsvFile(result.data.customers, 'clientes.csv');
        downloadCsvFile(result.data.invoices, 'facturas.csv');
        
        toast({
          title: "Datos exportados exitosamente",
          description: "Los archivos CSV han sido descargados.",
          variant: "default"
        });
      }
    } catch (error) {
      console.error("Error exporting data:", error);
      toast({
        title: "Error al exportar datos",
        description: "Ocurrió un error inesperado al exportar los datos.",
        variant: "destructive"
      });
    } finally {
      setIsExportingCsv(false);
    }
  };

  const handleBackupData = async () => {
    setIsBackingUp(true);
    try {
      const result = await backupDataToDrive();
      
      if (result.error) {
        toast({
          title: "Error al crear respaldo",
          description: result.error,
          variant: "destructive"
        });
        return;
      }
      
      if (result.downloadUrl) {
        // Abrir enlace de descarga
        window.open(result.downloadUrl, '_blank');
        
        toast({
          title: "Respaldo creado exitosamente",
          description: "El archivo de respaldo ha sido generado y está disponible para descargar.",
          variant: "default"
        });
      }
    } catch (error) {
      console.error("Error backing up data:", error);
      toast({
        title: "Error al crear respaldo",
        description: "Ocurrió un error inesperado al crear el respaldo.",
        variant: "destructive"
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  // Función auxiliar para descargar archivos CSV
  const downloadCsvFile = (csvContent: string, filename: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Exportar Datos</CardTitle>
          <CardDescription>
            Exporta tus datos de clientes y facturas en formato CSV para usar en otras aplicaciones.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Los archivos CSV pueden ser importados en Excel, Google Sheets y otras aplicaciones de hojas de cálculo.
          </p>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleExportCsv}
            disabled={isExportingCsv}
          >
            {isExportingCsv ? (
              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileDownIcon className="mr-2 h-4 w-4" />
            )}
            Exportar a CSV
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Crear Respaldo</CardTitle>
          <CardDescription>
            Crea un respaldo completo de todos tus datos en formato JSON.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            El respaldo incluye todos tus clientes, facturas y configuraciones en un solo archivo.
          </p>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleBackupData}
            disabled={isBackingUp}
          >
            {isBackingUp ? (
              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <DatabaseBackupIcon className="mr-2 h-4 w-4" />
            )}
            Crear Respaldo
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
