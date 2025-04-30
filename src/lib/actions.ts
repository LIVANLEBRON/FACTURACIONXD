"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
// NOTE: These actions are placeholders.
// You'll need to implement the actual data storage/retrieval logic.
// This could involve localStorage, a database (like Firestore, Supabase, etc.), or an API.

// --- Customer Actions ---

const CustomerSchema = z.object({
  name: z.string().min(1, { message: "El nombre es requerido." }),
  email: z.string().email({ message: "Email inválido." }).optional().or(z.literal('')),
  address: z.string().optional(),
  phone: z.string().optional(),
});

// Placeholder data store (replace with actual persistence)
let customers: any[] = [];
let customerIdCounter = 1;

export async function addCustomer(formData: FormData) {
  const validatedFields = CustomerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    address: formData.get("address"),
    phone: formData.get("phone"),
  });

  if (!validatedFields.success) {
    console.error("Validation Error:", validatedFields.error.flatten().fieldErrors);
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Error de validación.",
    };
  }

  try {
    const newCustomer = {
      id: `cust_${customerIdCounter++}`,
      ...validatedFields.data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    customers.push(newCustomer);
    console.log("Customer added:", newCustomer);
    revalidatePath("/customers");
    return { message: "Cliente añadido exitosamente." };
  } catch (error) {
    console.error("Database Error:", error);
    return { message: "Error al añadir cliente." };
  }
}

export async function updateCustomer(id: string, formData: FormData) {
    const validatedFields = CustomerSchema.safeParse({
        name: formData.get("name"),
        email: formData.get("email"),
        address: formData.get("address"),
        phone: formData.get("phone"),
      });

      if (!validatedFields.success) {
        console.error("Validation Error:", validatedFields.error.flatten().fieldErrors);
        return {
          errors: validatedFields.error.flatten().fieldErrors,
          message: "Error de validación.",
        };
      }

  try {
    const customerIndex = customers.findIndex((c) => c.id === id);
    if (customerIndex === -1) {
      return { message: "Cliente no encontrado." };
    }
    customers[customerIndex] = {
      ...customers[customerIndex],
      ...validatedFields.data,
      updatedAt: new Date(),
    };
    console.log("Customer updated:", customers[customerIndex]);
    revalidatePath("/customers");
    revalidatePath(`/customers/${id}/edit`);
    return { message: "Cliente actualizado exitosamente." };
  } catch (error) {
    console.error("Database Error:", error);
    return { message: "Error al actualizar cliente." };
  }
}


export async function deleteCustomer(id: string) {
  try {
    const initialLength = customers.length;
    customers = customers.filter((c) => c.id !== id);
    if (customers.length === initialLength) {
         return { message: "Cliente no encontrado." };
    }
    console.log("Customer deleted:", id);
    revalidatePath("/customers");
    return { message: "Cliente eliminado exitosamente." };
  } catch (error) {
    console.error("Database Error:", error);
    return { message: "Error al eliminar cliente." };
  }
}

export async function getCustomers(): Promise<any[]> {
  // Replace with actual data fetching
  console.log("Fetching customers...");
  await new Promise(resolve => setTimeout(resolve, 50)); // Simulate async fetch
  return customers;
}

export async function getCustomerById(id: string): Promise<any | null> {
    // Replace with actual data fetching
    await new Promise(resolve => setTimeout(resolve, 50)); // Simulate async fetch
    const customer = customers.find(c => c.id === id);
    return customer || null;
}


// --- Invoice Actions ---

const InvoiceItemSchema = z.object({
    id: z.string().optional(), // Optional for new items
    description: z.string().min(1, "Descripción requerida"),
    quantity: z.coerce.number().min(0.01, "Cantidad debe ser positiva"),
    unitPrice: z.coerce.number().min(0, "Precio unitario no puede ser negativo"),
});

const InvoiceSchema = z.object({
  customerId: z.string().min(1, "Cliente requerido"),
  invoiceNumber: z.string().min(1, "Número de factura requerido"),
  issueDate: z.coerce.date({ message: "Fecha de emisión inválida" }),
  dueDate: z.coerce.date({ message: "Fecha de vencimiento inválida" }),
  items: z.array(InvoiceItemSchema).min(1, "Se requiere al menos un item"),
  notes: z.string().optional(),
  status: z.enum(["draft", "sent", "paid", "cancelled"]).default("draft"),
});

// Placeholder data store (replace with actual persistence)
let invoices: any[] = [];
let invoiceIdCounter = 1;
let invoiceItemIdCounter = 1;

export async function addInvoice(prevState: any, formData: FormData) {

  const items = JSON.parse(formData.get("items") as string || "[]");

  const validatedFields = InvoiceSchema.safeParse({
    customerId: formData.get("customerId"),
    invoiceNumber: formData.get("invoiceNumber"),
    issueDate: formData.get("issueDate"),
    dueDate: formData.get("dueDate"),
    items: items,
    notes: formData.get("notes"),
    status: formData.get("status") || "draft",
  });


  if (!validatedFields.success) {
      console.error("Validation Error:", validatedFields.error.flatten());
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: "Error de validación. Por favor revise los campos.",
      };
    }


  const { customerId, items: validatedItems, ...invoiceData } = validatedFields.data;

  try {
    // Fetch customer name (optional, for denormalization)
    const customer = await getCustomerById(customerId);

    const processedItems = validatedItems.map(item => ({
        ...item,
        id: item.id || `item_${invoiceItemIdCounter++}`, // Assign new ID if missing
      }));

    const totalAmount = processedItems.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0
      );

    const newInvoice = {
      id: `inv_${invoiceIdCounter++}`,
      ...invoiceData,
      customerId,
      customerName: customer?.name || 'Cliente Desconocido', // Store customer name
      items: processedItems,
      totalAmount: parseFloat(totalAmount.toFixed(2)), // Ensure 2 decimal places
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    invoices.push(newInvoice);
    console.log("Invoice added:", newInvoice);
    revalidatePath("/invoices");
    return { message: "Factura creada exitosamente.", success: true };
  } catch (error) {
    console.error("Database Error:", error);
    return { message: "Error al crear factura." };
  }
}


export async function updateInvoice(id: string, prevState: any, formData: FormData) {

   const items = JSON.parse(formData.get("items") as string || "[]");

   const validatedFields = InvoiceSchema.safeParse({
     customerId: formData.get("customerId"),
     invoiceNumber: formData.get("invoiceNumber"),
     issueDate: formData.get("issueDate"),
     dueDate: formData.get("dueDate"),
     items: items,
     notes: formData.get("notes"),
     status: formData.get("status") || "draft",
   });


   if (!validatedFields.success) {
       console.error("Validation Error:", validatedFields.error.flatten());
       return {
         errors: validatedFields.error.flatten().fieldErrors,
         message: "Error de validación. Por favor revise los campos.",
       };
     }

   const { customerId, items: validatedItems, ...invoiceData } = validatedFields.data;

   try {
     const invoiceIndex = invoices.findIndex((inv) => inv.id === id);
     if (invoiceIndex === -1) {
       return { message: "Factura no encontrada." };
     }

     // Fetch customer name (optional, for denormalization)
     const customer = await getCustomerById(customerId);

     // Process items: assign new IDs if needed
     const processedItems = validatedItems.map(item => ({
       ...item,
       id: item.id || `item_${invoiceItemIdCounter++}`, // Assign new ID if missing
     }));


     const totalAmount = processedItems.reduce(
         (sum, item) => sum + item.quantity * item.unitPrice,
         0
       );


     invoices[invoiceIndex] = {
       ...invoices[invoiceIndex],
       ...invoiceData,
       customerId,
       customerName: customer?.name || invoices[invoiceIndex].customerName || 'Cliente Desconocido', // Update or keep name
       items: processedItems,
       totalAmount: parseFloat(totalAmount.toFixed(2)),
       status: validatedFields.data.status,
       updatedAt: new Date(),
     };

     console.log("Invoice updated:", invoices[invoiceIndex]);
     revalidatePath("/invoices");
     revalidatePath(`/invoices/${id}/edit`);
     return { message: "Factura actualizada exitosamente.", success: true };
   } catch (error) {
     console.error("Database Error:", error);
     return { message: "Error al actualizar factura." };
   }
 }

export async function deleteInvoice(id: string) {
    try {
      const initialLength = invoices.length;
      invoices = invoices.filter((inv) => inv.id !== id);
       if (invoices.length === initialLength) {
            return { message: "Factura no encontrada." };
       }
      console.log("Invoice deleted:", id);
      revalidatePath("/invoices");
      return { message: "Factura eliminada exitosamente." };
    } catch (error) {
      console.error("Database Error:", error);
      return { message: "Error al eliminar factura." };
    }
  }


export async function getInvoices(): Promise<any[]> {
  // Replace with actual data fetching
  console.log("Fetching invoices...");
  await new Promise(resolve => setTimeout(resolve, 50)); // Simulate async fetch
  return invoices;
}

export async function getInvoiceById(id: string): Promise<any | null> {
    // Replace with actual data fetching
    await new Promise(resolve => setTimeout(resolve, 50)); // Simulate async fetch
    const invoice = invoices.find(inv => inv.id === id);
    return invoice || null;
}
