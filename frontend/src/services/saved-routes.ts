import { RouteResponse } from "@/lib/types";

export interface SavedRoute {
  id: string;
  name: string;
  description?: string;
  start: string;
  goal: string;
  routeData: RouteResponse;
  createdAt: string;
  updatedAt: string;
}

interface SaveRouteRequest {
  name: string;
  description?: string;
  start: string;
  goal: string;
  routeData: RouteResponse;
}

// Fetch all saved routes for the current user
export async function getSavedRoutes(): Promise<SavedRoute[]> {
  try {
    const response = await fetch('/api/routes');
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || response.statusText || 'Unknown error';
      throw new Error(`Failed to fetch saved routes: ${errorMessage}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching saved routes:', error);
    throw error;
  }
}

// Fetch a specific saved route by ID
export async function getSavedRouteById(id: string): Promise<SavedRoute> {
  try {
    const response = await fetch(`/api/routes/${id}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || response.statusText || 'Unknown error';
      throw new Error(`Failed to fetch saved route: ${errorMessage}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching saved route with ID ${id}:`, error);
    throw error;
  }
}

// Save a new route
export async function saveRoute(routeData: SaveRouteRequest): Promise<SavedRoute> {
  try {
    console.log('Sending save route request to API');
    
    const response = await fetch('/api/routes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(routeData),
    });
    
    console.log('API response status:', response.status);
    
    const responseData = await response.json();
    console.log('API response data:', responseData);
    
    if (!response.ok) {
      const errorMessage = responseData.error || response.statusText || 'Unknown error';
      throw new Error(`Failed to save route: ${errorMessage}`);
    }
    
    return responseData;
  } catch (error) {
    console.error('Error saving route:', error);
    throw error;
  }
}

// Delete a saved route
export async function deleteSavedRoute(id: string): Promise<void> {
  try {
    const response = await fetch(`/api/routes/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || response.statusText || 'Unknown error';
      throw new Error(`Failed to delete route: ${errorMessage}`);
    }
  } catch (error) {
    console.error(`Error deleting saved route with ID ${id}:`, error);
    throw error;
  }
} 