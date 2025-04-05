"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from "next-themes";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider 
      {...props} 
      storageKey="theme"
      enableSystem={true}
      enableColorScheme={true}
      attribute="class"
    >
      {children}
    </NextThemesProvider>
  );
}