
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from '@/lib/firebase';
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    query,
    where,
    Timestamp,
    writeBatch,
    serverTimestamp,
    QuerySnapshot
} from 'firebase/firestore';
import { auth } from '@/lib/firebase'; // Assuming auth is exported from firebase config
import { getCurrentUser } from '@/lib/auth-utils'; // Helper to get current user

import type { Customer, Invoice, InvoiceItem, NcfType } from '@/lib/definitions';
import { ncfTypeDescriptions } from '@/lib/definitions';

// --- Validation Schemas ---

// Basic RNC/Cedula validation (adjust regex as needed for strictness)
const cedulaRncRegex = /^[0-9]{9,11}$/; // Simple 9 or 11 digit check

const CustomerSchema = z.object({
  name: z.string().min(1, { message: "El nombre es requerido." }),
  cedula_rnc: z.string()
    .optional()
    .refine((val) => !val || cedulaRncRegex.test(val), {
        message: "Cédula/RNC inválido (debe tener 9 u 11 dígitos)."
     }).or(z.literal('')),
  email: z.string().email({ message: "Email inválido." }).optional().or(z.literal('')),
  address: z.string().optional(),
  phone: z.string().optional(),
});

const InvoiceItemSchema = z.object({
    id: z.string().optional(), // Firestore will generate ID for new items if not provided
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
  ncfType: z.enum(Object.keys(ncfTypeDescriptions) as [NcfType, ...NcfType[]]).optional(),
  ncf: z.string().optional(), // Add validation logic if needed (e.g., length based on type)
}).refine(data => !!data.ncfType === !!data.ncf, {
    message: "Debe proporcionar tanto el Tipo de Comprobante Fiscal como el NCF, o ninguno.",
    path: ["ncfType"], // Attach error to ncfType field
}).refine(data => !data.ncf || (data.ncf && data.ncf.length > 0), { // Example basic NCF check
    message: "NCF no puede estar vacío si se selecciona un tipo.",
    path: ["ncf"],
});

// --- Utility Functions ---

const getCustomersCollection = (userId: string) => collection(db, 'users', userId, 'customers');
const getInvoicesCollection = (userId: string) => collection(db, 'users', userId, 'invoices');

// --- Customer Actions ---

export async function addCustomer(formData: FormData) {
    const user = await getCurrentUser();
    if (!user) return { message: "Error: Usuario no autenticado." };

    const validatedFields = CustomerSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
      console.error("Validation Error:", validatedFields.error.flatten().fieldErrors);
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: "Error de validación.",
      };
    }

    try {
      const customersCol = getCustomersCollection(user.uid);
      await addDoc(customersCol, {
        ...validatedFields.data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      console.log("Customer added for user:", user.uid);
      revalidatePath("/customers");
      return { message: "Cliente añadido exitosamente." };
    } catch (error) {
      console.error("Firestore Error:", error);
      return { message: "Error al añadir cliente en la base de datos." };
    }
}

export async function updateCustomer(id: string, formData: FormData) {
    const user = await getCurrentUser();
    if (!user) return { message: "Error: Usuario no autenticado." };

    const validatedFields = CustomerSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
      console.error("Validation Error:", validatedFields.error.flatten().fieldErrors);
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: "Error de validación.",
      };
    }

    try {
      const customerDocRef = doc(db, 'users', user.uid, 'customers', id);
      // Check if doc exists (optional but good practice)
      const docSnap = await getDoc(customerDocRef);
      if (!docSnap.exists()) {
         return { message: "Error: Cliente no encontrado." };
      }

      await updateDoc(customerDocRef, {
        ...validatedFields.data,
        updatedAt: serverTimestamp(),
      });
      console.log("Customer updated:", id);
      revalidatePath("/customers");
      revalidatePath(`/customers/${id}/edit`);
      return { message: "Cliente actualizado exitosamente." };
    } catch (error) {
      console.error("Firestore Error:", error);
      return { message: "Error al actualizar cliente en la base de datos." };
    }
}


export async function deleteCustomer(id: string) {
    const user = await getCurrentUser();
    if (!user) return { message: "Error: Usuario no autenticado." };

    try {
      const customerDocRef = doc(db, 'users', user.uid, 'customers', id);
      // Check if doc exists before deleting
      const docSnap = await getDoc(customerDocRef);
      if (!docSnap.exists()) {
         return { message: "Error: Cliente no encontrado." };
      }

      // Optional: Check for linked invoices before deleting
      const invoicesQuery = query(getInvoicesCollection(user.uid), where("customerId", "==", id));
      const invoiceSnapshots = await getDocs(invoicesQuery);
      if (!invoiceSnapshots.empty) {
         return { message: `Error: No se puede eliminar el cliente porque tiene ${invoiceSnapshots.size} factura(s) asociada(s).` };
      }


      await deleteDoc(customerDocRef);
      console.log("Customer deleted:", id);
      revalidatePath("/customers");
      return { message: "Cliente eliminado exitosamente." };
    } catch (error) {
      console.error("Firestore Error:", error);
      return { message: "Error al eliminar cliente de la base de datos." };
    }
}

export async function getCustomers(): Promise<Customer[]> {
    const user = await getCurrentUser();
    if (!user) return []; // Return empty if no user

    try {
      console.log("Fetching customers for user:", user.uid);
      const customersCol = getCustomersCollection(user.uid);
      const customerSnapshot = await getDocs(customersCol);
      const customerList = customerSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Ensure dates are Date objects if needed, though often handled client-side
        createdAt: doc.data().createdAt instanceof Timestamp ? doc.data().createdAt.toDate() : doc.data().createdAt,
        updatedAt: doc.data().updatedAt instanceof Timestamp ? doc.data().updatedAt.toDate() : doc.data().updatedAt,
      } as Customer));
      return customerList;
    } catch (error) {
      console.error("Firestore Error fetching customers:", error);
      return [];
    }
}

export async function getCustomerById(id: string): Promise<Customer | null> {
    const user = await getCurrentUser();
    if (!user) return null;

    try {
      const customerDocRef = doc(db, 'users', user.uid, 'customers', id);
      const docSnap = await getDoc(customerDocRef);

      if (docSnap.exists()) {
        return {
             id: docSnap.id,
             ...docSnap.data(),
             createdAt: docSnap.data().createdAt instanceof Timestamp ? docSnap.data().createdAt.toDate() : docSnap.data().createdAt,
             updatedAt: docSnap.data().updatedAt instanceof Timestamp ? docSnap.data().updatedAt.toDate() : docSnap.data().updatedAt,
        } as Customer;
      } else {
        console.log("No such customer document!");
        return null;
      }
    } catch (error) {
      console.error("Firestore Error fetching customer by ID:", error);
      return null;
    }
}

// --- Invoice Actions ---

// ITBIS Rate for Dominican Republic
const ITBIS_RATE = 0.18;

export async function addInvoice(prevState: any, formData: FormData) {
    const user = await getCurrentUser();
    if (!user) return { message: "Error: Usuario no autenticado." };

    // Parse items - ensure robust parsing
    let itemsRaw = formData.get("items");
    let items = [];
    try {
        items = JSON.parse(itemsRaw as string || "[]");
        if (!Array.isArray(items)) throw new Error("Items must be an array.");
    } catch (e) {
        console.error("Item Parsing Error:", e);
        return { message: "Error procesando los items de la factura." };
    }

    const validatedFields = InvoiceSchema.safeParse({
      ...Object.fromEntries(formData.entries()), // Get other fields
      items: items, // Use parsed items
      issueDate: formData.get("issueDate") ? new Date(formData.get("issueDate") as string) : undefined,
      dueDate: formData.get("dueDate") ? new Date(formData.get("dueDate") as string) : undefined,
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
        // Fetch customer data for denormalization
        const customer = await getCustomerById(customerId);
        if (!customer) {
            return { message: "Error: Cliente seleccionado no encontrado." };
        }

        // Calculate totals
        const subTotal = validatedItems.reduce(
            (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
            0
        );
        const itbisAmount = subTotal * ITBIS_RATE;
        const totalAmount = subTotal + itbisAmount;

        const invoicesCol = getInvoicesCollection(user.uid);
        await addDoc(invoicesCol, {
            ...invoiceData,
            customerId,
            customerName: customer.name, // Denormalize name
            customerCedulaRnc: customer.cedula_rnc || '', // Denormalize cedula/rnc
            items: validatedItems.map(item => ({ ...item })), // Ensure plain objects
            subTotal: parseFloat(subTotal.toFixed(2)),
            itbisRate: ITBIS_RATE,
            itbisAmount: parseFloat(itbisAmount.toFixed(2)),
            totalAmount: parseFloat(totalAmount.toFixed(2)),
            issueDate: Timestamp.fromDate(invoiceData.issueDate), // Convert to Firestore Timestamp
            dueDate: Timestamp.fromDate(invoiceData.dueDate),     // Convert to Firestore Timestamp
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            userId: user.uid, // Associate invoice with user
        });

        console.log("Invoice added for user:", user.uid);
        revalidatePath("/invoices");
        return { message: "Factura creada exitosamente.", success: true };
    } catch (error) {
        console.error("Firestore Error:", error);
        return { message: "Error al crear la factura en la base de datos." };
    }
}


export async function updateInvoice(id: string, prevState: any, formData: FormData) {
    const user = await getCurrentUser();
    if (!user) return { message: "Error: Usuario no autenticado." };

    let itemsRaw = formData.get("items");
    let items = [];
    try {
        items = JSON.parse(itemsRaw as string || "[]");
         if (!Array.isArray(items)) throw new Error("Items must be an array.");
    } catch (e) {
        console.error("Item Parsing Error:", e);
        return { message: "Error procesando los items de la factura." };
    }

    const validatedFields = InvoiceSchema.safeParse({
        ...Object.fromEntries(formData.entries()),
        items: items,
        issueDate: formData.get("issueDate") ? new Date(formData.get("issueDate") as string) : undefined,
        dueDate: formData.get("dueDate") ? new Date(formData.get("dueDate") as string) : undefined,
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
        const invoiceDocRef = doc(db, 'users', user.uid, 'invoices', id);
        const invoiceSnap = await getDoc(invoiceDocRef);
        if (!invoiceSnap.exists()) {
            return { message: "Error: Factura no encontrada." };
        }

        const customer = await getCustomerById(customerId);
         if (!customer) {
             return { message: "Error: Cliente seleccionado no encontrado." };
         }

        // Recalculate totals
        const subTotal = validatedItems.reduce(
            (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
            0
        );
        const itbisAmount = subTotal * ITBIS_RATE;
        const totalAmount = subTotal + itbisAmount;

        await updateDoc(invoiceDocRef, {
            ...invoiceData,
            customerId,
            customerName: customer.name,
            customerCedulaRnc: customer.cedula_rnc || '',
            items: validatedItems.map(item => ({ ...item })),
            subTotal: parseFloat(subTotal.toFixed(2)),
            itbisRate: ITBIS_RATE,
            itbisAmount: parseFloat(itbisAmount.toFixed(2)),
            totalAmount: parseFloat(totalAmount.toFixed(2)),
            issueDate: Timestamp.fromDate(invoiceData.issueDate),
            dueDate: Timestamp.fromDate(invoiceData.dueDate),
            updatedAt: serverTimestamp(),
            userId: user.uid, // Ensure userId remains associated
        });

        console.log("Invoice updated:", id);
        revalidatePath("/invoices");
        revalidatePath(`/invoices/${id}/edit`);
        return { message: "Factura actualizada exitosamente.", success: true };
    } catch (error) {
        console.error("Firestore Error:", error);
        return { message: "Error al actualizar la factura en la base de datos." };
    }
}

export async function deleteInvoice(id: string) {
    const user = await getCurrentUser();
    if (!user) return { message: "Error: Usuario no autenticado." };

    try {
        const invoiceDocRef = doc(db, 'users', user.uid, 'invoices', id);
        const docSnap = await getDoc(invoiceDocRef);
        if (!docSnap.exists()) {
            return { message: "Error: Factura no encontrada." };
        }

        await deleteDoc(invoiceDocRef);
        console.log("Invoice deleted:", id);
        revalidatePath("/invoices");
        return { message: "Factura eliminada exitosamente." };
    } catch (error) {
        console.error("Firestore Error:", error);
        return { message: "Error al eliminar la factura de la base de datos." };
    }
}


export async function getInvoices(): Promise<Invoice[]> {
    const user = await getCurrentUser();
    if (!user) return [];

    try {
        console.log("Fetching invoices for user:", user.uid);
        const invoicesCol = getInvoicesCollection(user.uid);
        // Optional: Order by creation date descending
        // const q = query(invoicesCol, orderBy("createdAt", "desc"));
        const invoiceSnapshot = await getDocs(invoicesCol); // Use q here if ordering
        const invoiceList = invoiceSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                issueDate: data.issueDate instanceof Timestamp ? data.issueDate.toDate() : data.issueDate,
                dueDate: data.dueDate instanceof Timestamp ? data.dueDate.toDate() : data.dueDate,
                createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
                updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
                // Ensure numeric types if necessary
                subTotal: Number(data.subTotal || 0),
                itbisAmount: Number(data.itbisAmount || 0),
                totalAmount: Number(data.totalAmount || 0),
            } as Invoice;
        });
        return invoiceList;
    } catch (error) {
        console.error("Firestore Error fetching invoices:", error);
        return [];
    }
}

export async function getInvoiceById(id: string): Promise<Invoice | null> {
    const user = await getCurrentUser();
    if (!user) return null;

    try {
        const invoiceDocRef = doc(db, 'users', user.uid, 'invoices', id);
        const docSnap = await getDoc(invoiceDocRef);

        if (docSnap.exists()) {
             const data = docSnap.data();
             return {
                 id: docSnap.id,
                 ...data,
                 issueDate: data.issueDate instanceof Timestamp ? data.issueDate.toDate() : data.issueDate,
                 dueDate: data.dueDate instanceof Timestamp ? data.dueDate.toDate() : data.dueDate,
                 createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
                 updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
                 subTotal: Number(data.subTotal || 0),
                 itbisAmount: Number(data.itbisAmount || 0),
                 totalAmount: Number(data.totalAmount || 0),
             } as Invoice;
        } else {
            console.log("No such invoice document!");
            return null;
        }
    } catch (error) {
        console.error("Firestore Error fetching invoice by ID:", error);
        return null;
    }
}

export async function getInvoicesByCustomerId(customerId: string): Promise<Invoice[]> {
    const user = await getCurrentUser();
    if (!user) return [];

    try {
        const q = query(getInvoicesCollection(user.uid), where("customerId", "==", customerId));
        const querySnapshot = await getDocs(q);
        const invoices = querySnapshot.docs.map(doc => {
            const data = doc.data();
             return {
                 id: doc.id,
                 ...data,
                 issueDate: data.issueDate instanceof Timestamp ? data.issueDate.toDate() : data.issueDate,
                 dueDate: data.dueDate instanceof Timestamp ? data.dueDate.toDate() : data.dueDate,
                 createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
                 updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
                 subTotal: Number(data.subTotal || 0),
                 itbisAmount: Number(data.itbisAmount || 0),
                 totalAmount: Number(data.totalAmount || 0),
             } as Invoice;
        });
        return invoices;
    } catch (error) {
        console.error("Error fetching invoices by customer ID:", error);
        return [];
    }
}

// --- Placeholder Actions (To be implemented) ---

export async function downloadInvoicePdf(invoiceId: string): Promise<{ url?: string; error?: string }> {
    // TODO: Implement PDF generation logic (potentially using a Genkit flow or a serverless function)
    // 1. Fetch invoice data using getInvoiceById
    // 2. Generate PDF (e.g., call a Genkit flow with invoice data)
    // 3. Store PDF (e.g., Firebase Storage) and return download URL or handle direct download
    console.warn(`Download PDF not implemented for invoice: ${invoiceId}`);
    // Example using a hypothetical Genkit flow
    /*
    const user = await getCurrentUser();
    if (!user || !user.uid) return { error: 'Not authenticated' };
    const invoice = await getInvoiceById(invoiceId);
    if (!invoice || invoice.userId !== user.uid) return { error: 'Invoice not found or unauthorized' };
    try {
        const pdfResult = await generateInvoicePdfFlow({ invoiceData: invoice }); // Assuming a Genkit flow
        return { url: pdfResult.downloadUrl }; // Assuming flow returns URL
    } catch (error) {
        console.error("PDF Generation Error:", error);
        return { error: 'Failed to generate PDF.' };
    }
    */
    return { error: "Funcionalidad de descarga PDF no implementada." };
}

export async function sendInvoiceByEmail(invoiceId: string, email: string): Promise<{ success?: boolean; error?: string }> {
    // TODO: Implement email sending logic (potentially using Firebase Functions with SendGrid/Mailgun or a Genkit flow)
    // 1. Fetch invoice data
    // 2. Generate PDF (or fetch existing one)
    // 3. Send email with PDF attachment
    console.warn(`Send email not implemented for invoice: ${invoiceId} to ${email}`);
    return { error: "Funcionalidad de envío por correo no implementada." };
}

export async function backupDataToDrive(): Promise<{ success?: boolean; error?: string }> {
     // TODO: Implement Google Drive backup using Google APIs and Firebase Functions/Genkit
     console.warn("Google Drive backup not implemented.");
     return { error: "Funcionalidad de respaldo en Google Drive no implementada." };
}

export async function exportDataAsCsv(): Promise<{ data?: string; error?: string }> {
     // TODO: Implement CSV export
     // 1. Fetch all customer and invoice data for the user
     // 2. Convert data to CSV format (separate files or combined)
     // 3. Return CSV data string for download
     console.warn("CSV export not implemented.");
     return { error: "Funcionalidad de exportación CSV no implementada." };
}
