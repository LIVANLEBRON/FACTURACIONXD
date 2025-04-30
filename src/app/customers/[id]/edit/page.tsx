import { notFound } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { CustomerForm } from "../../_components/customer-form";
import { getCustomerById } from "@/lib/actions";
import type { Customer } from '@/lib/definitions';

interface EditCustomerPageProps {
  params: { id: string };
}

export default async function EditCustomerPage({ params }: EditCustomerPageProps) {
  const id = params.id;
  const customer: Customer | null = await getCustomerById(id);

  if (!customer) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Editar Cliente</h1>
      <Card>
        <CardHeader>
          <CardTitle>Información del Cliente</CardTitle>
          <CardDescription>
            Actualice los detalles del cliente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CustomerForm customer={customer} />
        </CardContent>
      </Card>
    </div>
  );
}
