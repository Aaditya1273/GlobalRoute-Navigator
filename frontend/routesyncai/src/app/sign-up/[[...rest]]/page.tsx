"use client";

import { SignUp } from "@clerk/nextjs";
import { ClerkProvider } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { clerkConfig } from "@/lib/clerk-config";

export default function SignUpPage() {
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    // Client-side only code
    setIsLoaded(true);
  }, []);
  
  if (!isLoaded) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <ClerkProvider publishableKey={clerkConfig.publishableKey}>
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Create an account</h1>
            <p className="mt-2 text-sm text-gray-600">
              Sign up to start using our services
            </p>
          </div>
          
          <SignUp redirectUrl="/" />

          <div className="text-center text-sm">
            <span className="text-gray-500">Already have an account?</span>
            <a href="/sign-in" className="ml-1 font-medium text-blue-600 hover:text-blue-500">
              Sign in
            </a>
          </div>
        </div>
      </div>
    </ClerkProvider>
  );
}