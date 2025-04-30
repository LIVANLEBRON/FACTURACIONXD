"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from './auth-provider';
import { SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar'; // Assuming sidebar components are here
import { Button } from '@/components/ui/button'; // Or use sidebar button
import { LogIn, LogOut, User as UserIcon, Loader2 } from 'lucide-react'; // Import icons
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"


const AuthButton: React.FC = () => {
  const { user, loading } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login'); // Redirect to login after logout
    } catch (error) {
      console.error("Logout Error:", error);
      // Handle logout error (e.g., show toast)
    }
  };

  const handleLogin = () => {
    router.push('/login');
  };

  if (loading) {
      return (
        <SidebarMenuItem>
           <SidebarMenuButton disabled={true}>
                <Loader2 className="animate-spin" />
                <span>Cargando...</span>
            </SidebarMenuButton>
        </SidebarMenuItem>
      );
  }


  if (user) {
    // User is logged in - Show user info and logout button
    const getInitials = (name?: string | null) => {
      if (!name) return '?';
      return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    };

    return (
       <SidebarMenuItem>
            <DropdownMenu>
               <DropdownMenuTrigger asChild>
                   <SidebarMenuButton className="justify-start w-full">
                     <Avatar className="h-6 w-6 mr-2">
                       <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || 'Usuario'} />
                       <AvatarFallback>{getInitials(user.displayName || user.email)}</AvatarFallback>
                     </Avatar>
                     <span className="truncate flex-1">{user.displayName || user.email || 'Usuario'}</span>
                    </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" align="start" className="w-56">
                     <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                     <DropdownMenuSeparator />
                     <DropdownMenuItem disabled>
                        <UserIcon className="mr-2 h-4 w-4" />
                        <span>Perfil (Pronto)</span>
                      </DropdownMenuItem>
                     <DropdownMenuSeparator />
                     <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer">
                         <LogOut className="mr-2 h-4 w-4" />
                         <span>Cerrar Sesión</span>
                     </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </SidebarMenuItem>

    );
  } else {
    // User is not logged in - Show login button
    return (
      <SidebarMenuItem>
        <SidebarMenuButton onClick={handleLogin}>
          <LogIn />
          <span>Iniciar Sesión</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }
};

export default AuthButton;
