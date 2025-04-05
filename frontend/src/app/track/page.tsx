"use client"

import React from "react"
import { motion } from "framer-motion"
import { Package } from "lucide-react"
import ShipmentTracker from "@/components/ShipmentMap"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"

export default function TrackPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <main className={cn(
      "min-h-screen pt-32 pb-20 px-4 md:px-6 max-w-7xl mx-auto",
      isDark 
        ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white" 
        : "bg-gradient-to-br from-sky-50 via-white to-blue-50 text-slate-900"
    )}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col gap-2 mb-10"
      >
        <div className={cn(
          "inline-flex items-center gap-2 px-4 py-1 rounded-full text-sm font-medium self-start",
          isDark 
            ? "bg-sky-500/10 text-sky-400 border-sky-500/20" 
            : "bg-sky-100 text-sky-600 border-sky-200"
        )}>
          <Package className="h-4 w-4" />
          <span>SHIPMENT TRACKING</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold">Track Your Shipment</h1>
        <p className={cn(
          "max-w-3xl",
          isDark ? "text-white/70" : "text-slate-700"
        )}>
          Enter your tracking number to see real-time location, status updates, and estimated delivery time for your shipment.
        </p>
      </motion.div>

      <ShipmentTracker />
    </main>
  )
} 