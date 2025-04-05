"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  Menu,
  X,
  Ship,
  Shield,
  ArrowRight,
  Navigation,
  Map,
  Globe,
  BarChart3,
  Clock,
  DollarSign,
  RefreshCw,
  Package
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { useAuth } from "@clerk/nextjs"
import { useTheme } from "next-themes"
import ShipmentTracker from "@/components/ShipmentMap"

export default function Home() {
  const router = useRouter()
  const { isSignedIn, userId } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { theme } = useTheme()

  // Handle scroll for header transparency
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Function to handle auth button click
  const handleAuthClick = () => {
    if (isSignedIn) {
      router.push("/Dashboard") 
    } else {
      router.push("/sign-in")
    }
  }

  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  }

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }
  
  // Dynamic styles based on theme
  const isDark = theme === 'dark'

  return (
    <main className={cn(
      "min-h-screen transition-colors duration-300",
      isDark 
        ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white" 
        : "bg-gradient-to-br from-sky-50 via-white to-blue-50 text-slate-900"
    )}>
      {/* Header */}
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          scrolled
            ? isDark 
              ? "bg-slate-900/90 backdrop-blur-md shadow-md border-b border-sky-500/10" 
              : "bg-white/90 backdrop-blur-md shadow-md border-b border-slate-200"
            : "bg-transparent",
        )}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between py-4 px-6">
          <Link href="/" className="text-2xl font-bold flex items-center gap-2">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              isDark ? "bg-sky-500" : "bg-sky-600"
            )}>
              <Ship className="w-6 h-6 text-white" />
            </div>
            <span className={cn(
              "bg-clip-text text-transparent",
              isDark 
                ? "bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500"
                : "bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600"
            )}>
              GlobalRoute Navigator
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {["Home", "Services", "Dashboard", "Contact"].map((item, index) => (
              <Link
                key={index}
                href={item === "Dashboard" ? "/Dashboard" : "#"}
                className={cn(
                  "transition-colors relative py-2",
                  isDark 
                    ? index === 0 ? "text-sky-400 font-medium" : "text-white/80 hover:text-sky-400"
                    : index === 0 ? "text-sky-600 font-medium" : "text-slate-700 hover:text-sky-600"
                )}
              >
                {item}
                {index === 0 && (
                  <motion.div className={cn(
                    "absolute bottom-0 left-0 right-0 h-0.5",
                    isDark ? "bg-sky-400" : "bg-sky-600"
                  )} layoutId="navIndicator" />
                )}
              </Link>
            ))}
            <ThemeToggle />
          </nav>

          <div className="flex items-center gap-4">
            {isSignedIn ? (
              <Button
                className={cn(
                  "hidden md:flex text-white rounded-xl px-6 shadow-lg",
                  isDark 
                    ? "bg-sky-600 hover:bg-sky-700 shadow-sky-500/20" 
                    : "bg-sky-600 hover:bg-sky-700 shadow-sky-600/20"
                )}
                onClick={handleAuthClick}
              >
                My Dashboard
              </Button>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Button
                  variant="outline"
                  className={cn(
                    "rounded-xl px-6",
                    isDark 
                      ? "border-sky-500 text-sky-400 hover:bg-sky-500/10" 
                      : "border-sky-600 text-sky-600 hover:bg-sky-100"
                  )}
                  onClick={() => router.push("/sign-in")}
                >
                  Sign In
                </Button>
                <Button
                  className={cn(
                    "text-white rounded-xl px-6 shadow-lg",
                    isDark 
                      ? "bg-sky-600 hover:bg-sky-700 shadow-sky-500/20" 
                      : "bg-sky-600 hover:bg-sky-700 shadow-sky-600/20"
                  )}
                  onClick={() => router.push("/sign-up")}
                >
                  Sign Up
                </Button>
              </div>
            )}
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className={cn("md:hidden", isDark ? "text-white" : "text-slate-900")}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className={cn(
              "md:hidden backdrop-blur-md border-t",
              isDark 
                ? "bg-slate-800/90 border-sky-500/10" 
                : "bg-white/90 border-slate-200"
            )}
          >
            <div className="px-6 py-4 space-y-4">
              {["Home", "Services", "Dashboard", "Contact"].map((item, index) => (
                <Link
                  key={index}
                  href={item === "Dashboard" ? "/Dashboard" : "#"}
                  className={cn(
                    "block py-2 transition-colors",
                    isDark 
                      ? index === 0 ? "text-sky-400 font-medium" : "text-white/80 hover:text-sky-400"
                      : index === 0 ? "text-sky-600 font-medium" : "text-slate-700 hover:text-sky-600"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item}
                </Link>
              ))}
              {isSignedIn ? (
                <Button
                  className={cn(
                    "w-full text-white rounded-xl mt-4",
                    isDark ? "bg-sky-600 hover:bg-sky-700" : "bg-sky-600 hover:bg-sky-700"
                  )}
                  onClick={handleAuthClick}
                >
                  My Dashboard
                </Button>
              ) : (
                <div className="space-y-2 mt-4">
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full rounded-xl",
                      isDark 
                        ? "border-sky-500 text-sky-400 hover:bg-sky-500/10" 
                        : "border-sky-600 text-sky-600 hover:bg-sky-100"
                    )}
                    onClick={() => router.push("/sign-in")}
                  >
                    Sign In
                  </Button>
                  <Button
                    className={cn(
                      "w-full text-white rounded-xl",
                      isDark ? "bg-sky-600 hover:bg-sky-700" : "bg-sky-600 hover:bg-sky-700"
                    )}
                    onClick={() => router.push("/sign-up")}
                  >
                    Sign Up
                  </Button>
                </div>
              )}
              <div className={cn(
                "pt-2 border-t",
                isDark ? "border-sky-500/10" : "border-slate-200"
              )}>
                <ThemeToggle />
              </div>
            </div>
          </motion.div>
        )}
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 md:px-6 max-w-7xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
          className="mb-12 text-center"
        >
          <div className={cn(
            "inline-block px-3 py-1 mb-6 text-xs font-medium rounded-full border",
            isDark 
              ? "text-sky-400 bg-sky-500/10 border-sky-500/20" 
              : "text-sky-600 bg-sky-100 border-sky-200"
          )}>
            LOGISTICS SOLUTIONS
          </div>
          <h1 className={cn(
            "text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight mx-auto",
            isDark ? "text-white" : "text-slate-900"
          )}>
            INTELLIGENT{" "}
            <span className={cn(
              "bg-clip-text text-transparent relative",
              isDark 
                ? "bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500" 
                : "bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600"
            )}>
              ROUTE PLANNING
              <svg
                className={cn(
                  "absolute -bottom-2 left-0 w-full h-2",
                  isDark ? "text-sky-500/30" : "text-sky-500/50"
                )}
                viewBox="0 0 200 8"
                preserveAspectRatio="none"
              >
                <path d="M0,5 C50,0 150,0 200,5" stroke="currentColor" strokeWidth="3" fill="none" />
              </svg>
            </span>
            <br />
            FOR GLOBAL LOGISTICS.
          </h1>
          <p className={cn(
            "text-sm md:text-base max-w-2xl mx-auto leading-relaxed mb-8",
            isDark ? "text-white/70" : "text-slate-700"
          )}>
            Transport is the lifeline of commerce—bridging distances, delivering possibilities. We connect producers to markets, suppliers to customers, and ideas to reality by ensuring seamless movement of goods and services across time and space. From production to distribution, we keep the world moving.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button 
              className={cn(
                "text-white rounded-xl px-8 py-6 group shadow-lg flex items-center",
                isDark 
                  ? "bg-sky-600 hover:bg-sky-700 shadow-sky-500/20" 
                  : "bg-sky-600 hover:bg-sky-700 shadow-sky-600/20"
              )}
              onClick={() => router.push("/new")}
            >
              <Map className="h-5 w-5 mr-2" />
              PLAN YOUR ROUTE
              <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button 
              variant="outline" 
              className={cn(
                "rounded-xl px-8 py-6 border-2",
                isDark 
                  ? "border-sky-500/50 text-sky-400 hover:bg-sky-500/10" 
                  : "border-sky-600/50 text-sky-600 hover:bg-sky-100"
              )}
              onClick={() => router.push("/track")}
            >
              <Navigation className="h-5 w-5 mr-2" />
              TRACK SHIPMENT
            </Button>
          </div>
        </motion.div>

        {/* Feature Highlights */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{
            hidden: { opacity: 0, y: 40 },
            visible: {
              opacity: 1,
              y: 0,
              transition: { duration: 0.8, delay: 0.2 },
            },
          }}
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {[
            {
              icon: <Globe className="h-10 w-10" />,
              title: "Global Coverage",
              description: "Plan routes across multiple countries with geopolitical insights"
            },
            {
              icon: <BarChart3 className="h-10 w-10" />,
              title: "Multi-Modal Transport",
              description: "Combine sea, air, and land transportation for optimal efficiency"
            },
            {
              icon: <Shield className="h-10 w-10" />,
              title: "Risk Assessment",
              description: "Avoid high-risk regions and minimize transport disruptions"
            }
          ].map((feature, index) => (
              <motion.div
                key={index}
                whileHover={{ y: -10 }}
              className={cn(
                "p-8 rounded-2xl border shadow-xl transition-all duration-300",
                isDark 
                  ? "bg-white/5 backdrop-blur-lg border-white/10 hover:shadow-sky-500/10" 
                  : "bg-white border-slate-200 hover:shadow-sky-500/10"
              )}
            >
              <div className={isDark ? "text-sky-400" : "text-sky-600"} className="mb-4">{feature.icon}</div>
              <h3 className={cn(
                "text-xl font-semibold mb-2",
                isDark ? "text-white" : "text-slate-900"
              )}>{feature.title}</h3>
              <p className={isDark ? "text-white/60" : "text-slate-600"}>{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>

        {/* Map Visualization Preview */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={{
            hidden: { opacity: 0, y: 40 },
                visible: {
                  opacity: 1,
              y: 0,
              transition: { duration: 0.8, delay: 0.4 },
            },
          }}
          className="mt-20 relative"
        >
          {isDark && (
            <>
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-sky-500/20 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl"></div>
            </>
          )}
          
          <div className={cn(
            "rounded-2xl p-3 border shadow-2xl overflow-hidden relative z-10",
            isDark 
              ? "bg-white/5 backdrop-blur-lg border-white/10" 
              : "bg-white border-slate-200"
          )}>
                <Image
              src="https://c4.wallpaperflare.com/wallpaper/94/771/647/dusk-industrial-ship-cargo-wallpaper-preview.jpg"
              alt="Route Planning Interface"
              width={1200}
              height={600}
              className="rounded-xl object-cover w-full h-[500px]"
            />
            <div className={cn(
              "absolute inset-0 flex items-end rounded-xl",
              isDark 
                ? "bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" 
                : "bg-gradient-to-t from-slate-900/70 via-transparent to-transparent"
            )}>
              <div className="p-8">
                <h3 className="text-2xl font-bold text-white mb-2">Advanced Visualization</h3>
                <p className="text-white/80 max-w-2xl mb-4">
                  See your shipment routes come to life with our interactive mapping technology. Analyze alternate paths, avoid risk zones, and optimize for cost or speed.
                </p>
                <Button 
                  className="bg-sky-600 hover:bg-sky-700 text-white rounded-xl px-6" 
                  onClick={() => router.push("/new")}
                >
                  Try Route Planner
                </Button>
              </div>
          </div>
        </div>
        </motion.div>
      </section>

      {/* Additional Features (below video) */}
      <section className={cn(
        "py-20 px-6",
        isDark ? "bg-slate-800" : "bg-slate-50"
      )}>
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="text-center mb-16"
          >
            <div className={cn(
              "inline-block px-3 py-1 mb-4 text-xs font-medium rounded-full",
              isDark ? "text-sky-400 bg-sky-500/10" : "text-sky-600 bg-sky-100"
            )}>
              KEY CAPABILITIES
            </div>
            <h2 className={cn(
              "text-3xl md:text-4xl font-bold",
              isDark ? "text-white" : "text-slate-900"
            )}>Powerful Technology Solutions</h2>
            <div className={cn(
              "w-20 h-1 mx-auto mt-6 rounded-full",
              isDark ? "bg-sky-500" : "bg-sky-600"
            )} />
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Clock className="h-12 w-12" />,
                title: "Real-Time Updates",
                description: "Get instant notifications on delays, weather impacts, and border status changes affecting your routes."
              },
              {
                icon: <DollarSign className="h-12 w-12" />,
                title: "Cost Optimization",
                description: "Our algorithms find the perfect balance between speed, cost, and reliability for your logistics needs."
              },
              {
                icon: <RefreshCw className="h-12 w-12" />,
                title: "Adaptive Routing",
                description: "Dynamic re-routing capabilities that adjust to unexpected events and changing conditions."
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
                whileHover={{ y: -10, transition: { delay: 0 } }}
                className={cn(
                  "p-8 rounded-2xl border shadow-xl transition-all duration-300 text-center",
                  isDark 
                    ? "bg-white/5 backdrop-blur-lg border-white/10 hover:shadow-sky-500/10" 
                    : "bg-white border-slate-200 hover:shadow-sky-500/10"
                )}
              >
                <div className={cn(
                  "mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-6",
                  isDark ? "bg-sky-500/10 text-sky-400" : "bg-sky-100 text-sky-600"
                )}>
                  {feature.icon}
                        </div>
                <h3 className={cn(
                  "text-xl font-bold mb-4",
                  isDark ? "text-white" : "text-slate-900"
                )}>{feature.title}</h3>
                <p className={isDark ? "text-white/60" : "text-slate-600"}>{feature.description}</p>
                  </motion.div>
              ))}
            </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={cn(
        "py-12 px-6 border-t",
        isDark 
          ? "bg-slate-900 text-white/60 border-sky-500/10" 
          : "bg-white text-slate-600 border-slate-200"
      )}>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
            <Link href="/" className={cn(
              "text-xl font-bold flex items-center gap-2 mb-4",
              isDark ? "text-white" : "text-slate-900"
            )}>
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center",
                isDark ? "bg-sky-500" : "bg-sky-600"
              )}>
                  <Ship className="w-5 h-5 text-white" />
                </div>
              <span>GlobalRoute</span>
              </Link>
            <p className="mb-4">
              Logistics solutions that optimize your supply chain, reduce costs, and improve efficiency.
            </p>
              </div>
          
            <div>
            <h3 className={cn(
              "font-bold mb-4",
              isDark ? "text-white" : "text-slate-900"
            )}>Services</h3>
            <ul className="space-y-2">
              <li><Link href="#" className={cn(
                "transition-colors",
                isDark ? "hover:text-sky-400" : "hover:text-sky-600"
              )}>Route Planning</Link></li>
              <li><Link href="#" className={cn(
                "transition-colors",
                isDark ? "hover:text-sky-400" : "hover:text-sky-600"
              )}>Risk Assessment</Link></li>
              <li><Link href="#" className={cn(
                "transition-colors",
                isDark ? "hover:text-sky-400" : "hover:text-sky-600"
              )}>Shipment Tracking</Link></li>
              </ul>
            </div>
          
            <div>
            <h3 className={cn(
              "font-bold mb-4",
              isDark ? "text-white" : "text-slate-900"
            )}>Company</h3>
            <ul className="space-y-2">
              <li><Link href="#" className={cn(
                "transition-colors",
                isDark ? "hover:text-sky-400" : "hover:text-sky-600"
              )}>About Us</Link></li>
              <li><Link href="#" className={cn(
                "transition-colors",
                isDark ? "hover:text-sky-400" : "hover:text-sky-600"
              )}>Contact</Link></li>
              </ul>
            </div>
          
            <div>
            <h3 className={cn(
              "font-bold mb-4",
              isDark ? "text-white" : "text-slate-900"
            )}>Legal</h3>
            <ul className="space-y-2">
              <li><Link href="#" className={cn(
                "transition-colors",
                isDark ? "hover:text-sky-400" : "hover:text-sky-600"
              )}>Terms of Service</Link></li>
              <li><Link href="#" className={cn(
                "transition-colors",
                isDark ? "hover:text-sky-400" : "hover:text-sky-600"
              )}>Privacy Policy</Link></li>
            </ul>
                  </div>
                </div>
        
        <div className={cn(
          "max-w-7xl mx-auto mt-12 pt-8 border-t text-center text-sm",
          isDark ? "border-white/10" : "border-slate-200"
        )}>
          © {new Date().getFullYear()} GlobalRoute Navigator. All rights reserved.
        </div>
      </footer>
    </main>
  )
}

