'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { 
  DownloadIcon, 
  MailIcon, 
  Loader2Icon, 
  CheckIcon, 
  XIcon 
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { downloadInvoicePdf, sendInvoiceByEmail } from '@/lib/actions';
import { useToast } from "@/hooks/use-toast";

interface InvoiceActionsProps {
  invoiceId: string;
  customerEmail?: string;
  invoiceNumber: string;
}

export function InvoiceActions({ invoiceId, customerEmail, invoiceNumber }: InvoiceActionsProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [email, setEmail] = useState(customerEmail || '');
  const [emailSent, setEmailSent] = useState(false);
  const { toast } = useToast();

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    try {
      const result = await downloadInvoicePdf(invoiceId);
      
      if (result.error) {
        toast({
          title: "Error al generar PDF",
          description: result.error,
          variant: "destructive"
        });
        return;
      }
      
      if (result.url) {
        // Crear un enlace temporal y hacer clic en él para descargar
        const link = document.createElement('a');
        link.href = result.url;
        link.setAttribute('download', `Factura_${invoiceNumber}.pdf`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: "PDF generado exitosamente",
          description: "La factura ha sido descargada.",
          variant: "default"
        });
      }
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast({
        title: "Error al descargar PDF",
        description: "Ocurrió un error inesperado al descargar el PDF.",
        variant: "destructive"
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    
    try {
      const result = await sendInvoiceByEmail(invoiceId, email);
      
      if (result.error) {
        toast({
          title: "Error al enviar correo",
          description: result.error,
          variant: "destructive"
        });
        return;
      }
      
      setEmailSent(true);
      toast({
        title: "Correo enviado exitosamente",
        description: `La factura ha sido enviada a ${email}.`,
        variant: "default"
      });
      
      // Si estamos en desarrollo y hay una URL de vista previa, mostrarla
      if (result.previewUrl) {
        window.open(result.previewUrl, '_blank');
      }
      
      // Cerrar el diálogo después de un tiempo
      setTimeout(() => {
        setEmailDialogOpen(false);
        setEmailSent(false);
      }, 2000);
      
    } catch (error) {
      console.error("Error sending email:", error);
      toast({
        title: "Error al enviar correo",
        description: "Ocurrió un error inesperado al enviar el correo.",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex space-x-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleDownloadPdf}
        disabled={isDownloading}
      >
        {isDownloading ? (
          <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <DownloadIcon className="mr-2 h-4 w-4" />
        )}
        Descargar PDF
      </Button>
      
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <MailIcon className="mr-2 h-4 w-4" />
            Enviar por Email
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Enviar Factura por Email</DialogTitle>
            <DialogDescription>
              Ingrese el correo electrónico del destinatario para enviar la factura.
            </DialogDescription>
          </DialogHeader>
          
          {emailSent ? (
            <div className="flex flex-col items-center justify-center py-4">
              <CheckIcon className="h-16 w-16 text-green-500 mb-4" />
              <p className="text-center">¡Correo enviado exitosamente!</p>
            </div>
          ) : (
            <form onSubmit={handleSendEmail}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="cliente@ejemplo.com"
                    className="col-span-3"
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEmailDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSending}>
                  {isSending ? (
                    <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <MailIcon className="mr-2 h-4 w-4" />
                  )}
                  Enviar
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
