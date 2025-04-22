"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { 
  Navigation, 
  Clock, 
  DollarSign, 
  Trash2, 
  RefreshCw, 
  Plane, 
  Ship, 
  Truck, 
  Map, 
  AlertTriangle, 
  ShieldAlert, 
  Bomb, 
  CloudLightning, 
  FileWarning,
  CheckCircle,
  CornerDownRight,
  Save
} from 'lucide-react';
import { SavedRoute } from '@/services/saved-routes';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

// Create a new function to get routes from localStorage
function getLocalSavedRoutes(): SavedRoute[] {
  if (typeof window === 'undefined') return [];
  const storedRoutes = localStorage.getItem('savedRoutes');
  return storedRoutes ? JSON.parse(storedRoutes) : [];
}

// Create a new function to delete routes from localStorage
function deleteLocalSavedRoute(id: string): void {
  if (typeof window === 'undefined') return;
  const existingRoutes = getLocalSavedRoutes();
  const updatedRoutes = existingRoutes.filter(route => route.id !== id);
  localStorage.setItem('savedRoutes', JSON.stringify(updatedRoutes));
}

// Add a new function to save alternative routes
function saveAlternativeRoute(originalRoute: SavedRoute, alternativeIndex: number): SavedRoute {
  if (typeof window === 'undefined' || !originalRoute.routeData || !originalRoute.routeData.paths) {
    throw new Error("Cannot save alternative route: invalid data");
  }
  
  // Create a new route based on the original but with the alternative path
  const alternativePath = getAlternativePaths(originalRoute)[alternativeIndex];
  if (!alternativePath) {
    throw new Error("Alternative path not found");
  }
  
  const newRoute: SavedRoute = {
    ...originalRoute,
    id: Date.now().toString(), // New unique ID
    name: `${originalRoute.name} (Alternative ${alternativeIndex + 1})`,
    description: `Alternative route avoiding ${getRouteRisks(originalRoute).map(risk => risk.type).join(', ')}`,
    routeData: {
      ...originalRoute.routeData,
      paths: [alternativePath]
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  // Save to localStorage
  const existingRoutes = getLocalSavedRoutes();
  localStorage.setItem('savedRoutes', JSON.stringify([...existingRoutes, newRoute]));
  
  return newRoute;
}

// Helper functions for route risks and alternatives
function getRouteRisks(route: SavedRoute) {
  // In a real app, you would analyze the route against a global risk database
  // For demonstration, we'll generate some simulated risks based on route properties
  
  const risks = [];
  if (!route.routeData || !route.routeData.paths || !route.routeData.paths[0]) {
    return risks;
  }
  
  const path = route.routeData.paths[0];
  
  // Check high-risk countries or regions (simplified for demo)
  const highRiskRegions = [
    "Ukraine", "Syria", "Yemen", "Somalia", "Afghanistan", "Libya", 
    "Venezuela", "North Korea", "Iran", "Iraq"
  ];
  
  // Check for paths through high-risk countries
  if (path.path) {
    for (const location of path.path) {
      for (const region of highRiskRegions) {
        if (location.includes(region)) {
          risks.push({
            type: "Conflict Zone",
            location: location,
            severity: "high",
            icon: <Bomb className="h-4 w-4 text-red-400" />
          });
        }
      }
    }
  }
  
  // Check for sea routes near piracy areas
  if (path.edges && path.edges.some(edge => edge.mode?.toLowerCase() === "sea")) {
    const piracyAreas = [
      { region: "Gulf of Aden", near: ["Aden", "Somalia", "Djibouti"] },
      { region: "Strait of Malacca", near: ["Singapore", "Malaysia", "Indonesia"] },
      { region: "Gulf of Guinea", near: ["Nigeria", "Ghana", "Ivory Coast"] }
    ];
    
    for (const edge of path.edges) {
      if (edge.mode?.toLowerCase() === "sea") {
        for (const area of piracyAreas) {
          if (area.near.some(loc => 
            edge.from.includes(loc) || edge.to.includes(loc)
          )) {
            risks.push({
              type: "Piracy Risk",
              location: area.region,
              severity: "medium",
              icon: <ShieldAlert className="h-4 w-4 text-amber-400" />
            });
          }
        }
      }
    }
  }
  
  // Check for severe weather on the route (simulated)
  const weatherRiskAreas = [
    { region: "South China Sea", months: [6, 7, 8, 9], risk: "Typhoons" },
    { region: "Caribbean", months: [8, 9, 10], risk: "Hurricanes" },
    { region: "North Atlantic", months: [11, 12, 1, 2], risk: "Winter Storms" }
  ];
  
  const currentMonth = new Date().getMonth() + 1;
  
  for (const area of weatherRiskAreas) {
    if (area.months.includes(currentMonth) && 
        path.path?.some(loc => loc.includes(area.region))) {
      risks.push({
        type: `Severe Weather (${area.risk})`,
        location: area.region,
        severity: "medium",
        icon: <CloudLightning className="h-4 w-4 text-amber-400" />
      });
    }
  }
  
  // Add sanctions risk
  const sanctionedCountries = ["Iran", "North Korea", "Cuba", "Syria", "Venezuela"];
  if (path.path && path.path.some(loc => 
    sanctionedCountries.some(country => loc.includes(country))
  )) {
    risks.push({
      type: "Sanctions Risk",
      location: path.path.find(loc => 
        sanctionedCountries.some(country => loc.includes(country))
      ) || "Unknown",
      severity: "high",
      icon: <FileWarning className="h-4 w-4 text-red-400" />
    });
  }
  
  // If no risks, add a "No issues" item
  if (risks.length === 0) {
    risks.push({
      type: "No Issues Detected",
      location: "Full Route",
      severity: "low",
      icon: <CheckCircle className="h-4 w-4 text-green-400" />
    });
  }
  
  return risks;
}

function getAlternativePaths(route: SavedRoute) {
  // In a real app, you would generate alternative paths by re-running the routing algorithm
  // For demonstration, we'll create simulated alternatives
  if (!route.routeData || !route.routeData.paths || !route.routeData.paths[0]) {
    return [];
  }
  
  const originalPath = route.routeData.paths[0];
  
  // Create two alternative paths with slightly modified properties
  const alternativePaths = [
    {
      ...originalPath,
      path: [...(originalPath.path || [])],
      edges: [...(originalPath.edges || [])],
      time_sum: originalPath.time_sum * 1.15, // 15% longer
      price_sum: originalPath.price_sum * 0.9, // 10% cheaper
      distance_sum: originalPath.distance_sum * 1.1, // 10% longer distance
      CO2_sum: originalPath.CO2_sum * 0.95 // 5% less emissions
    },
    {
      ...originalPath,
      path: [...(originalPath.path || [])],
      edges: [...(originalPath.edges || [])],
      time_sum: originalPath.time_sum * 0.95, // 5% faster
      price_sum: originalPath.price_sum * 1.2, // 20% more expensive
      distance_sum: originalPath.distance_sum * 0.95, // 5% shorter distance
      CO2_sum: originalPath.CO2_sum * 1.1 // 10% more emissions
    }
  ];
  
  // Modify paths to simulate different routes
  if (alternativePaths[0].path && alternativePaths[0].path.length > 3) {
    // Swap a node in the middle of the path
    const middleIndex = Math.floor(alternativePaths[0].path.length / 2);
    alternativePaths[0].path[middleIndex] = alternativePaths[0].path[middleIndex] + " (Alt)";
  }
  
  if (alternativePaths[1].path && alternativePaths[1].path.length > 2) {
    // Add an extra stop
    const insertIndex = Math.floor(alternativePaths[1].path.length / 3);
    alternativePaths[1].path.splice(insertIndex, 0, "Alternative Stop");
    
    // Adjust edges if available
    if (alternativePaths[1].edges && alternativePaths[1].edges.length > 0) {
      const edgeToSplit = alternativePaths[1].edges[Math.min(insertIndex, alternativePaths[1].edges.length - 1)];
      const newEdge1 = {
        ...edgeToSplit,
        to: "Alternative Stop",
        distance: edgeToSplit.distance / 2,
        time: edgeToSplit.time / 2,
        price: edgeToSplit.price / 2
      };
      
      const newEdge2 = {
        ...edgeToSplit,
        from: "Alternative Stop",
        distance: edgeToSplit.distance / 2,
        time: edgeToSplit.time / 2,
        price: edgeToSplit.price / 2
      };
      
      alternativePaths[1].edges.splice(insertIndex, 1, newEdge1, newEdge2);
    }
  }
  
  return alternativePaths;
}

export function SavedRoutes() {
  const [routes, setRoutes] = useState<SavedRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [savingAlternative, setSavingAlternative] = useState<boolean>(false);
  const { toast } = useToast();
  const router = useRouter();

  const fetchRoutes = async () => {
    setLoading(true);
    setError(null);
    try {
      // First try to get routes from localStorage
      const localRoutes = getLocalSavedRoutes();
      
      if (localRoutes && localRoutes.length > 0) {
        setRoutes(localRoutes);
      } else {
        // If no local routes, try the API as fallback
        try {
          const apiRoutes = await import('@/services/saved-routes').then(module => module.getSavedRoutes());
          setRoutes(apiRoutes);
        } catch (apiError) {
          console.log('API routes not available, using local routes only');
          setRoutes(localRoutes); // Use empty local routes if API fails
        }
      }
    } catch (err) {
      console.error('Error fetching routes:', err);
      // Show a generic error
      setError('Unable to load saved routes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  const handleDelete = async (id: string) => {
    setIsDeleting(id);
    try {
      // Delete from localStorage
      deleteLocalSavedRoute(id);
      
      // Then try API delete as fallback (may fail silently)
      try {
        await import('@/services/saved-routes').then(module => module.deleteSavedRoute(id));
      } catch (apiError) {
        console.log('API delete not available, deleted from local storage only');
      }
      
      // Update the UI
      setRoutes(routes.filter(route => route.id !== id));
      
      toast({
        title: 'Route deleted',
        description: 'The route has been successfully deleted',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to delete the route',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const handleSaveAlternative = async (route: SavedRoute, alternativeIndex: number) => {
    setSavingAlternative(true);
    try {
      const newRoute = saveAlternativeRoute(route, alternativeIndex);
      
      // Update the routes list
      setRoutes([...routes, newRoute]);
      
      toast({
        title: 'Alternative route saved',
        description: 'The alternative route has been saved to your routes',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to save alternative route',
        variant: 'destructive',
      });
    } finally {
      setSavingAlternative(false);
    }
  };

  const handleUseRoute = (route: SavedRoute) => {
    // Create a more detailed URL with query parameters to auto-fill the form
    const avoidCountries = route.routeData.avoided_countries || [];
    const queryParams = new URLSearchParams({
      start: route.start,
      goal: route.goal,
      description: route.description || '',
      avoidCountries: avoidCountries.join(','),
      // If there's a first path with modes info, try to extract them
      modes: getTransportModes(route).join(','),
    }).toString();
    
    // Navigate to the route planner with query parameters
    router.push(`/new?${queryParams}`);
    
    // Show a toast to indicate that the route is being loaded
    toast({
      title: 'Route loaded',
      description: 'Route details have been loaded into the planner',
    });
  };

  const getTransportModeIcon = (mode: string) => {
    switch (mode.toLowerCase()) {
      case 'air':
        return <Plane className="h-3 w-3" />;
      case 'sea':
        return <Ship className="h-3 w-3" />;
      case 'land':
        return <Truck className="h-3 w-3" />;
      default:
        return null;
    }
  };

  // Helper to get unique transport modes from route data
  const getTransportModes = (route: SavedRoute) => {
    if (!route.routeData || !route.routeData.paths || !Array.isArray(route.routeData.paths)) {
      return [];
    }
    
    // Get first path for simplicity
    const firstPath = route.routeData.paths[0];
    if (!firstPath || !firstPath.edges) return [];
    
    // Extract unique modes
    const modes = new Set<string>();
    firstPath.edges.forEach(edge => {
      if (edge.mode) modes.add(edge.mode);
    });
    
    return Array.from(modes);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Get severity badge color
  const getSeverityColor = (severity: string) => {
    switch(severity) {
      case 'high':
        return 'bg-red-900/20 text-red-400 border-red-500/30';
      case 'medium':
        return 'bg-amber-900/20 text-amber-400 border-amber-500/30';
      case 'low':
        return 'bg-green-900/20 text-green-400 border-green-500/30';
      default:
        return 'bg-slate-800/50 text-slate-400 border-slate-600';
    }
  };

  // Render path metrics
  const renderPathMetrics = (path: any) => {
    if (!path) return null;
    
    return (
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex items-center gap-1 text-slate-300">
          <Clock className="h-3 w-3 text-slate-400" />
          <span>{Math.round(path.time_sum)} hrs</span>
        </div>
        <div className="flex items-center gap-1 text-slate-300">
          <DollarSign className="h-3 w-3 text-slate-400" />
          <span>${Math.round(path.price_sum)}</span>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-sky-400">Saved Routes</CardTitle>
          <CardDescription className="text-slate-400">Loading your saved routes...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 text-sky-400 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-sky-400">Saved Routes</CardTitle>
          <CardDescription className="text-slate-400">Your previously saved routes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-red-900/20 border border-red-500/30 text-red-300 p-4 rounded-lg">
            {error}
            {error.includes('sign in') && (
              <div className="mt-4">
                <Button onClick={() => router.push('/sign-in')} className="bg-red-500 hover:bg-red-600">
                  Sign In
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sky-400">Saved Routes</CardTitle>
          <CardDescription className="text-slate-400">Your previously saved routes</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={fetchRoutes} className="border-sky-500 text-sky-400">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {routes.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <Map className="h-12 w-12 mx-auto mb-4 text-slate-500" />
            <p className="mb-4">You haven't saved any routes yet.</p>
            <Button onClick={() => router.push('/new')} className="bg-sky-600 hover:bg-sky-700">
              Create a New Route
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {Array.isArray(routes) && routes.map((route) => {
              const routeData = route.routeData;
              const firstPath = Array.isArray(routeData.paths) ? routeData.paths[0] : null;
              const modes = getTransportModes(route);
              const routeRisks = getRouteRisks(route);
              const alternativePaths = getAlternativePaths(route);
              
              return (
                <Card key={route.id} className="bg-slate-900 border-slate-700 overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-white text-lg">{route.name}</CardTitle>
                      <div className="flex space-x-1">
                        {modes.map(mode => (
                          <Badge key={mode} variant="outline" className="bg-slate-800 text-xs flex items-center gap-1">
                            {getTransportModeIcon(mode)}
                            {mode}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <CardDescription className="text-slate-400">
                      {route.description || `Route from ${route.start} to ${route.goal}`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="grid grid-cols-1 gap-2">
                      <div className="flex items-center gap-1 text-slate-300">
                        <Navigation className="h-3 w-3 text-slate-400" />
                        <span>
                          {route.start} → {route.goal}
                        </span>
                      </div>
                      {firstPath && renderPathMetrics(firstPath)}
                    </div>
                    
                    <Tabs defaultValue="status" className="mt-3">
                      <TabsList className="bg-slate-800 grid w-full grid-cols-2">
                        <TabsTrigger value="status" className="text-xs">Route Status</TabsTrigger>
                        <TabsTrigger value="alternatives" className="text-xs">Alternatives</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="status" className="pt-2">
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-slate-400">Current Route Status:</p>
                          {routeRisks.map((risk, index) => (
                            <div 
                              key={index} 
                              className={`flex items-center justify-between p-2 rounded-md text-xs ${getSeverityColor(risk.severity)}`}
                            >
                              <div className="flex items-center gap-1.5">
                                {risk.icon}
                                <span>{risk.type}</span>
                              </div>
                              <Badge variant="outline" className="text-[10px] h-5 bg-black/10">
                                {risk.location}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="alternatives" className="pt-2">
                        <div className="space-y-3">
                          <p className="text-xs font-medium text-slate-400">Alternative Routes:</p>
                          
                          {alternativePaths.map((path, index) => (
                            <div 
                              key={index}
                              className="p-2 rounded-md border border-slate-700 bg-slate-800/50"
                            >
                              <div className="flex items-start gap-1.5 mb-1.5 text-slate-300">
                                <CornerDownRight className="h-3 w-3 text-slate-400 mt-0.5" />
                                <span className="text-xs font-medium">Alternative {index + 1}</span>
                              </div>
                              
                              {renderPathMetrics(path)}
                              
                              <div className="flex justify-end mt-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-sky-400 border-sky-500/50 h-7 text-[11px]"
                                  onClick={() => handleSaveAlternative(route, index)}
                                  disabled={savingAlternative}
                                >
                                  <Save className="h-3 w-3 mr-1" />
                                  Save Alternative
                                </Button>
                              </div>
                            </div>
                          ))}
                          
                          {alternativePaths.length === 0 && (
                            <div className="text-xs text-slate-400 text-center py-2">
                              No alternative routes available
                            </div>
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
                    
                    <div className="text-xs text-slate-500 mt-3">
                      Saved on {formatDate(route.createdAt)}
                    </div>
                  </CardContent>
                  <CardFooter className="pt-2 flex justify-between">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleUseRoute(route)}
                      className="text-sky-400 border-sky-500/50"
                    >
                      Use This Route
                    </Button>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-red-400 border-red-500/50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-slate-900 border-slate-700 text-white">
                        <DialogHeader>
                          <DialogTitle className="text-red-400">Delete Route</DialogTitle>
                          <DialogDescription className="text-slate-400">
                            Are you sure you want to delete this saved route? This action cannot be undone.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button
                            variant="ghost"
                            className="text-slate-400"
                            onClick={() => {}}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => handleDelete(route.id)}
                            disabled={isDeleting === route.id}
                          >
                            {isDeleting === route.id ? 'Deleting...' : 'Delete Route'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 