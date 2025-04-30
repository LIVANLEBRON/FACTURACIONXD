"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Loader2, ChromeIcon } from 'lucide-react'; // Added ChromeIcon for Google
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: "Éxito", description: "Inicio de sesión correcto." });
      router.push('/'); // Redirect to home page after login
    } catch (error: any) {
      console.error("Login Error:", error);
      setError(getFirebaseAuthErrorMessage(error));
      toast({ title: "Error de inicio de sesión", description: getFirebaseAuthErrorMessage(error), variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

   const handleGoogleLogin = async () => {
     setIsGoogleLoading(true);
     setError(null);
     const provider = new GoogleAuthProvider();
     try {
       await signInWithPopup(auth, provider);
       toast({ title: "Éxito", description: "Inicio de sesión con Google correcto." });
       router.push('/'); // Redirect to home page after login
     } catch (error: any) {
       console.error("Google Login Error:", error);
       setError(getFirebaseAuthErrorMessage(error));
       toast({ title: "Error con Google", description: getFirebaseAuthErrorMessage(error), variant: "destructive" });
     } finally {
       setIsGoogleLoading(false);
     }
   };

    // Helper to provide user-friendly messages
    const getFirebaseAuthErrorMessage = (error: any): string => {
        switch (error.code) {
            case 'auth/invalid-email':
                return 'El formato del correo electrónico no es válido.';
            case 'auth/user-disabled':
                return 'Este usuario ha sido deshabilitado.';
            case 'auth/user-not-found':
            case 'auth/wrong-password':
            case 'auth/invalid-credential': // Handles both wrong password and user not found in newer SDKs
                 return 'Correo electrónico o contraseña incorrectos.';
            case 'auth/popup-closed-by-user':
                return 'El proceso de inicio de sesión con Google fue cancelado.';
            case 'auth/cancelled-popup-request':
                 return 'Se canceló la solicitud de inicio de sesión emergente.';
            case 'auth/popup-blocked':
                 return 'El navegador bloqueó la ventana emergente. Habilítalas para iniciar sesión.';
            default:
                return 'Ocurrió un error inesperado. Inténtalo de nuevo.';
        }
    };


  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Iniciar Sesión</CardTitle>
          <CardDescription>Accede a tu cuenta de Invoicify RD</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading || isGoogleLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading || isGoogleLoading}
              />
            </div>
             {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Iniciar Sesión'}
            </Button>
          </form>
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">O continuar con</span>
                </div>
            </div>
           <Button variant="outline" className="w-full" onClick={handleGoogleLogin} disabled={isLoading || isGoogleLoading}>
              {isGoogleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ChromeIcon className="mr-2 h-4 w-4" />}
              Google
           </Button>
           {/* Add link to sign up if applicable */}
           {/* <div className="text-center text-sm text-muted-foreground">
               ¿No tienes cuenta? <Link href="/signup" className="underline hover:text-primary">Regístrate</Link>
           </div> */}
        </CardContent>
      </Card>
    </div>
  );
}
