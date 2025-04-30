"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Pencil, Trash2, Eye, Download, Send } from "lucide-react"; // Added Download, Send

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator, // Added separator
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { Invoice, InvoiceStatus } from "@/lib/definitions";
import { deleteInvoice, downloadInvoicePdf, sendInvoiceByEmail } from "@/lib/actions"; // Added new actions
import { useToast } from "@/hooks/use-toast";
import { cn, formatCurrencyRD, formatDate } from "@/lib/utils"; // Import RD$ formatter and date formatter

interface InvoicesTableProps {
  invoices: Invoice[];
}

const statusVariantMap: Record<InvoiceStatus, "default" | "secondary" | "outline" | "destructive"> = {
    draft: "secondary",
    sent: "outline", // Changed sent to outline for better visibility with primary color
    paid: "default", // Changed paid to default (primary color)
    cancelled: "destructive",
};

const statusTextMap: Record<InvoiceStatus, string> = {
    draft: "Borrador",
    sent: "Enviada",
    paid: "Pagada",
    cancelled: "Cancelada",
};


export function InvoicesTable({ invoices }: InvoicesTableProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = React.useState<string | null>(null);
  const [isDownloading, setIsDownloading] = React.useState<string | null>(null);
  const [isSending, setIsSending] = React.useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setIsDeleting(id);
    try {
      const result = await deleteInvoice(id);
      if (result?.message) { // Check for result and message
        toast({
          title: result.message.includes("Error") ? "Error" : "Éxito",
          description: result.message,
          variant: result.message.includes("Error") ? "destructive" : "default",
        });
        if (!result.message.includes("Error")) {
          router.refresh(); // Refresh data on success
        }
      } else {
           toast({
              title: "Error",
              description: "Ocurrió un error inesperado al eliminar.",
              variant: "destructive",
           });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado al eliminar la factura.",
        variant: "destructive",
      });
      console.error("Delete error:", error);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleDownload = async (id: string) => {
    setIsDownloading(id);
    try {
        const result = await downloadInvoicePdf(id);
         if (result.url) {
             // Trigger download - This might require opening in a new tab or more complex handling
             window.open(result.url, '_blank');
             toast({ title: "Éxito", description: "La descarga del PDF debería comenzar." });
         } else if (result.error) {
             toast({ title: "Error", description: result.error, variant: "destructive" });
         } else {
              toast({ title: "Aviso", description: "Funcionalidad de descarga no disponible aún.", variant: "default" });
         }
    } catch (error) {
        console.error("Download error:", error);
        toast({ title: "Error", description: "Error al intentar descargar el PDF.", variant: "destructive" });
    } finally {
        setIsDownloading(null);
    }
  };

  const handleSend = async (id: string, customerEmail?: string) => {
    if (!customerEmail) {
         toast({ title: "Error", description: "El cliente no tiene un correo electrónico registrado.", variant: "destructive"});
         return;
    }
    // Basic prompt for confirmation, could be a dialog later
    if (!confirm(`¿Enviar factura #${id} a ${customerEmail}?`)) {
        return;
    }

    setIsSending(id);
    try {
        const result = await sendInvoiceByEmail(id, customerEmail);
         if (result.success) {
             toast({ title: "Éxito", description: `Factura enviada a ${customerEmail}.` });
         } else if (result.error) {
             toast({ title: "Error", description: result.error, variant: "destructive" });
         } else {
              toast({ title: "Aviso", description: "Funcionalidad de envío no disponible aún.", variant: "default" });
         }
    } catch (error) {
        console.error("Send email error:", error);
        toast({ title: "Error", description: "Error al intentar enviar la factura.", variant: "destructive" });
    } finally {
        setIsSending(null);
    }
  };

  if (!invoices || invoices.length === 0) {
    return <p className="text-muted-foreground text-center">No hay facturas para mostrar.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Nº Factura</TableHead>
          <TableHead>Cliente</TableHead>
          <TableHead className="hidden md:table-cell">NCF</TableHead>
          <TableHead className="hidden sm:table-cell">Fecha Emisión</TableHead>
         {/* <TableHead className="hidden md:table-cell">Fecha Venc.</TableHead> */}
          <TableHead className="text-right">Total</TableHead>
          <TableHead className="hidden sm:table-cell text-center">Estado</TableHead>
          <TableHead>
            <span className="sr-only">Acciones</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((invoice) => (
          <TableRow key={invoice.id}>
            <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
            <TableCell>
                <div>{invoice.customerName || invoice.customerId}</div>
                {invoice.customerCedulaRnc && <div className="text-xs text-muted-foreground">{invoice.customerCedulaRnc}</div>}
            </TableCell>
             <TableCell className="hidden md:table-cell text-xs">
                 {invoice.ncfType && invoice.ncf ? `${invoice.ncfType} - ${invoice.ncf}` : '-'}
             </TableCell>
            <TableCell className="hidden sm:table-cell">
              {formatDate(invoice.issueDate)}
            </TableCell>
           {/* <TableCell className="hidden md:table-cell">
              {formatDate(invoice.dueDate)}
            </TableCell> */}
            <TableCell className="text-right tabular-nums">
              {formatCurrencyRD(invoice.totalAmount)}
            </TableCell>
            <TableCell className="hidden sm:table-cell text-center">
              <Badge variant={statusVariantMap[invoice.status]}>
                 {statusTextMap[invoice.status]}
              </Badge>
            </TableCell>
            <TableCell>
              <AlertDialog>
                 <DropdownMenu>
                   <DropdownMenuTrigger asChild>
                     <Button aria-haspopup="true" size="icon" variant="ghost" disabled={isDeleting === invoice.id || isDownloading === invoice.id || isSending === invoice.id}>
                       {isDeleting === invoice.id || isDownloading === invoice.id || isSending === invoice.id ? (
                          <div className="h-4 w-4 border-2 border-muted-foreground border-t-primary rounded-full animate-spin" />
                       ) : (
                         <MoreHorizontal className="h-4 w-4" />
                       )}
                       <span className="sr-only">Menú</span>
                     </Button>
                   </DropdownMenuTrigger>
                   <DropdownMenuContent align="end">
                     <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                     <DropdownMenuItem asChild>
                       <Link href={`/invoices/${invoice.id}/view`} className="flex items-center gap-2 cursor-pointer">
                         <Eye className="h-4 w-4" /> Ver Detalle
                       </Link>
                     </DropdownMenuItem>
                     <DropdownMenuItem asChild>
                       <Link href={`/invoices/${invoice.id}/edit`} className="flex items-center gap-2 cursor-pointer">
                         <Pencil className="h-4 w-4" /> Editar
                       </Link>
                     </DropdownMenuItem>
                     <DropdownMenuSeparator />
                      <DropdownMenuItem
                          onSelect={() => handleDownload(invoice.id)}
                          disabled={isDownloading === invoice.id || isDeleting === invoice.id || isSending === invoice.id}
                          className="flex items-center gap-2 cursor-pointer"
                      >
                          <Download className="h-4 w-4" /> Descargar PDF
                      </DropdownMenuItem>
                       <DropdownMenuItem
                           onSelect={() => handleSend(invoice.id, "user@example.com")} // TODO: Get actual customer email
                           disabled={isSending === invoice.id || isDeleting === invoice.id || isDownloading === invoice.id || !true /* Add condition if customer has no email */}
                           className="flex items-center gap-2 cursor-pointer"
                       >
                           <Send className="h-4 w-4" /> Enviar por Correo
                       </DropdownMenuItem>
                     <DropdownMenuSeparator />
                     <AlertDialogTrigger asChild>
                        <DropdownMenuItem
                            className="flex items-center gap-2 text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                            onSelect={(e) => e.preventDefault()}
                            disabled={isDeleting === invoice.id || isDownloading === invoice.id || isSending === invoice.id}
                          >
                          <Trash2 className="h-4 w-4" /> Eliminar
                        </DropdownMenuItem>
                     </AlertDialogTrigger>
                   </DropdownMenuContent>
                 </DropdownMenu>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. Esto eliminará permanentemente la factura
                      #{invoice.invoiceNumber}.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={!!isDeleting}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(invoice.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      disabled={!!isDeleting}
                    >
                      {isDeleting === invoice.id ? 'Eliminando...' : 'Sí, eliminar'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
