import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { auth } from "../firebase/firebaseConfig"; // Your frontend Firebase config

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}



export const getAuthHeader = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  return user.getIdToken();
};
