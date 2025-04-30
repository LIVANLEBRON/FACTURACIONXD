"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import type { Customer } from "@/lib/definitions";
import { deleteCustomer } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";

interface CustomersTableProps {
  customers: Customer[];
}

export function CustomersTable({ customers }: CustomersTableProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = React.useState<string | null>(null); // Track which customer is being deleted

  const handleDelete = async (id: string) => {
    setIsDeleting(id); // Indicate deletion start for this ID
    try {
      const result = await deleteCustomer(id);
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
        description: "Ocurrió un error inesperado al eliminar el cliente.",
        variant: "destructive",
      });
      console.error("Delete error:", error);
    } finally {
      setIsDeleting(null); // Reset deleting state regardless of outcome
    }
  };

  if (!customers || customers.length === 0) {
    return <p className="text-muted-foreground text-center">No hay clientes para mostrar.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead className="hidden md:table-cell">Email</TableHead>
          <TableHead className="hidden md:table-cell">Teléfono</TableHead>
          <TableHead className="hidden lg:table-cell">Dirección</TableHead>
          <TableHead>
            <span className="sr-only">Acciones</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {customers.map((customer) => (
          <TableRow key={customer.id}>
            <TableCell className="font-medium">{customer.name}</TableCell>
            <TableCell className="hidden md:table-cell">{customer.email || '-'}</TableCell>
            <TableCell className="hidden md:table-cell">{customer.phone || '-'}</TableCell>
            <TableCell className="hidden lg:table-cell">{customer.address || '-'}</TableCell>
            <TableCell>
              <AlertDialog>
                 <DropdownMenu>
                   <DropdownMenuTrigger asChild>
                     <Button aria-haspopup="true" size="icon" variant="ghost" disabled={isDeleting === customer.id}>
                       {isDeleting === customer.id ? (
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
                       <Link href={`/customers/${customer.id}/edit`} className="flex items-center gap-2 cursor-pointer">
                         <Pencil className="h-4 w-4" /> Editar
                       </Link>
                     </DropdownMenuItem>
                     <AlertDialogTrigger asChild>
                        <DropdownMenuItem
                            className="flex items-center gap-2 text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                            onSelect={(e) => e.preventDefault()} // Prevent closing dropdown
                            disabled={isDeleting === customer.id}
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
                      Esta acción no se puede deshacer. Esto eliminará permanentemente al cliente
                      "{customer.name}" y cualquier dato asociado (¡asegúrate de manejar esto si tienes facturas vinculadas!).
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={!!isDeleting}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(customer.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      disabled={!!isDeleting}
                    >
                      {isDeleting === customer.id ? 'Eliminando...' : 'Sí, eliminar'}
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
