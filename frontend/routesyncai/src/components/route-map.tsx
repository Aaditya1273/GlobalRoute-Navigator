"use client"

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { RoutePath } from '@/lib/types'

interface RouteMapProps {
  route: RoutePath
}

export function RouteMap({ route }: RouteMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const [is3DView, setIs3DView] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [coordinates, setCoordinates] = useState<[number, number][]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [markers, setMarkers] = useState<maplibregl.Marker[]>([])

  // Geocode nodes using OpenStreetMap Nominatim API
  const geocodeNode = async (nodeName: string): Promise<[number, number] | null> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(nodeName)}`
      )
      const data = await response.json()
      if (data.length > 0) {
        const { lat, lon } = data[0]
        return [parseFloat(lon), parseFloat(lat)] // Nominatim returns [lat, lon], but MapLibre expects [lon, lat]
      }
      console.warn(`No results found for node: ${nodeName}`)
      return null
    } catch (error) {
      console.error(`Geocoding failed for node: ${nodeName}`, error)
      return null
    }
  }

  // Fetch coordinates for all nodes in the route
  const fetchCoordinates = async () => {
    if (!route || !route.path || !Array.isArray(route.path)) {
      console.error("Invalid route data:", route);
      setIsLoading(false);
      return;
    }

    const coords: [number, number][] = [];
    
    // First, check if the route includes coordinates directly
    if (route.coordinates && Array.isArray(route.coordinates)) {
      for (const point of route.coordinates) {
        if (point && typeof point === 'object' && 'latitude' in point && 'longitude' in point) {
          coords.push([parseFloat(point.longitude.toString()), parseFloat(point.latitude.toString())]);
        }
      }
      
      if (coords.length > 0) {
        console.log("Using provided coordinates:", coords);
        setCoordinates(coords);
        setIsLoading(false);
        return;
      }
    }

    // Fallback to geocoding if no coordinates provided
    try {
      for (const node of route.path) {
        // Check local storage for cached coordinates
        const cachedCoords = localStorage.getItem(node);
        if (cachedCoords) {
          try {
            const parsed = JSON.parse(cachedCoords);
            if (Array.isArray(parsed) && parsed.length === 2) {
              coords.push(parsed);
              continue;
            }
          } catch (e) {
            console.warn("Failed to parse cached coordinates", e);
          }
        }

        // If not cached or invalid, geocode
        try {
          const coord = await geocodeNode(node);
          if (coord) {
            coords.push(coord);
            // Cache the coordinates in local storage
            localStorage.setItem(node, JSON.stringify(coord));
          }
        } catch (e) {
          console.error(`Error geocoding ${node}:`, e);
        }
      }
    } catch (e) {
      console.error("Error in fetchCoordinates:", e);
    }

    console.log("Final coordinates:", coords);
    setCoordinates(coords);
    setIsLoading(false);
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://api.maptiler.com/maps/streets/style.json?key=KjP8QVbU8JTtyyew1cAd",
      center: [0, 0],
      zoom: 1,
      attributionControl: false,
      interactive: true,
      pitch: 0,
      bearing: 0
    })

    map.current.addControl(new maplibregl.NavigationControl(), 'top-left')

    return () => {
      map.current?.remove()
    }
  }, [])

  // Cleanup function to remove markers
  const cleanupMarkers = () => {
    markers.forEach(marker => marker.remove());
    setMarkers([]);
  };

  // Fetch coordinates and draw route when the route changes
  useEffect(() => {
    if (!route.path) return

    cleanupMarkers();
    setIsLoading(true);
    fetchCoordinates();
  }, [route]); // Add route as a dependency

  // Draw route on map when coordinates change
  useEffect(() => {
    if (coordinates.length > 0 && map.current) {
      drawRouteOnMap();
    }
  }, [coordinates]);

  // Draw the route on the map
  const drawRouteOnMap = () => {
    if (!map.current || coordinates.length === 0) return;

    // Clean up existing markers
    cleanupMarkers();

    // Remove existing route source and layer if they exist
    if (map.current.getSource('route')) {
      map.current.removeLayer('route-line'); // Remove the layer first
      map.current.removeSource('route'); // Then remove the source
    }

    // Wait for the map style to be fully loaded
    if (!map.current.isStyleLoaded()) {
      map.current.once('style.load', () => {
        addRouteToMap();
      });
    } else {
      addRouteToMap();
    }
  };

  const addRouteToMap = () => {
    if (!map.current) return;
    
    // Add a source and layer for the route line
    map.current.addSource('route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: coordinates
        }
      }
    });

    map.current.addLayer({
      id: 'route-line',
      type: 'line',
      source: 'route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#3b82f6',
        'line-width': 4,
        'line-opacity': 0.8
      }
    });

    // Add markers for start and end points
    const newMarkers: maplibregl.Marker[] = [];

    if (coordinates.length > 0) {
      // Start marker
      const startMarker = new maplibregl.Marker({ color: '#10b981' })
        .setLngLat(coordinates[0])
        .addTo(map.current);
      newMarkers.push(startMarker);

      // End marker
      const endMarker = new maplibregl.Marker({ color: '#ef4444' })
        .setLngLat(coordinates[coordinates.length - 1])
        .addTo(map.current);
      newMarkers.push(endMarker);
    }

    // Add intermediate point markers
    if (route.edges && Array.isArray(route.edges)) {
      route.edges.forEach((edge, index) => {
        if (index > 0 && index < coordinates.length - 1) {
          const mode = edge.mode;
          
          // Create a custom marker element
          const el = document.createElement('div');
          el.className = 'marker';
          el.style.width = '24px';
          el.style.height = '24px';
          el.style.backgroundSize = 'cover';
          
          // Set icon based on mode
          let iconUrl = '';
          switch (mode) {
            case 'sea':
              iconUrl = '/icons/ship.png';
              break;
            case 'air':
              iconUrl = '/icons/plane.png';
              break;
            default:
              iconUrl = '/icons/truck.png';
          }
          
          el.style.backgroundImage = `url(${iconUrl})`;
          
          const marker = new maplibregl.Marker(el)
            .setLngLat(coordinates[index])
            .addTo(map.current);
          
          newMarkers.push(marker);
        }
      });
    }
    
    setMarkers(newMarkers);

    // Fit map to the route
    if (coordinates.length > 0) {
      const bounds = coordinates.reduce(
        (bounds, coord) => bounds.extend(coord as maplibregl.LngLatLike),
        new maplibregl.LngLatBounds(coordinates[0], coordinates[0])
      );
      
      map.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 10,
        duration: 1000
      });
    }
  };

  return (
    <div className="relative w-full h-[400px] rounded-lg overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading map...</p>
          </div>
        </div>
      )}
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  )
}