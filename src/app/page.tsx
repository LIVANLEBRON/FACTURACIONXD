import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Users, FileText, TrendingUp, Clock } from "lucide-react"; // Added icons
import AuthGuard from "@/components/auth/auth-guard"; // Import AuthGuard
import { getInvoices } from "@/lib/actions"; // To fetch recent data
import { formatCurrencyRD } from "@/lib/utils"; // Import formatter

// Placeholder data - fetch real data in a real implementation
async function getDashboardData() {
    // In a real app, fetch data specific to the logged-in user
    const recentInvoices = (await getInvoices()).slice(0, 3); // Get last 3 for demo
    const today = new Date().setHours(0, 0, 0, 0);
    const invoicesToday = recentInvoices.filter(inv => new Date(inv.createdAt).setHours(0, 0, 0, 0) === today);
    const totalToday = invoicesToday.reduce((sum, inv) => sum + inv.totalAmount, 0);

    return {
        invoicesCreatedToday: invoicesToday.length,
        totalBilledToday: totalToday,
        recentInvoices,
    };
}


export default async function Home() {
    const dashboardData = await getDashboardData();

  return (
     <AuthGuard>
        <div className="space-y-6">
          <Card className="bg-gradient-to-r from-primary/10 to-background">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Bienvenido a Invoicify</CardTitle>
              <CardDescription>
                Tu panel de control para la facturación simplificada en RD.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
                 <Card className="bg-background/70 backdrop-blur-sm">
                     <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                         <CardTitle className="text-sm font-medium">Total Facturado Hoy</CardTitle>
                         <TrendingUp className="h-4 w-4 text-muted-foreground" />
                     </CardHeader>
                     <CardContent>
                         <div className="text-2xl font-bold tabular-nums">{formatCurrencyRD(dashboardData.totalBilledToday)}</div>
                         <p className="text-xs text-muted-foreground">
                             {dashboardData.invoicesCreatedToday} factura(s) creada(s) hoy
                         </p>
                     </CardContent>
                 </Card>
                  <Card className="bg-background/70 backdrop-blur-sm">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Accesos Rápidos</CardTitle>
                          <Clock className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent className="flex flex-wrap gap-2 pt-4">
                           <Button size="sm" asChild>
                             <Link href="/invoices/new">
                               <FileText className="mr-2 h-4 w-4" /> Nueva Factura
                             </Link>
                           </Button>
                           <Button size="sm" variant="secondary" asChild>
                              <Link href="/customers/new">
                                <Users className="mr-2 h-4 w-4" /> Nuevo Cliente
                              </Link>
                            </Button>
                      </CardContent>
                  </Card>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
             <Card>
               <CardHeader>
                 <CardTitle>Clientes</CardTitle>
                 <CardDescription>Gestiona tu base de datos de clientes.</CardDescription>
               </CardHeader>
               <CardContent>
                 {/* Add maybe recent customers or count */}
                  <Button variant="outline" className="w-full" asChild>
                   <Link href="/customers">
                        <Users className="mr-2 h-4 w-4" /> Ver Todos los Clientes
                   </Link>
                 </Button>
               </CardContent>
             </Card>
             <Card>
               <CardHeader>
                 <CardTitle>Facturas Recientes</CardTitle>
                  <CardDescription>Últimas facturas generadas.</CardDescription>
               </CardHeader>
               <CardContent className="space-y-2">
                    {dashboardData.recentInvoices.length > 0 ? (
                        dashboardData.recentInvoices.map(inv => (
                            <div key={inv.id} className="flex justify-between items-center text-sm border-b pb-1 last:border-none">
                                <span>
                                    <Link href={`/invoices/${inv.id}/view`} className="hover:underline font-medium">{inv.invoiceNumber}</Link>
                                    <span className="text-muted-foreground ml-2">({inv.customerName})</span>
                                </span>
                                <span className="font-medium tabular-nums">{formatCurrencyRD(inv.totalAmount)}</span>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-muted-foreground">No hay facturas recientes.</p>
                    )}
                 <Button variant="outline" className="w-full mt-4" asChild>
                   <Link href="/invoices">
                        <FileText className="mr-2 h-4 w-4" /> Ver Todas las Facturas
                   </Link>
                 </Button>
               </CardContent>
             </Card>
          </div>
        </div>
     </AuthGuard>
  );
}
