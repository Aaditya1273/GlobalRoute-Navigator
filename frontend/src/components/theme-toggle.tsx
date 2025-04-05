"use client"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  // Update localStorage directly as well (redundant but ensures consistency)
  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme)
    // Also store in localStorage for extra persistence
    try {
      localStorage.setItem('theme', newTheme)
    } catch (e) {
      console.error('Could not save theme to localStorage', e)
    }
  }

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="rounded-full">
        <span className="h-[1.2rem] w-[1.2rem]"></span>
        <span className="sr-only">Toggle theme</span>
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem 
          onClick={() => handleThemeChange("light")}
          className={theme === "light" ? "bg-slate-100 dark:bg-slate-700" : ""}
        >
          Light {theme === "light" && "✓"}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleThemeChange("dark")}
          className={theme === "dark" ? "bg-slate-100 dark:bg-slate-700" : ""}
        >
          Dark {theme === "dark" && "✓"}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleThemeChange("system")}
          className={theme === "system" ? "bg-slate-100 dark:bg-slate-700" : ""}
        >
          System {theme === "system" && "✓"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

