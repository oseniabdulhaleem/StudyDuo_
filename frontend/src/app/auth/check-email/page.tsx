// /auth/check-email/page.tsx
"use client";
import { useState, useEffect } from "react";
import { auth } from "@/firebase/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { sendEmailVerification } from "firebase/auth";
import { useRouter } from "next/navigation";

const CheckEmailPage = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Listen for changes in authentication state
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setLoading(false);
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Redirect the user if their email is verified
    if (user && user.emailVerified) {
      router.push("/dashboard");
    }
  }, [user, router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    // If user is not authenticated, redirect to login page
    router.push("/auth/login");
    return null;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-700 mb-6">
          Check Your Email
        </h2>

        <p className="text-center text-gray-600 mb-4">
          We have sent you a verification email. Please check your inbox and
          verify your email address to continue.
        </p>

        <p className="text-center text-gray-600">
          If you didn’t receive the email, you can{" "}
          <button
            className="text-blue-500 hover:underline"
            onClick={async () => {
              if (user) {
                await sendEmailVerification(user);
                alert("Verification email sent again!");
              }
            }}
          >
            request it again
          </button>
          .
        </p>
      </div>
    </div>
  );
};

export default CheckEmailPage;
