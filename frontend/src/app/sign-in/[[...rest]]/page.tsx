"use client";

import { SignIn } from "@clerk/nextjs";
import { useState } from "react";

export default function SignInPage() {
  const [isSigningIn, setIsSigningIn] = useState(false);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your account to continue
          </p>
        </div>
        
        <SignIn redirectUrl="/" />
        
        <div className="text-center text-sm">
          <span className="text-gray-500">Don't have an account?</span>
          <a href="/sign-up" className="ml-1 font-medium text-blue-600 hover:text-blue-500">
            Sign up
          </a>
        </div>
      </div>
    </div>
  );
} 