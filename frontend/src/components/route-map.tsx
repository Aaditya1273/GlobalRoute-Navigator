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
    const pathLen = route.path.length;
    let foundCoords = 0;
    
    // First, check if the route includes coordinates directly
    if (route.coordinates && Array.isArray(route.coordinates)) {
      for (const point of route.coordinates) {
        if (point && typeof point === 'object' && 'latitude' in point && 'longitude' in point) {
          const lon = typeof point.longitude === 'string' ? parseFloat(point.longitude) : point.longitude;
          const lat = typeof point.latitude === 'string' ? parseFloat(point.latitude) : point.latitude;
          coords.push([lon, lat]);
          foundCoords++;
        }
      }
      
      if (foundCoords > 0 && foundCoords === pathLen) {
        console.log(`Successfully loaded all ${foundCoords} coordinates from route data`);
        setCoordinates(coords);
        setIsLoading(false);
        return;
      } else if (foundCoords > 0) {
        console.warn(`Loaded only ${foundCoords}/${pathLen} coordinates from route data, will try to geocode missing ones`);
      }
    }

    // Check if we need to geocode any remaining nodes
    for (let i = 0; i < pathLen; i++) {
      if (coords.length <= i) {
        const node = route.path[i];
        
        // Try to find the coordinate from existing edges
        let edgeCoord: [number, number] | null = null;
        
        // Check if this node appears in edges
        const edgeWithFromNode = route.edges.find(edge => edge.from === node);
        const edgeWithToNode = route.edges.find(edge => edge.to === node);
        
        if (edgeWithFromNode || edgeWithToNode) {
          // Try to find matching coordinates in what we've already geocoded
          // by looking at path indices for nodes mentioned in the edges
          const fromNodeIdx = route.path.findIndex(n => n === (edgeWithFromNode?.from || ''));
          const toNodeIdx = route.path.findIndex(n => n === (edgeWithToNode?.to || ''));
          
          if (fromNodeIdx !== -1 && fromNodeIdx < coords.length) {
            edgeCoord = coords[fromNodeIdx];
          } else if (toNodeIdx !== -1 && toNodeIdx < coords.length) {
            edgeCoord = coords[toNodeIdx];
          }
        }
        
        if (edgeCoord) {
          // Slightly modify the coordinate to make the marker visible
          coords.push([
            edgeCoord[0] + (Math.random() * 0.02) - 0.01, 
            edgeCoord[1] + (Math.random() * 0.02) - 0.01
          ]);
          continue;
        }
        
        // Check local storage for cached coordinates
        const cachedCoords = localStorage.getItem(node);
        if (cachedCoords) {
          try {
            const parsed = JSON.parse(cachedCoords);
            if (Array.isArray(parsed) && parsed.length === 2 && 
                typeof parsed[0] === 'number' && typeof parsed[1] === 'number') {
              coords.push([parsed[0], parsed[1]]);
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
            continue;
          }
        } catch (e) {
          console.error(`Error geocoding ${node}:`, e);
        }
        
        // If we get here, we couldn't find coordinates - use a placeholder
        console.warn(`Could not determine coordinates for ${node} - using placeholder`);
        // Generate a placeholder based on previous coordinate if available
        if (i > 0 && coords.length > 0) {
          const prevCoord = coords[coords.length - 1];
          // Add a small offset to make the route visible
          coords.push([
            prevCoord[0] + (Math.random() * 0.1) - 0.05, 
            prevCoord[1] + (Math.random() * 0.1) - 0.05
          ]);
        } else {
          // Default to a random location if we have no previous point
          coords.push([
            (Math.random() * 360) - 180,
            (Math.random() * 170) - 85
          ]);
        }
      }
    }

    console.log(`Finished coordinates resolution: ${coords.length}/${pathLen} points found`);
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

  // Fetch coordinates and draw route when the route changes
  useEffect(() => {
    if (!route.path) return

    setIsLoading(true)
    
    // Log the path and coordinates for debugging
    console.log("Route path:", route.path);
    console.log("Route edges:", route.edges);
    console.log("Route number in array:", route); // Log entire route object to see its position
    
    if (route.coordinates) {
      console.log("Route coordinates:", route.coordinates);
      // Check if path and coordinates counts match
      if (route.path.length !== route.coordinates.length) {
        console.warn(`Path-coordinates mismatch: ${route.path.length} nodes but ${route.coordinates.length} coordinates`);
      }
    }
    
    fetchCoordinates().then(() => {
      if (coordinates.length > 0 && map.current) {
        // Check if we have the right number of coordinates
        if (route.path && coordinates.length !== route.path.length) {
          console.warn(`Coordinates count mismatch after fetching: Expected ${route.path.length}, got ${coordinates.length}`);
        }
        // Force a small delay to ensure the map is fully loaded
        setTimeout(() => {
          try {
            drawRouteOnMap();
          } catch (error) {
            console.error("Error drawing route on map:", error);
            // Attempt recovery
            try {
              if (map.current) {
                // Simple fallback route drawing if the complex method fails
                drawSimpleRouteLine();
              }
            } catch (fallbackError) {
              console.error("Even fallback route drawing failed:", fallbackError);
            }
          }
        }, 500);
      }
    });
  }, [route, coordinates.length]); // Add coordinates.length as a dependency

  // Draw the route on the map
  const drawRouteOnMap = () => {
    if (!map.current || coordinates.length === 0) {
      console.error("Cannot draw route: Map or coordinates not available");
      return;
    }

    console.log("Drawing route on map with coordinates:", coordinates);

    try {
      // Clean up existing route elements
      if (map.current.getSource('route')) {
        map.current.removeLayer('route-line');
        map.current.removeSource('route');
      }

      // Remove any existing markers by removing all elements with the marker class
      const existingMarkers = document.getElementsByClassName('marker');
      while(existingMarkers.length > 0){
        existingMarkers[0].remove();
      }

      // First, create a mapping of nodes to coordinates
      const nodeCoordinates = new Map<string, [number, number]>();
      
      // Map nodes to coordinates
      if (route.path && route.coordinates && route.path.length === route.coordinates.length) {
        route.path.forEach((node, index) => {
          if (route.coordinates[index]) {
            const lon = typeof route.coordinates[index].longitude === 'string' 
              ? parseFloat(route.coordinates[index].longitude) 
              : route.coordinates[index].longitude;
            const lat = typeof route.coordinates[index].latitude === 'string' 
              ? parseFloat(route.coordinates[index].latitude) 
              : route.coordinates[index].latitude;
            nodeCoordinates.set(node, [lon, lat]);
          }
        });
      } else if (route.path) {
        // If coordinates don't match path length, use what we have
        route.path.forEach((node, index) => {
          if (index < coordinates.length) {
            nodeCoordinates.set(node, coordinates[index]);
          }
        });
      }

      // Verify we have coordinates mapped to nodes
      console.log(`Mapped ${nodeCoordinates.size} nodes to coordinates out of ${route.path?.length || 0} path nodes`);

      // Create a properly ordered array of coordinates that follow the path
      const orderedCoordinates: [number, number][] = [];
      if (route.path) {
        route.path.forEach(node => {
          const coord = nodeCoordinates.get(node);
          if (coord) {
            orderedCoordinates.push(coord);
          }
        });
      }

      console.log("Ordered coordinates for route line:", orderedCoordinates);

      // Use orderedCoordinates if we have them, otherwise fall back to the fetched coordinates
      const routeCoordinates = orderedCoordinates.length > 1 ? orderedCoordinates : coordinates;

      // Add a source and layer for the route line using the coordinates
      map.current.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: routeCoordinates
          }
        }
      });

      // Add the route line layer with style based on mode
      const modeColors: Record<string, string> = {
        air: '#3b82f6', // blue
        sea: '#06b6d4', // cyan
        land: '#f59e0b'  // amber
      };

      // Default color if we can't determine the mode
      const defaultColor = '#3b82f6';

      // Get most common mode for the route
      const modes = route.edges.map(edge => edge.mode);
      const modeCount: Record<string, number> = {};
      let dominantMode = 'land';
      
      for (const mode of modes) {
        modeCount[mode] = (modeCount[mode] || 0) + 1;
        if (!dominantMode || modeCount[mode] > modeCount[dominantMode]) {
          dominantMode = mode;
        }
      }

      map.current.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': modeColors[dominantMode] || defaultColor,
          'line-width': 4,
          'line-opacity': 0.8
        }
      });

      // Function to get icon URL based on mode
      const getIconUrl = (mode: string) => {
        switch (mode) {
          case 'sea': return '/icons/ships.png';
          case 'air': return '/icons/plane.png';
          default: return '/icons/car.png';
        }
      };

      // Add markers for all nodes in the path
      routeCoordinates.forEach((coord, index) => {
        if (!coord || !Array.isArray(coord) || coord.length !== 2) {
          console.warn(`Invalid coordinate at index ${index}:`, coord);
          return;
        }

        // Skip adding duplicates (nodes that are too close to each other)
        if (index > 0) {
          const prevCoord = routeCoordinates[index - 1];
          const distance = Math.sqrt(
            Math.pow(coord[0] - prevCoord[0], 2) + 
            Math.pow(coord[1] - prevCoord[1], 2)
          );
          if (distance < 0.01) {  // Skip if too close
            return;
          }
        }

        // Determine the mode for this marker
        let mode = 'land';
        let displayName = `Point ${index + 1}`;
        
        // If we have path info, use it
        if (route.path && index < route.path.length) {
          const node = route.path[index];
          displayName = node;
          
          // Find the mode from edges
          if (index < route.path.length - 1) {
            const edgeFromThisNode = route.edges.find(edge => 
              edge.from === node && edge.to === route.path[index + 1]
            );
            if (edgeFromThisNode) {
              mode = edgeFromThisNode.mode;
            }
          }
        }
        
        // Create marker element
        const el = document.createElement('div');
        el.className = 'marker';
        el.style.backgroundImage = `url(${getIconUrl(mode)})`;
        el.style.width = '24px';
        el.style.height = '24px';
        el.style.backgroundSize = 'cover';
        
        // Add marker
        new maplibregl.Marker(el)
          .setLngLat({ lng: coord[0], lat: coord[1] })
          .setPopup(new maplibregl.Popup().setHTML(
            `<strong style="color: black;">${displayName}</strong><br>` +
            `<span style="color: black;">Mode: ${mode}</span>`
          ))
          .addTo(map.current!);
      });

      // Fit the map to the route
      if (routeCoordinates.length > 1) {
        const bounds = new maplibregl.LngLatBounds(
          { lng: routeCoordinates[0][0], lat: routeCoordinates[0][1] },
          { lng: routeCoordinates[0][0], lat: routeCoordinates[0][1] }
        );
        
        routeCoordinates.forEach(coord => {
          if (coord && Array.isArray(coord) && coord.length === 2) {
            bounds.extend({ lng: coord[0], lat: coord[1] });
          }
        });

        map.current.fitBounds(bounds, {
          padding: 100,
          duration: 1000
        });
      }
    } catch (error) {
      console.error("Error in drawRouteOnMap:", error);
      throw error; // Re-throw to trigger fallback
    }
  }

  // A simpler fallback method to draw the route line
  const drawSimpleRouteLine = () => {
    if (!map.current || coordinates.length < 2) return;
    
    try {
      // Remove existing route if any
      if (map.current.getSource('simple-route')) {
        map.current.removeLayer('simple-route-line');
        map.current.removeSource('simple-route');
      }
      
      // Just draw a simple line between all coordinates
      map.current.addSource('simple-route', {
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
        id: 'simple-route-line',
        type: 'line',
        source: 'simple-route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#ff0000', // Red for fallback route
          'line-width': 3,
          'line-opacity': 0.7
        }
      });
      
      // Add simple markers
      coordinates.forEach((coord, idx) => {
        const el = document.createElement('div');
        el.className = 'marker';
        el.style.backgroundColor = '#ff0000';
        el.style.width = '12px';
        el.style.height = '12px';
        el.style.borderRadius = '50%';
        
        new maplibregl.Marker(el)
          .setLngLat({ lng: coord[0], lat: coord[1] })
          .setPopup(new maplibregl.Popup().setHTML(
            `<strong style="color: black;">Point ${idx + 1}</strong>`
          ))
          .addTo(map.current!);
      });
      
      // Fit bounds
      if (coordinates.length > 1) {
        const bounds = new maplibregl.LngLatBounds(
          { lng: coordinates[0][0], lat: coordinates[0][1] },
          { lng: coordinates[0][0], lat: coordinates[0][1] }
        );
        
        coordinates.forEach(coord => {
          bounds.extend({ lng: coord[0], lat: coord[1] });
        });

        map.current.fitBounds(bounds, {
          padding: 100,
          duration: 1000
        });
      }
    } catch (error) {
      console.error("Error in drawSimpleRouteLine:", error);
    }
  };

  return (
    <div className={`relative rounded-lg overflow-hidden ${isFullscreen ? 'h-screen w-screen' : 'h-full w-full'}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
          <div className="text-white text-lg">Loading map...</div>
        </div>
      )}
      <div ref={mapContainer} className="h-full w-full" />
    </div>
  )
}
