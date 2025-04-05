"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Clock, DollarSign, AlertTriangle, Truck, Ship, Plane } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { RouteMap } from "@/components/route-map"
import type { RoutePath } from "@/lib/types"

interface RouteCardProps {
  route: RoutePath
  index: number
}

export function RouteCard({ route, index }: RouteCardProps) {
  const getTransportIcon = (mode: string) => {
    switch (mode) {
      case 'land':
        return <Truck className="w-4 h-4" />
      case 'sea':
        return <Ship className="w-4 h-4" />
      case 'air':
        return <Plane className="w-4 h-4" />
      default:
        return null
    }
  }

  const getTransportColor = (mode: string) => {
    switch (mode) {
      case 'land':
        return 'bg-amber-500/20 text-amber-500 border-amber-500/30'
      case 'sea':
        return 'bg-cyan-500/20 text-cyan-500 border-cyan-500/30'
      case 'air':
        return 'bg-blue-500/20 text-blue-500 border-blue-500/30'
      default:
        return ''
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card className="bg-white/5 backdrop-blur-lg border border-white/10 hover:bg-white/10 cursor-pointer transition-all duration-300 group overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader className="sm:p-6 p-4">
            <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <span className="text-base sm:text-lg font-bold flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-primary/50 flex items-center justify-center text-xs">
                  {index + 1}
                </div>
                Route {index + 1}
              </span>
              <Badge variant="outline" className="group-hover:bg-primary/20 transition-colors w-fit text-xs sm:text-sm font-medium">
                {route.edges.length} segments
              </Badge>
            </CardTitle>
            <CardDescription className="text-sm opacity-70">Click to view detailed route information</CardDescription>
          </CardHeader>
          <CardContent className="sm:p-6 p-4 pt-0">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              <div className="flex items-center space-x-3 p-2 sm:p-3 rounded-lg bg-white/5 border border-white/10 hover:border-emerald-500/30 transition-colors">
                <div className="p-1.5 sm:p-2 rounded-lg bg-emerald-500/15 text-emerald-500">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Time</p>
                  <p className="font-medium text-sm sm:text-base">{route.time_sum.toFixed(1)}h</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-2 sm:p-3 rounded-lg bg-white/5 border border-white/10 hover:border-blue-500/30 transition-colors">
                <div className="p-1.5 sm:p-2 rounded-lg bg-blue-500/15 text-blue-500">
                  <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Cost</p>
                  <p className="font-medium text-sm sm:text-base">
                    ${route.price_sum < 1000 
                      ? route.price_sum.toFixed(2) 
                      : (route.price_sum / 1000).toFixed(2) + 'k'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-2 sm:p-3 rounded-lg bg-white/5 border border-white/10 hover:border-yellow-500/30 transition-colors col-span-2 md:col-span-1">
                <div className="p-1.5 sm:p-2 rounded-lg bg-yellow-500/15 text-yellow-500">
                  <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">CO2</p>
                  <p className="font-medium text-sm sm:text-base">{route.CO2_sum.toFixed(1)}kg</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent className="max-w-full sm:max-w-4xl w-[calc(100vw-32px)] sm:w-auto bg-background/95 backdrop-blur-xl border border-white/10 p-4 sm:p-6 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-xl flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-primary/50 flex items-center justify-center text-xs">
              {index + 1}
            </div>
            Route {index + 1} Details
          </DialogTitle>
        </DialogHeader>
        <div className="h-[250px] sm:h-[400px] w-full mb-4 sm:mb-6 overflow-hidden rounded-lg border border-white/10 bg-white/5">
          <RouteMap route={route} />
        </div>
        <div className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            <div className="p-3 sm:p-4 rounded-lg bg-white/5 border border-white/10 hover:border-emerald-500/30 transition-all duration-200">
              <div className="flex items-center space-x-2 text-emerald-500 mb-2">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                <h4 className="font-semibold text-sm sm:text-base">Total Time</h4>
              </div>
              <p className="text-xl sm:text-2xl font-bold">
                {route.time_sum.toFixed(1)} 
                <span className="text-xs sm:text-sm font-normal text-muted-foreground ml-1">hours</span>
              </p>
            </div>
            <div className="p-3 sm:p-4 rounded-lg bg-white/5 border border-white/10 hover:border-blue-500/30 transition-all duration-200">
              <div className="flex items-center space-x-2 text-blue-500 mb-2">
                <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
                <h4 className="font-semibold text-sm sm:text-base">Total Cost</h4>
              </div>
              <p className="text-xl sm:text-2xl font-bold">
                ${route.price_sum < 1000 
                  ? route.price_sum.toFixed(2) 
                  : (route.price_sum / 1000).toFixed(2) + 'k'}
              </p>
            </div>
            <div className="p-3 sm:p-4 rounded-lg bg-white/5 border border-white/10 hover:border-yellow-500/30 transition-all duration-200 col-span-2 md:col-span-1">
              <div className="flex items-center space-x-2 text-yellow-500 mb-2">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
                <h4 className="font-semibold text-sm sm:text-base">CO2 Emissions</h4>
              </div>
              <p className="text-xl sm:text-2xl font-bold">
                {route.CO2_sum.toFixed(1)} 
                <span className="text-xs sm:text-sm font-normal text-muted-foreground ml-1">kg</span>
              </p>
            </div>
          </div>
          <div className="p-3 sm:p-4 rounded-lg bg-white/5 border border-white/10">
            <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base flex items-center gap-2">
              <span className="h-5 w-5 inline-flex items-center justify-center rounded-full bg-primary/20 text-xs">
                {route.edges.length}
              </span>
              Route Steps
            </h4>
            <div className="space-y-2">
              {route.edges.map((edge, i) => (
                <div
                  key={i}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 sm:p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">{edge.from}</span>
                      <span className="text-primary">→</span>
                      <span className="font-medium">{edge.to}</span>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`flex items-center space-x-2 ${getTransportColor(edge.mode)} text-xs w-fit`}
                  >
                    {getTransportIcon(edge.mode)}
                    <span>{edge.mode}</span>
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}