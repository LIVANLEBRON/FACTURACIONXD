"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useFormState } from 'react-dom';

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { Customer } from "@/lib/definitions";
import { addCustomer, updateCustomer } from "@/lib/actions";
import { Loader2 } from "lucide-react";

// Basic RNC/Cedula validation (adjust regex as needed for strictness)
const cedulaRncRegex = /^[0-9]{9,11}$/; // Simple 9 or 11 digit check

const formSchema = z.object({
  name: z.string().min(1, { message: "El nombre es requerido." }),
  cedula_rnc: z.string()
    .optional()
    .refine((val) => !val || cedulaRncRegex.test(val), {
        message: "Cédula/RNC inválido (9 u 11 dígitos)."
     }).or(z.literal('')),
  email: z.string().email({ message: "Email inválido." }).optional().or(z.literal('')),
  address: z.string().optional(),
  phone: z.string().optional(),
});


type CustomerFormValues = z.infer<typeof formSchema>;

interface CustomerFormProps {
  customer?: Customer | null; // Make customer optional for add mode
}

const initialState = {
  message: null,
  errors: {},
  success: false,
};


export function CustomerForm({ customer }: CustomerFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formAction = customer?.id ? updateCustomer.bind(null, customer.id) : addCustomer;
  const [state, dispatch] = useFormState(formAction, initialState);

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: customer?.name || "",
      cedula_rnc: customer?.cedula_rnc || "",
      email: customer?.email || "",
      address: customer?.address || "",
      phone: customer?.phone || "",
    },
  });

   // Effect to handle form submission response
   useEffect(() => {
     if (state?.message) {
       toast({
         title: state.success ? (customer?.id ? "Cliente Actualizado" : "Cliente Creado") : "Error",
         description: state.message,
         variant: state.success ? "default" : "destructive",
       });
       if (state.success) {
         router.push("/customers");
         router.refresh(); // Refresh server components
       }
     }
     // If there are validation errors from the server action, set them in the form
     if (state?.errors) {
         Object.entries(state.errors).forEach(([fieldName, errors]) => {
              // @ts-ignore - Allowing dynamic field name setting
             if (typeof fieldName === 'string' && Array.isArray(errors) && errors.length > 0) {
                 form.setError(fieldName as keyof CustomerFormValues, {
                     type: 'server',
                     message: errors.join(', '),
                 });
             }
         });
     }
      setIsSubmitting(false); // Reset submitting state after handling response
   }, [state, toast, router, customer?.id, form]);


   const onSubmit = (data: CustomerFormValues) => {
     setIsSubmitting(true);
     const formData = new FormData();
     Object.entries(data).forEach(([key, value]) => {
       if (value !== undefined && value !== null && value !== '') {
         formData.append(key, String(value));
       }
     });
     dispatch(formData);
   };


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre Completo *</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Juan Pérez" {...field} disabled={isSubmitting} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
           control={form.control}
           name="cedula_rnc"
           render={({ field }) => (
             <FormItem>
               <FormLabel>Cédula / RNC</FormLabel>
               <FormControl>
                 <Input placeholder="Ej: 001-xxxxxxx-x ó 1xxxxxxxxxx" {...field} disabled={isSubmitting}/>
               </FormControl>
               <FormMessage />
             </FormItem>
           )}
         />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Correo Electrónico</FormLabel>
              <FormControl>
                <Input type="email" placeholder="ej: juan.perez@correo.com" {...field} disabled={isSubmitting}/>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
           control={form.control}
           name="phone"
           render={({ field }) => (
             <FormItem>
               <FormLabel>Teléfono</FormLabel>
               <FormControl>
                 <Input type="tel" placeholder="Ej: 809-123-4567" {...field} disabled={isSubmitting}/>
               </FormControl>
               <FormMessage />
             </FormItem>
           )}
         />
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dirección</FormLabel>
              <FormControl>
                <Textarea placeholder="Ej: Calle Falsa 123, Santo Domingo" {...field} disabled={isSubmitting}/>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
             {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {customer?.id ? "Actualizar Cliente" : "Añadir Cliente"}
          </Button>
        </div>
         {/* Display generic server error message if no specific field errors */}
         {state?.message && !state.success && !state.errors && (
             <p className="text-sm font-medium text-destructive">{state.message}</p>
         )}
      </form>
    </Form>
  );
}
