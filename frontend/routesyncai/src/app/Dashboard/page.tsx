"use client"

import Dashboard from '@/components/Dashboard'
import React, { useState, useEffect } from 'react'
import { ClerkProvider } from '@clerk/nextjs'
import { clerkConfig, handleClerkError } from '@/lib/clerk-config'

const page = () => {
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
      <div>
        <Dashboard/>
      </div>
    </ClerkProvider>
  )
}

export default page
