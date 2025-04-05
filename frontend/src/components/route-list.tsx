"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Clock, DollarSign, AlertTriangle, Navigation, Truck, Ship, Plane, SplitSquareVertical, Route } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { RouteResponse } from "@/lib/types"

interface RouteListProps {
  routes: RouteResponse
  selectedRoute: number
  onRouteSelect: (index: number) => void
}

export function RouteList({ routes, selectedRoute, onRouteSelect }: RouteListProps) {
  if (!Array.isArray(routes.paths)) return null

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
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20'
      case 'sea':
        return 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20'
      case 'air':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
      default:
        return ''
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center space-x-2">
          <Navigation className="w-6 h-6 text-primary" />
          <span>Available Routes</span>
        </h2>
        <Badge variant="outline" className="bg-primary/10">
          {routes.paths.length} routes found
        </Badge>
      </div>
      <div className="space-y-4">
        {routes.paths.map((route, index) => (
          <Card
            key={index}
            className={`bg-white/5 backdrop-blur-lg border border-white/10 cursor-pointer transition-all duration-300 hover:bg-white/10 ${
              selectedRoute === index ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => onRouteSelect(index)}
          >
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-semibold">Route {index + 1}</h3>
                  {selectedRoute === index && (
                    <Badge className="bg-primary/20 text-primary border-primary/30">
                      Selected
                    </Badge>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {Array.from(new Set(route.edges.map(edge => edge.mode))).map(mode => (
                    <Badge
                      key={mode}
                      variant="outline"
                      className={`flex items-center space-x-2 ${getTransportColor(mode)}`}
                    >
                      {getTransportIcon(mode)}
                      <span>{mode}</span>
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-5 gap-2">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Time</p>
                    <p className="font-medium text-sm">{route.time_sum.toFixed(1)}h</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Cost</p>
                    <p className="font-medium text-sm">
                      ${route.price_sum < 1000 
                        ? route.price_sum.toFixed(2) 
                        : (route.price_sum / 1000).toFixed(2) + 'k'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-yellow-500/10 text-yellow-500">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">CO2</p>
                    <p className="font-medium text-sm">{route.CO2_sum.toFixed(1)}kg</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-500">
                    <SplitSquareVertical className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Segments</p>
                    <p className="font-medium text-sm">{route.edges.length}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
                    <Route className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Distance</p>
                    <p className="font-medium text-sm">{route.distance_sum.toFixed(2)} km</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}