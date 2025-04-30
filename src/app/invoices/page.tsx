import Link from 'next/link';
import { PlusCircle, Search } from 'lucide-react'; // Added Search
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input'; // Added Input
import { getInvoices } from '@/lib/actions';
import { InvoicesTable } from './_components/invoices-table';
import type { Invoice } from '@/lib/definitions';
import AuthGuard from "@/components/auth/auth-guard"; // Import AuthGuard

interface InvoicesPageProps {
  searchParams?: {
    query?: string;
    // Add other filter params like date, status etc.
  };
}

export default async function InvoicesPage({ searchParams }: InvoicesPageProps) {
  const query = searchParams?.query || '';
  // TODO: Implement filtering logic in getInvoices based on query and other params
  const invoices: Invoice[] = await getInvoices(); // Pass query/filters here later

  // Placeholder for search functionality - Ideally move to a client component
  const SearchInput = () => (
     <div className="relative flex-1 md:grow-0">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Buscar por cliente, nº factura..."
          className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px]"
          // defaultValue={query} // Use client component state for controlled input
          // onChange={(e) => handleSearch(e.target.value)} // Implement handleSearch in client component
        />
      </div>
  );


  return (
     <AuthGuard>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold">Gestión de Facturas</h1>
              <p className="text-muted-foreground">
                Crea, visualiza, edita o elimina tus facturas.
              </p>
            </div>
            <div className="flex gap-2 items-center">
                {/* Search Input - Needs to be a client component for interaction */}
                <SearchInput />
                 <Button asChild>
                   <Link href="/invoices/new">
                     <PlusCircle className="mr-2 h-4 w-4" /> Crear Factura
                   </Link>
                 </Button>
            </div>

          </div>

          <Card>
            <CardHeader>
              <CardTitle>Lista de Facturas</CardTitle>
               <CardDescription>
                 {invoices.length > 0
                   ? `Tienes ${invoices.length} factura${invoices.length === 1 ? '' : 's'} registrada${invoices.length === 1 ? '' : 's'}.`
                   : 'Aún no has creado ninguna factura.'}
               </CardDescription>
            </CardHeader>
            <CardContent>
              <InvoicesTable invoices={invoices} />
            </CardContent>
          </Card>
        </div>
     </AuthGuard>
  );
}
