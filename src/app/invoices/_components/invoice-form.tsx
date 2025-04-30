"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Loader2, PlusCircle, Trash2 } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useFormState } from 'react-dom';

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn, formatCurrencyRD } from "@/lib/utils"; // Import RD$ formatter
import { useToast } from "@/hooks/use-toast";
import type { Customer, Invoice, InvoiceItem, InvoiceStatus, NcfType } from "@/lib/definitions";
import { ncfTypeDescriptions } from "@/lib/definitions"; // Import NCF descriptions
import { addInvoice, updateInvoice } from "@/lib/actions";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const ITBIS_RATE = 0.18; // Define ITBIS rate

const invoiceItemSchema = z.object({
  id: z.string().optional(), // Keep track of existing items
  description: z.string().min(1, "Descripción requerida"),
  quantity: z.coerce.number().min(0.01, "Cantidad debe ser positiva"),
  unitPrice: z.coerce.number().min(0, "Precio unitario no puede ser negativo"),
});

const formSchema = z.object({
  customerId: z.string().min(1, "Cliente requerido"),
  invoiceNumber: z.string().min(1, "Número de factura requerido"),
  issueDate: z.date({ required_error: "Fecha de emisión requerida" }),
  dueDate: z.date({ required_error: "Fecha de vencimiento requerida" }),
  items: z.array(invoiceItemSchema).min(1, "Se requiere al menos un item"),
  notes: z.string().optional(),
  status: z.enum(["draft", "sent", "paid", "cancelled"]).default("draft"),
  ncfType: z.enum(Object.keys(ncfTypeDescriptions) as [NcfType, ...NcfType[]]).optional(),
  ncf: z.string().optional(), // Add more specific validation if needed (e.g., length, format)
}).refine(data => !!data.ncfType === !!data.ncf, {
    message: "Debe proporcionar el Tipo de Comprobante y el NCF, o ninguno.",
    path: ["ncfType"], // Attach error to one of the fields
}).refine(data => !data.ncf || (data.ncf && data.ncf.trim().length > 0), {
    message: "NCF no puede estar vacío si se selecciona un tipo.",
    path: ["ncf"],
});


type InvoiceFormValues = z.infer<typeof formSchema>;

interface InvoiceFormProps {
  invoice?: Invoice | null;
  customers: Customer[];
}

const initialState = {
  message: null,
  errors: {},
  success: false,
};


export function InvoiceForm({ invoice, customers }: InvoiceFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subTotal, setSubTotal] = useState(0);
  const [itbisAmount, setItbisAmount] = useState(0);
  const [total, setTotal] = useState(0);

  const formAction = invoice?.id ? updateInvoice.bind(null, invoice.id) : addInvoice;
  const [state, dispatch] = useFormState(formAction, initialState);


  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerId: invoice?.customerId || "",
      invoiceNumber: invoice?.invoiceNumber || "",
      issueDate: invoice?.issueDate ? new Date(invoice.issueDate) : new Date(),
      dueDate: invoice?.dueDate ? new Date(invoice.dueDate) : new Date(),
      items: invoice?.items?.map(item => ({...item})) || [{ description: "", quantity: 1, unitPrice: 0 }],
      notes: invoice?.notes || "",
      status: invoice?.status || "draft",
      ncfType: invoice?.ncfType || undefined,
      ncf: invoice?.ncf || "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Recalculate totals whenever items change
  useEffect(() => {
    const calculateTotals = (items: InvoiceItem[]) => {
        const currentSubTotal = items.reduce((sum, item) => {
            const quantity = Number(item?.quantity) || 0;
            const price = Number(item?.unitPrice) || 0;
            return sum + quantity * price;
        }, 0);
        const currentItbisAmount = currentSubTotal * ITBIS_RATE;
        const currentTotal = currentSubTotal + currentItbisAmount;

        setSubTotal(currentSubTotal);
        setItbisAmount(currentItbisAmount);
        setTotal(currentTotal);
    }

    const subscription = form.watch((value, { name }) => {
      if (name && name.startsWith("items")) {
        calculateTotals(value.items || []);
      }
    });

    // Calculate initial total
    calculateTotals(form.getValues('items'));

    return () => subscription.unsubscribe();
  }, [form, setTotal, setSubTotal, setItbisAmount]); // Add setters to dependency array


    // Effect to handle form submission response
    useEffect(() => {
      if (state?.message) { // Check if state exists
        toast({
          title: state.success ? (invoice?.id ? "Factura Actualizada" : "Factura Creada") : "Error",
          description: state.message,
          variant: state.success ? "default" : "destructive",
        });
        if (state.success) {
          router.push("/invoices");
          router.refresh(); // Refresh server components
        }
       }
       // If there are validation errors from the server action, set them in the form
       if (state?.errors) {
           Object.entries(state.errors).forEach(([fieldName, errors]) => {
               // Need to handle array field errors potentially differently
               if (fieldName === 'items' && Array.isArray(errors)) {
                  if(typeof errors[0] === 'string'){ // Simple root message for items array
                     form.setError('items', { type: 'server', message: errors.join(', ') });
                  } else {
                     // TODO: Handle potential nested errors if server sends them per item index
                  }

               } else if (typeof fieldName === 'string' && Array.isArray(errors) && errors.length > 0) {
                    // @ts-ignore - Allowing dynamic field name setting
                   form.setError(fieldName as keyof InvoiceFormValues, {
                       type: 'server',
                       message: errors.join(', '),
                   });
               }
           });
       }
       setIsSubmitting(false); // Reset submitting state after handling response/errors

    }, [state, toast, router, invoice?.id, form]);


    const onSubmit = (data: InvoiceFormValues) => {
        setIsSubmitting(true);
        const formData = new FormData();

        // Append standard fields
        Object.entries(data).forEach(([key, value]) => {
          if (key !== 'items' && value !== undefined && value !== null && value !== '') {
             if (value instanceof Date) {
               formData.append(key, value.toISOString());
             } else {
               formData.append(key, String(value));
             }
          } else if (key === 'ncf' && !data.ncfType) {
             // Don't append empty NCF if no type is selected
          } else if (key === 'ncfType' && !value) {
             // Don't append empty ncfType
          }
        });

        // Append items as a JSON string
        formData.append('items', JSON.stringify(data.items));

        // Dispatch the server action
        dispatch(formData);
      };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Invoice Header Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FormField
            control={form.control}
            name="customerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cliente *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un cliente" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name} {customer.cedula_rnc ? `(${customer.cedula_rnc})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="invoiceNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número de Factura *</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: F-001" {...field} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="issueDate"
            render={({ field }) => (
              <FormItem className="flex flex-col pt-2">
                <FormLabel>Fecha de Emisión *</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                        disabled={isSubmitting}
                      >
                        {field.value ? (
                          format(field.value, "PPP", { locale: es })
                        ) : (
                          <span>Elige una fecha</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date("1900-01-01") || isSubmitting }
                      initialFocus
                      locale={es}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem className="flex flex-col pt-2">
                <FormLabel>Fecha de Vencimiento *</FormLabel>
                 <Popover>
                   <PopoverTrigger asChild>
                     <FormControl>
                       <Button
                         variant={"outline"}
                         className={cn(
                           "w-full pl-3 text-left font-normal",
                           !field.value && "text-muted-foreground"
                         )}
                         disabled={isSubmitting}
                       >
                         {field.value ? (
                           format(field.value, "PPP", { locale: es })
                         ) : (
                           <span>Elige una fecha</span>
                         )}
                         <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                       </Button>
                     </FormControl>
                   </PopoverTrigger>
                   <PopoverContent className="w-auto p-0" align="start">
                     <Calendar
                       mode="single"
                       selected={field.value}
                       onSelect={field.onChange}
                       disabled={(date) => date < (form.getValues("issueDate") || new Date("1900-01-01")) || isSubmitting}
                       initialFocus
                       locale={es}
                     />
                   </PopoverContent>
                 </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* NCF Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="ncfType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo Comprobante Fiscal (NCF)</FormLabel>
                  <Select onValueChange={(value) => {
                      field.onChange(value);
                      if (!value) form.setValue('ncf', ''); // Clear NCF if type is cleared
                     }}
                     value={field.value || ''} // Use value instead of defaultValue for controlled component
                     disabled={isSubmitting}
                   >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un tipo (Opcional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Ninguno</SelectItem>
                      {Object.entries(ncfTypeDescriptions).map(([code, description]) => (
                        <SelectItem key={code} value={code}>
                          {code} - {description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
           <FormField
             control={form.control}
             name="ncf"
             render={({ field }) => (
               <FormItem>
                 <FormLabel>Número de Comprobante Fiscal (NCF)</FormLabel>
                 <FormControl>
                   <Input
                     placeholder="Ej: B0100000001"
                     {...field}
                     disabled={isSubmitting || !form.watch('ncfType')} // Disable if no type selected
                   />
                 </FormControl>
                 <FormMessage />
               </FormItem>
             )}
           />
        </div>


        <Separator />

        {/* Invoice Items */}
        <div className="space-y-4">
            <h3 className="text-lg font-medium">Items de la Factura</h3>
             <FormMessage>{form.formState.errors.items?.message}</FormMessage> {/* Display root items error */}
            <div className="overflow-x-auto">
               <Table>
                 <TableHeader>
                   <TableRow>
                     <TableHead className="w-[50%]">Descripción *</TableHead>
                     <TableHead>Cantidad *</TableHead>
                     <TableHead>Precio Unit. *</TableHead>
                     <TableHead className="text-right">Subtotal</TableHead>
                     <TableHead className="w-[50px]">Acción</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                    {fields.map((item, index) => {
                        const quantity = form.watch(`items.${index}.quantity`) || 0;
                        const unitPrice = form.watch(`items.${index}.unitPrice`) || 0;
                        const itemSubtotal = (quantity * unitPrice);

                       return (
                         <TableRow key={item.id}>
                           <TableCell>
                             <FormField
                               control={form.control}
                               name={`items.${index}.description`}
                               render={({ field }) => (
                                 <FormItem className="mb-0 space-y-0">
                                   <FormControl>
                                     <Input placeholder="Descripción del item" {...field} disabled={isSubmitting} className="h-8"/>
                                   </FormControl>
                                   <FormMessage className="text-xs pt-1"/>
                                 </FormItem>
                               )}
                             />
                           </TableCell>
                           <TableCell>
                             <FormField
                               control={form.control}
                               name={`items.${index}.quantity`}
                               render={({ field }) => (
                                <FormItem className="mb-0 space-y-0">
                                   <FormControl>
                                     <Input type="number" placeholder="1" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} disabled={isSubmitting} className="h-8 w-20"/>
                                   </FormControl>
                                    <FormMessage className="text-xs pt-1"/>
                                </FormItem>
                               )}
                             />
                           </TableCell>
                           <TableCell>
                             <FormField
                               control={form.control}
                               name={`items.${index}.unitPrice`}
                               render={({ field }) => (
                                <FormItem className="mb-0 space-y-0">
                                   <FormControl>
                                     <Input type="number" step="0.01" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} disabled={isSubmitting} className="h-8 w-24"/>
                                   </FormControl>
                                   <FormMessage className="text-xs pt-1"/>
                                </FormItem>
                               )}
                             />
                           </TableCell>
                           <TableCell className="text-right tabular-nums">
                                {formatCurrencyRD(itemSubtotal)}
                           </TableCell>
                           <TableCell>
                             <Button
                               type="button"
                               variant="ghost"
                               size="icon"
                               onClick={() => fields.length > 1 && remove(index)} // Prevent removing the last item
                               disabled={isSubmitting || fields.length <= 1}
                             >
                               <Trash2 className="h-4 w-4 text-destructive" />
                               <span className="sr-only">Eliminar Item</span>
                             </Button>
                           </TableCell>
                         </TableRow>
                       );
                    })}
                 </TableBody>
               </Table>
             </div>

            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ description: "", quantity: 1, unitPrice: 0 })}
                disabled={isSubmitting}
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Añadir Item
            </Button>
        </div>

         <Separator />

        {/* Invoice Footer */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <FormField
               control={form.control}
               name="notes"
               render={({ field }) => (
                 <FormItem>
                   <FormLabel>Notas Adicionales</FormLabel>
                   <FormControl>
                     <Textarea
                       placeholder="Ej: Términos de pago, información bancaria..."
                       className="resize-none"
                       {...field}
                       disabled={isSubmitting}
                     />
                   </FormControl>
                   <FormMessage />
                 </FormItem>
               )}
             />

            <div className="space-y-4 md:text-right">
                {/* Total Summary */}
                <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span className="font-medium tabular-nums">{formatCurrencyRD(subTotal)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>ITBIS ({ITBIS_RATE * 100}%):</span>
                        <span className="font-medium tabular-nums">{formatCurrencyRD(itbisAmount)}</span>
                    </div>
                     <Separator className="my-1" />
                    <div className="flex justify-between text-base font-semibold">
                        <span>Total:</span>
                        <span className="tabular-nums">{formatCurrencyRD(total)}</span>
                    </div>
                </div>

                 <Separator />

                {/* Status Selector */}
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                       <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                         <FormControl>
                           <SelectTrigger className="w-full md:w-[180px] md:ml-auto">
                             <SelectValue placeholder="Selecciona estado" />
                           </SelectTrigger>
                         </FormControl>
                         <SelectContent>
                           <SelectItem value="draft">Borrador</SelectItem>
                           <SelectItem value="sent">Enviada</SelectItem>
                           <SelectItem value="paid">Pagada</SelectItem>
                           <SelectItem value="cancelled">Cancelada</SelectItem>
                         </SelectContent>
                       </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
           </div>
         </div>


        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
             {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {invoice?.id ? "Actualizar Factura" : "Crear Factura"}
          </Button>
        </div>
         {/* Display generic server error message */}
         {state?.message && !state.success && !state.errors && (
             <p className="text-sm font-medium text-destructive">{state.message}</p>
         )}
      </form>
    </Form>
  );
}
