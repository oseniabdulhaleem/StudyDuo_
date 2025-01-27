// // src/components/providers/auth-provider.tsx
// "use client";

// import { createContext, useContext, useEffect, useState } from "react";
// import { auth } from "@/firebase/firebaseConfig";
// import { onAuthStateChanged, signOut } from "firebase/auth";
// import { useRouter } from "next/navigation";

// type AuthContextType = {
//   user: any;
//   loading: boolean;
//   logout: () => Promise<void>;
// };

// const AuthContext = createContext<AuthContextType>({
//   user: null,
//   loading: true,
//   logout: async () => {},
// });

// export function AuthProvider({ children }: { children: React.ReactNode }) {
//   const [user, setUser] = useState<any>(null);
//   const [loading, setLoading] = useState(true);
//   const router = useRouter();

//   const logout = async () => {
//     try {
//       await signOut(auth);
//       router.push("/auth/login");
//     } catch (error) {
//       console.error("Logout error:", error);
//     }
//   };

//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, (user) => {
//       if (user && user.emailVerified) {
//         setUser(user);
//       } else {
//         setUser(null);
//       }
//       setLoading(false);
//     });

//     return () => unsubscribe();
//   }, []);

//   return (
//     <AuthContext.Provider value={{ user, loading, logout }}>
//       {children}
//     </AuthContext.Provider>
//   );
// }

// export const useAuth = () => useContext(AuthContext);


// the above doesn't handle ssr and also doesn't store authToken on localStorage

// src/components/providers/auth-provider.tsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "@/firebase/firebaseConfig";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/toast";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const logout = async () => {
    try {
      setLoading(true);
      await signOut(auth);
      // Clear any local storage or tokens if needed
      localStorage.removeItem('authToken');
      setUser(null);
      toast({
        title: "Logged out successfully",
      });
      router.push('/auth/login');
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Error logging out",
        description: "Please try again",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only run authentication check on client side
    if (typeof window !== 'undefined') {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user && user.emailVerified) {
          setUser(user);
          // Optionally store auth token
          user.getIdToken().then(token => {
            localStorage.setItem('authToken', token);
          });
        } else {
          setUser(null);
          localStorage.removeItem('authToken');
        }
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, []);

  // Don't render children until initial authentication check is complete
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
