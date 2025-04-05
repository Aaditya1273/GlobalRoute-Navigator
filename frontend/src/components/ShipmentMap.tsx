"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Package, Truck, Search, Loader2, Ship, Plane, AlertTriangle, Clock, DollarSign, Calendar, ArrowRight, Info } from 'lucide-react'
import * as maptilersdk from "@maptiler/sdk"
import "@maptiler/sdk/dist/maptiler-sdk.css"
// import { format } from "date-fns"

// Define interfaces
interface Step {
  id: string;
  title: string;
  location: string;
  coordinates: [number, number];
  time: string;
  description: string;
  terrainType: "land" | "water" | "air";
}

interface RoutePoint {
  coordinates: [number, number];
  terrainType: "land" | "water" | "air";
}

interface Segment {
  id: string;
  from_location: string;
  to_location: string;
  mode: string;
  start_time: string;
  end_time: string;
  cost: number;
  time: number;
  border_crossings?: string[];
}

interface Route {
  id: string;
  total_cost: number;
  total_time: number;
  risk_score: number;
  emission: number;
  mode_sequence: string;
  segments: Segment[];
}

interface Shipment {
  id: string;
  origin: string;
  destination: string;
  cargo_weight: number;
  cargo_volume: number;
  priority: string;
  status: string;
  createdAt: string;
  routes: Route[];
}

interface TransformedShipment {
  id: string;
  origin: string;
  originCoords: [number, number];
  destination: string;
  destinationCoords: [number, number];
  status: string;
  priority: string;
  cargo_weight: number;
  cargo_volume: number;
  createdAt: string;
  route: Route;
  steps: Step[];
}

interface RiskEvent {
  type: string;
  location: string;
  severity: number;
  active: boolean;
}

const ShipmentTracker = () => {
  const [isTracking, setIsTracking] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [shipmentId, setShipmentId] = useState("shp-001")
  const [progress, setProgress] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [vehicleMarker, setVehicleMarker] = useState<maptilersdk.Marker | null>(null)
  const [currentTerrainType, setCurrentTerrainType] = useState<"land" | "water" | "air">("land")
  const [shipment, setShipment] = useState<TransformedShipment | null>(null)
  const [activeTab, setActiveTab] = useState("tracking")
  const [riskEvents, setRiskEvents] = useState<RiskEvent[]>([])
  const mapContainer = useRef(null)
  const map = useRef<maptilersdk.Map | null>(null)
  const animationFrame = useRef<number | null>(null)
  const originMarker = useRef<maptilersdk.Marker | null>(null)
  const destinationMarker = useRef<maptilersdk.Marker | null>(null)

  useEffect(() => {
    if (map.current || !mapContainer.current) return

    const apiKey = process.env.NEXT_PUBLIC_MAPTILER_API_KEY || "YOUR_MAPTILER_API_KEY";
    maptilersdk.config.apiKey = apiKey;
    
    map.current = new maptilersdk.Map({
      container: mapContainer.current,
      style: maptilersdk.MapStyle.STREETS,
      center: [0, 30], // Default center
      zoom: 2,
    })

    // Add map controls
    map.current.addControl(new maptilersdk.NavigationControl(), 'top-right');
    map.current.addControl(new maptilersdk.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      trackUserLocation: true
    }));

    return () => {
      if (map.current) {
        // Clean up any layers and sources
        if (map.current.getLayer("route")) {
          map.current.removeLayer("route")
          map.current.removeSource("route")
        }

        if (map.current.getLayer("stops")) {
          map.current.removeLayer("stops")
          map.current.removeSource("stops")
        }

        if (vehicleMarker) {
          vehicleMarker.remove()
        }

        if (originMarker.current) {
          originMarker.current.remove()
        }

        if (destinationMarker.current) {
          destinationMarker.current.remove()
        }

        map.current.remove()
        map.current = null
      }

      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current)
      }
    }
  }, [])

  // Add this cleanup effect for component unmount
  useEffect(() => {
    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current)
      }
      if (vehicleMarker) {
        vehicleMarker.remove()
      }
    }
  }, [vehicleMarker])
  interface GeocodingResponse {
    features: {
      geometry: {
        coordinates: [number, number];
      };
    }[];
  }

  const getCoordinatesForLocation = async (location: string): Promise<[number, number]> => {
    try {
      // Use a geocoding service to get coordinates for a location
      const response = await fetch(
        `https://api.maptiler.com/geocoding/${encodeURIComponent(location)}.json?key=${process.env.NEXT_PUBLIC_MAPTILER_API_KEY}`
      );
      const data: GeocodingResponse = await response.json();
      
      if (data.features && data.features.length > 0) {
        return data.features[0].geometry.coordinates;
      }
      
      // Fallback coordinates if geocoding fails
      console.warn(`Geocoding failed for ${location}, using fallback coordinates`);
      return [
        parseFloat((Math.random() * 360 - 180).toFixed(6)),
        parseFloat((Math.random() * 170 - 85).toFixed(6))
      ];
    } catch (error) {
      console.error("Error geocoding location:", error);
      // Return fallback coordinates
      return [
        parseFloat((Math.random() * 360 - 180).toFixed(6)),
        parseFloat((Math.random() * 170 - 85).toFixed(6))
      ];
    }
  };

  const transformShipmentData = async (shipment: Shipment): Promise<TransformedShipment> => {
    // Get the primary route (first one)
    const primaryRoute = shipment.routes[0];
    
    // Transform segments to steps
    const steps = await Promise.all(
      primaryRoute.segments.map(async (segment): Promise<Step> => {
        // Convert mode to terrainType
        let terrainType: "land" | "water" | "air";
        if (segment.mode === "SEA") {
          terrainType = "water";
        } else if (segment.mode === "AIR") {
          terrainType = "air";
        } else {
          terrainType = "land";
        }
        
        return {
          id: segment.id,
          title: `${segment.mode === "SEA" ? "Sea" : segment.mode === "AIR" ? "Air" : "Land"} Transport`,
          location: `${segment.from_location} to ${segment.to_location}`,
          coordinates: await getCoordinatesForLocation(segment.from_location),
          time: segment.start_time,
          description: `Mode: ${segment.mode}, Cost: $${segment.cost.toLocaleString()}, Duration: ${segment.time} hours`,
          terrainType,
        };
      })
    );
    
    // Add destination as final step
    const destinationCoords = await getCoordinatesForLocation(shipment.destination);
    steps.push({
      id: "destination",
      title: "Destination",
      location: shipment.destination,
      coordinates: destinationCoords,
      time: primaryRoute.segments[primaryRoute.segments.length - 1].end_time,
      description: "Final destination",
      terrainType: "land", // Default for destination
    });
  
    return {
      id: shipment.id,
      origin: shipment.origin,
      originCoords: await getCoordinatesForLocation(shipment.origin),
      destination: shipment.destination,
      destinationCoords,
      status: shipment.status,
      priority: shipment.priority,
      cargo_weight: shipment.cargo_weight,
      cargo_volume: shipment.cargo_volume,
      createdAt: shipment.createdAt,
      route: primaryRoute,
      steps,
    };
  };

  const createMarker = (coordinates: [number, number], type: "origin" | "destination" | "vehicle", terrainType?: "land" | "water" | "air"): maptilersdk.Marker | null => {
    if (!map.current) return null;

    const el = document.createElement("div");
    el.className = `${type}-marker`;

    let iconSvg = "";
    let bgColor = "";
    
    if (type === "origin") {
      iconSvg = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="10" r="3"></circle>
          <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z"></path>
        </svg>`;
      bgColor = "bg-green-600";
    } else if (type === "destination") {
      iconSvg = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="10" r="3"></circle>
          <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z"></path>
        </svg>`;
      bgColor = "bg-red-600";
    } else if (type === "vehicle" && terrainType) {
      if (terrainType === "water") {
        iconSvg = `
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 12H2"></path>
            <path d="M5 12v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"></path>
            <path d="M9 12v-3"></path>
            <path d="M15 12v-3"></path>
            <path d="M2 12l2 7h16l2-7"></path>
            <path d="M4 12v7"></path>
            <path d="M20 12v7"></path>
          </svg>`;
        bgColor = "bg-blue-600";
      } else if (terrainType === "air") {
        iconSvg = `
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"></path>
          </svg>`;
        bgColor = "bg-purple-600";
      } else {
        iconSvg = `
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 18v-7.7M9 18v-7.7M14 18v-7.7M18 18v-7.7M2 9h19.4a.6.6 0 0 0 .6-.6V6.6a.6.6 0 0 0-.6-.6H2"></path>
            <path d="M4 21h15a2 2 0 0 0 2-2v-5"></path>
            <path d="M10 21v-4"></path>
          </svg>`;
        bgColor = "bg-amber-600";
      }
    }

    el.innerHTML = `
      <div class="p-2 ${bgColor} rounded-full shadow-lg transform-gpu transition-transform duration-300 hover:scale-110 relative">
        ${iconSvg}
        ${type === "vehicle" ? '<div class="absolute -bottom-1 -right-1 w-3 h-3 bg-white rounded-full border-2 border-gray-800 animate-pulse"></div>' : ''}
      </div>
    `;

    const marker = new maptilersdk.Marker({
      element: el,
      anchor: "center",
    }).setLngLat(coordinates);

    // Add popup for origin and destination
    if (type === "origin" || type === "destination") {
      const popup = new maptilersdk.Popup({
        offset: 25,
        closeButton: false,
        className: "custom-popup"
      }).setHTML(`
        <div class="font-medium">${type === "origin" ? "Origin" : "Destination"}</div>
        <div class="text-sm text-gray-600">${type === "origin" ? shipment?.origin : shipment?.destination}</div>
      `);
      
      marker.setPopup(popup);
      
      // Show popup on hover
      el.addEventListener("mouseenter", () => {
        marker.togglePopup();
      });
      
      el.addEventListener("mouseleave", () => {
        marker.togglePopup();
      });
    }

    return marker;
  };

  const drawRoute = (shipment: TransformedShipment): void => {
    if (!map.current) return;
  
    // Remove existing route if any
    if (map.current.getLayer("route")) {
      map.current.removeLayer("route");
      map.current.removeSource("route");
    }
  
    // Create a GeoJSON source with the route coordinates
    const routeCoordinates: [number, number][] = shipment.steps.map((step) => step.coordinates);
  
    // Create a GeoJSON LineString for the route
    map.current.addSource("route", {
      type: "geojson",
      data: {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: routeCoordinates,
        },
      },
    });
  
    // Add a layer to display the route with a gradient based on terrain type
    map.current.addLayer({
      id: "route",
      type: "line",
      source: "route",
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
      paint: {
        "line-color": [
          "match",
          ["get", "terrainType"],
          "water", "#1E88E5",
          "air", "#9C27B0",
          "#FF9800" // default for land
        ],
        "line-width": 4,
        "line-dasharray": [0, 4, 3],
        "line-opacity": 0.8,
      },
    });
  
    // Add intermediate stop markers
    addStopMarkers(shipment);
    
    // Add origin and destination markers
    if (originMarker.current) {
      originMarker.current.remove();
    }
    originMarker.current = createMarker(shipment.originCoords, "origin");
    if (originMarker.current) {
      originMarker.current.addTo(map.current);
    }
    
    if (destinationMarker.current) {
      destinationMarker.current.remove();
    }
    destinationMarker.current = createMarker(shipment.destinationCoords, "destination");
    if (destinationMarker.current) {
      destinationMarker.current.addTo(map.current);
    }
    
    // Fit the map to show the entire route
    const bounds = new maptilersdk.LngLatBounds();
    routeCoordinates.forEach(coord => bounds.extend(coord));
    map.current.fitBounds(bounds, { padding: 100, maxZoom: 10, duration: 2000 });
  };

  const addStopMarkers = (shipment: TransformedShipment) => {
    if (!map.current) return;
  
    // Remove existing markers if any
    if (map.current.getLayer("stops")) {
      map.current.removeLayer("stops");
      map.current.removeSource("stops");
    }
  
    // Create a GeoJSON source with stop points (excluding origin and destination)
    const intermediateSteps = shipment.steps.slice(1, -1);
    
    if (intermediateSteps.length > 0) {
      map.current.addSource("stops", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: intermediateSteps.map((step) => ({
            type: "Feature",
            properties: {
              title: step.title,
              description: step.description,
              location: step.location,
              time: step.time,
              terrainType: step.terrainType,
            },
            geometry: {
              type: "Point",
              coordinates: step.coordinates,
            },
          })),
        },
      });
    
      // Add a layer for the stops
      map.current.addLayer({
        id: "stops",
        type: "circle",
        source: "stops",
        paint: {
          "circle-radius": 6,
          "circle-color": [
            "match",
            ["get", "terrainType"],
            "water", "#1E88E5",
            "air", "#9C27B0",
            "#FF9800" // default for land
          ],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      });
      
      // Add popups for intermediate stops
      map.current.on('click', 'stops', (e) => {
        if (!e.features || e.features.length === 0) return;
        
        if (e.features[0].geometry.type === "Point") {
          const coordinates = (e.features[0].geometry as GeoJSON.Point).coordinates.slice() as [number, number];
        const properties = e.features[0].properties;
        
        const popupContent = `
          <div class="font-medium">${properties.title}</div>
          <div class="text-sm text-gray-600">${properties.location}</div>
          <div class="text-xs text-gray-500">${new Date(properties.time).toLocaleString()}</div>
          <div class="text-xs mt-1">${properties.description}</div>
        `;
        
        new maptilersdk.Popup()
          .setLngLat(coordinates)
          .setHTML(popupContent)
          .addTo(map.current!);
        }
      });
      
      // Change cursor on hover
      map.current.on('mouseenter', 'stops', () => {
        if (map.current) map.current.getCanvas().style.cursor = 'pointer';
      });
      
      map.current.on('mouseleave', 'stops', () => {
        if (map.current) map.current.getCanvas().style.cursor = '';
      });
    }
  };

  const generateRoutePoints = (steps: Step[]): RoutePoint[] => {
    const points: RoutePoint[] = [];

    for (let i = 0; i < steps.length - 1; i++) {
      const start = steps[i];
      const end = steps[i + 1];
      const pointCount = 100; // More points for smoother animation

      for (let j = 0; j <= pointCount; j++) {
        const fraction = j / pointCount;
        
        // Use a slight arc for better visualization
        const lat = start.coordinates[1] + (end.coordinates[1] - start.coordinates[1]) * fraction;
        const lng = start.coordinates[0] + (end.coordinates[0] - start.coordinates[0]) * fraction;
        
        // Determine terrain type for this intermediate point
        let terrainType: "land" | "water" | "air";
        
        // If we're going from land to water or water to land, determine where to transition
        if (start.terrainType !== end.terrainType) {
          // Simple approach: transition halfway between the points
          terrainType = j < pointCount / 2 ? start.terrainType : end.terrainType;
        } else {
          terrainType = start.terrainType;
        }
        
        points.push({
          coordinates: [lng, lat],
          terrainType,
        });
      }
    }

    return points;
  };

  const updateVehiclePosition = (coordinates: [number, number], terrainType: "land" | "water" | "air") => {
    if (!map.current) return;

    // If terrain type has changed or vehicle marker doesn't exist, create a new one
    if (terrainType !== currentTerrainType || !vehicleMarker) {
      // Remove existing marker if there is one
      if (vehicleMarker) {
        vehicleMarker.remove();
      }
      
      // Create new marker with appropriate vehicle icon
      const newMarker = createMarker(coordinates, "vehicle", terrainType);
      if (newMarker) {
        newMarker.addTo(map.current);
        setVehicleMarker(newMarker);
      }
      
      // Update current terrain type
      setCurrentTerrainType(terrainType);
    } else {
      // Just update position if terrain type hasn't changed
      vehicleMarker.setLngLat(coordinates);
    }
  };

  const animateShipment = (shipment: TransformedShipment) => {
    const routePoints = generateRoutePoints(shipment.steps);
    let currentPoint = 0;

    // Draw the complete route first
    drawRoute(shipment);

    const animate = () => {
      if (currentPoint >= routePoints.length) {
        // When animation completes, keep marker at destination
        if (animationFrame.current) {
          cancelAnimationFrame(animationFrame.current);
        }
        // Optional: Add final destination marker
        const finalStep = shipment.steps[shipment.steps.length - 1];
        updateVehiclePosition(finalStep.coordinates, finalStep.terrainType);
        return;
      }

      const point = routePoints[currentPoint];
      const progress = (currentPoint / routePoints.length) * 100;

      // Update vehicle icon and position based on terrain
      updateVehiclePosition(point.coordinates, point.terrainType);

      // Follow the vehicle with the map camera
      if (map.current && currentPoint % 20 === 0) {
        map.current.easeTo({
          center: point.coordinates,
          duration: 1000,
          zoom: 5,
        });
      }

      setProgress(progress);

      // Calculate current step based on progress
      const stepIndex = Math.floor((currentPoint / routePoints.length) * (shipment.steps.length - 1));
      if (stepIndex !== currentStep) {
        setCurrentStep(stepIndex);
      }

      currentPoint++;

      // Adjust speed based on terrain type
      const speed = point.terrainType === "air" ? 50 : point.terrainType === "water" ? 100 : 80;

      setTimeout(() => {
        animationFrame.current = requestAnimationFrame(animate);
      }, speed);
    };

    animate();
  };

  const handleTrackShipment = async () => {
    setIsLoading(true);
    try {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
        animationFrame.current = null;
      }
      
      if (vehicleMarker) {
        vehicleMarker.remove();
        setVehicleMarker(null);
      }
      // Fetch shipment data from the backend
      const response = await fetch(`/api/shipments/${shipmentId}`);
  
      // Check if the response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Invalid response from server');
      }
  
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch shipment data');
      }
  
      // Transform the backend data into the frontend format
      const transformedShipment = await transformShipmentData(data);
      setShipment(transformedShipment);
  
      // Update state with the transformed shipment data
      setIsTracking(true);
      setCurrentStep(0);
      setProgress(0);
  
      // Reset current terrain type
      setCurrentTerrainType("land");
  
      // Clear any existing route
      if (map.current && map.current.getLayer("route")) {
        map.current.removeLayer("route");
        map.current.removeSource("route");
      }
  
      if (map.current && map.current.getLayer("stops")) {
        map.current.removeLayer("stops");
        map.current.removeSource("stops");
      }
  
      // Fetch risk events
      const riskResponse = await fetch('/api/risk-events');
      if (riskResponse.ok) {
        const riskData = await riskResponse.json();
        setRiskEvents(riskData.map((risk: { type: string; location: string; severity: number; end_time: string | null }) => ({
          type: risk.type,
          location: risk.location,
          severity: risk.severity,
          active: risk.end_time === null
        })));
      }
  
      // Start the animation with the transformed shipment data
      setTimeout(() => animateShipment(transformedShipment), 1000);
    } catch (error) {
      console.error(error);
      alert('Failed to track shipment. Please check the tracking number and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'DELIVERED':
        return 'bg-green-500';
      case 'IN_TRANSIT':
        return 'bg-blue-500';
      case 'PENDING':
        return 'bg-amber-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return dateString;
    }
  };

  const getTerrainIcon = (terrainType: "land" | "water" | "air") => {
    switch (terrainType) {
      case "water":
        return <Ship className="h-5 w-5" />;
      case "air":
        return <Plane className="h-5 w-5" />;
      default:
        return <Truck className="h-5 w-5" />;
    }
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <Card className="p-6 lg:col-span-1">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" />
            Shipment Tracker
          </CardTitle>
          <CardDescription>
            Enter your tracking number to get real-time updates
          </CardDescription>
        </CardHeader>
        
        <CardContent className="px-0 pb-0">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleTrackShipment()
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="shipmentId" className="text-base font-medium">
                Tracking Number
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="shipmentId"
                  value={shipmentId}
                  onChange={(e) => setShipmentId(e.target.value)}
                  placeholder="e.g. shp-001"
                  className="pl-10"
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Package className="mr-2 h-5 w-5" />}
              {isLoading ? "Tracking..." : "Track Shipment"}
            </Button>
          </form>

          {isTracking && shipment && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.5 }}
              className="mt-6 space-y-6"
            >
              <div className="bg-blue-50 dark:bg-blue-950 p-6 rounded-xl">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Package className="mr-2" />
                  Shipment Status
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(shipment.status)}`}></div>
                      <span className="font-medium">{shipment.status.replace('_', ' ')}</span>
                    </div>
                    <Badge variant="outline" className="capitalize">{shipment.priority.toLowerCase()}</Badge>
                  </div>
                  
                  <Progress value={progress} className="h-2" />
                  
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Origin</p>
                      <p className="font-medium">{shipment.origin}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Destination</p>
                      <p className="font-medium">{shipment.destination}</p>
                    </div>
                  </div>
                </div>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="tracking">Tracking</TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                </TabsList>
                <TabsContent value="tracking" className="space-y-4 pt-4">
                  <div className="relative pl-6 border-l-2 border-gray-200 dark:border-gray-800 space-y-6">
                    {shipment.steps.map((step, index) => (
                      <motion.div
                        key={step.id}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className={`relative ${index === currentStep ? "opacity-100" : "opacity-70"}`}
                      >
                        <div className={`absolute -left-[25px] p-1.5 rounded-full ${
                          index < currentStep
                            ? "bg-green-500 text-white"
                            : index === currentStep
                            ? "bg-blue-500 text-white"
                            : "bg-gray-200 dark:bg-gray-700"
                        }`}>
                          {getTerrainIcon(step.terrainType)}
                        </div>
                        <div className="mb-1 flex items-center justify-between">
                          <h4 className="font-medium text-base">{step.title}</h4>
                          <Badge variant={index <= currentStep ? "default" : "outline"}>
                            {index < currentStep ? "Completed" : index === currentStep ? "Current" : "Pending"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{step.location}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(step.time)}</p>
                        <p className="text-sm mt-1">{step.description}</p>
                      </motion.div>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="details" className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-4 w-4" /> Created
                      </p>
                      <p className="font-medium">{formatDate(shipment.createdAt)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-4 w-4" /> Total Time
                      </p>
                      <p className="font-medium">{shipment.route.total_time} hours</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <DollarSign className="h-4 w-4" /> Total Cost
                      </p>
                      <p className="font-medium">${shipment.route.total_cost.toLocaleString()}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4" /> Risk Score
                      </p>
                      <p className="font-medium">{(shipment.route.risk_score * 100).toFixed(0)}%</p>
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <h4 className="font-medium mb-2">Cargo Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Weight</p>
                        <p className="font-medium">{shipment.cargo_weight.toLocaleString()} kg</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Volume</p>
                        <p className="font-medium">{shipment.cargo_volume.toLocaleString()} m³</p>
                      </div>
                    </div>
                  </div>
                  
                  {riskEvents.length > 0 && (
                    <div className="pt-2">
                      <h4 className="font-medium mb-2 flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        Risk Events
                      </h4>
                      <div className="space-y-2">
                        {riskEvents.slice(0, 3).map((risk, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-amber-50 dark:bg-amber-950 rounded-md">
                            <div>
                              <p className="font-medium">{risk.type}</p>
                              <p className="text-sm text-muted-foreground">{risk.location}</p>
                            </div>
                            <Badge variant={risk.active ? "destructive" : "outline"}>
                              {risk.active ? "Active" : "Resolved"}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </CardContent>
      </Card>

      <Card className="p-0 overflow-hidden h-[700px] relative lg:col-span-2">
        <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />
        {!isTracking && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80 dark:bg-gray-900/80">
            <div className="text-center p-6 max-w-md">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Package className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Track Your Shipment</h3>
              <p className="text-muted-foreground mb-6">Enter your tracking number to see real-time location, status updates, and estimated delivery time.</p>
              <div className="flex items-center justify-center space-x-4">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mb-2">
                    <Truck className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-sm">Land</span>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-2">
                    <Ship className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-sm">Sea</span>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mb-2">
                    <Plane className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="text-sm">Air</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {isTracking && (
          <div className="absolute bottom-4 right-4 bg-white dark:bg-gray-900 p-3 rounded-lg shadow-lg">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Current Transport:</span>
              <div className={`p-1 rounded-full ${
                currentTerrainType === "water" 
                  ? "bg-blue-100 dark:bg-blue-900" 
                  : currentTerrainType === "air" 
                  ? "bg-purple-100 dark:bg-purple-900" 
                  : "bg-amber-100 dark:bg-amber-900"
              }`}>
                {getTerrainIcon(currentTerrainType)}
              </div>
              <span className="text-sm capitalize">{currentTerrainType}</span>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

export default ShipmentTracker
