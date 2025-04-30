// src/lib/auth-utils.ts
import { auth } from '@/lib/firebase';
import { User } from 'firebase/auth';

/**
 * Gets the currently authenticated Firebase user.
 * Uses a Promise to handle the asynchronous nature of onAuthStateChanged.
 * Returns null if no user is logged in or if there's an error during initialization.
 */
export function getCurrentUser(): Promise<User | null> {
  return new Promise((resolve, reject) => {
    const unsubscribe = auth.onAuthStateChanged(
      (user) => {
        unsubscribe(); // Unsubscribe after getting the initial state
        resolve(user);
      },
      (error) => {
        console.error("Error getting auth state:", error);
        unsubscribe();
        reject(error); // Propagate the error if needed, or resolve(null)
      }
    );
  });
}
