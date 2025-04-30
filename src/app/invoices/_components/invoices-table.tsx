"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Pencil, Trash2, Eye } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
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
import { deleteInvoice } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface InvoicesTableProps {
  invoices: Invoice[];
}

const statusVariantMap: Record<InvoiceStatus, "default" | "secondary" | "outline" | "destructive"> = {
    draft: "secondary",
    sent: "default",
    paid: "outline", // Using outline for paid, can customize further
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

  const handleDelete = async (id: string) => {
    setIsDeleting(id);
    try {
      const result = await deleteInvoice(id);
      if (result.message) {
        toast({
          title: result.message.includes("Error") ? "Error" : "Éxito",
          description: result.message,
          variant: result.message.includes("Error") ? "destructive" : "default",
        });
        if (!result.message.includes("Error")) {
          router.refresh(); // Refresh data on success
        }
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

  if (!invoices || invoices.length === 0) {
    return <p className="text-muted-foreground text-center">No hay facturas para mostrar.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nº Factura</TableHead>
          <TableHead>Cliente</TableHead>
          <TableHead className="hidden sm:table-cell">Fecha Emisión</TableHead>
          <TableHead className="hidden md:table-cell">Fecha Vencimiento</TableHead>
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
            <TableCell>{invoice.customerName || invoice.customerId}</TableCell>
            <TableCell className="hidden sm:table-cell">
              {format(new Date(invoice.issueDate), "dd/MM/yyyy", { locale: es })}
            </TableCell>
            <TableCell className="hidden md:table-cell">
              {format(new Date(invoice.dueDate), "dd/MM/yyyy", { locale: es })}
            </TableCell>
            <TableCell className="text-right">
              {invoice.totalAmount.toLocaleString("es-ES", { style: 'currency', currency: 'EUR' })} {/* Adjust currency */}
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
                     <Button aria-haspopup="true" size="icon" variant="ghost" disabled={isDeleting === invoice.id}>
                       {isDeleting === invoice.id ? (
                          <div className="h-4 w-4 border-2 border-muted-foreground border-t-primary rounded-full animate-spin" />
                       ) : (
                         <MoreHorizontal className="h-4 w-4" />
                       )}
                       <span className="sr-only">Menú</span>
                     </Button>
                   </DropdownMenuTrigger>
                   <DropdownMenuContent align="end">
                     <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                     {/* <DropdownMenuItem asChild>
                       <Link href={`/invoices/${invoice.id}`} className="flex items-center gap-2 cursor-pointer">
                         <Eye className="h-4 w-4" /> Ver
                       </Link>
                     </DropdownMenuItem> */}
                     <DropdownMenuItem asChild>
                       <Link href={`/invoices/${invoice.id}/edit`} className="flex items-center gap-2 cursor-pointer">
                         <Pencil className="h-4 w-4" /> Editar
                       </Link>
                     </DropdownMenuItem>
                     <AlertDialogTrigger asChild>
                        <DropdownMenuItem
                            className="flex items-center gap-2 text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                            onSelect={(e) => e.preventDefault()}
                            disabled={isDeleting === invoice.id}
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
