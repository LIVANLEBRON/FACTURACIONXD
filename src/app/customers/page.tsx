import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { getCustomers } from '@/lib/actions';
import { CustomersTable } from './_components/customers-table';
import type { Customer } from '@/lib/definitions';
import AuthGuard from "@/components/auth/auth-guard"; // Import AuthGuard

export default async function CustomersPage() {
  // Fetching inside AuthGuard might be better if getCustomers needs user context
  const customers: Customer[] = await getCustomers();

  return (
     <AuthGuard>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold">Gestión de Clientes</h1>
              <p className="text-muted-foreground">
                Añade, visualiza, edita o elimina tus clientes.
              </p>
            </div>
            <Button asChild>
              <Link href="/customers/new">
                <PlusCircle className="mr-2 h-4 w-4" /> Añadir Cliente
              </Link>
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Lista de Clientes</CardTitle>
              <CardDescription>
                {customers.length > 0
                  ? `Tienes ${customers.length} cliente${customers.length === 1 ? '' : 's'} registrado${customers.length === 1 ? '' : 's'}.`
                  : 'Aún no has añadido ningún cliente.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CustomersTable customers={customers} />
            </CardContent>
          </Card>
        </div>
    </AuthGuard>
  );
}
