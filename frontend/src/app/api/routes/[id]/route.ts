import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

// GET handler to fetch a specific saved route
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = params;

    // Mock data for testing
    if (id === "1" || id === "2") {
      const mockRoute = {
        id,
        name: id === "1" ? "NYC to LA Route" : "Shanghai to Rotterdam",
        description: id === "1" ? "Cross-country shipping route" : "International sea route",
        userId: userId,
        start: id === "1" ? "New York" : "Shanghai",
        goal: id === "1" ? "Los Angeles" : "Rotterdam",
        routeData: JSON.stringify(id === "1" ? {
          avoided_countries: ["CUBA", "VENEZUELA"],
          penalty_countries: [],
          paths: [{
            path: ["New York", "Chicago", "Denver", "Los Angeles"],
            coordinates: [
              { node: "New York", latitude: 40.7128, longitude: -74.0060 },
              { node: "Chicago", latitude: 41.8781, longitude: -87.6298 },
              { node: "Denver", latitude: 39.7392, longitude: -104.9903 },
              { node: "Los Angeles", latitude: 34.0522, longitude: -118.2437 }
            ],
            edges: [
              { from: "New York", to: "Chicago", mode: "land", time: 24, price: 1200, distance: 1300 },
              { from: "Chicago", to: "Denver", mode: "land", time: 20, price: 900, distance: 1000 },
              { from: "Denver", to: "Los Angeles", mode: "land", time: 18, price: 1000, distance: 1100 }
            ],
            time_sum: 62,
            price_sum: 3100,
            distance_sum: 3400,
            CO2_sum: 340
          }]
        } : {
          avoided_countries: [],
          penalty_countries: [],
          paths: [{
            path: ["Shanghai", "Singapore", "Suez", "Rotterdam"],
            coordinates: [
              { node: "Shanghai", latitude: 31.2304, longitude: 121.4737 },
              { node: "Singapore", latitude: 1.3521, longitude: 103.8198 },
              { node: "Suez", latitude: 29.9668, longitude: 32.5498 },
              { node: "Rotterdam", latitude: 51.9244, longitude: 4.4777 }
            ],
            edges: [
              { from: "Shanghai", to: "Singapore", mode: "sea", time: 168, price: 5000, distance: 4900 },
              { from: "Singapore", to: "Suez", mode: "sea", time: 240, price: 7000, distance: 8700 },
              { from: "Suez", to: "Rotterdam", mode: "sea", time: 192, price: 6000, distance: 6500 }
            ],
            time_sum: 600,
            price_sum: 18000,
            distance_sum: 20100,
            CO2_sum: 201
          }]
        }),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      return NextResponse.json({
        ...mockRoute,
        routeData: JSON.parse(mockRoute.routeData)
      });
    }

    // If we get here and it's not a mock ID, return a 404
    return NextResponse.json(
      { error: "Route not found" },
      { status: 404 }
    );

    // Commented out real database query for now
    /*
    const savedRoute = await prisma.savedRoute.findUnique({
      where: { id },
    });

    if (!savedRoute) {
      return NextResponse.json(
        { error: "Route not found" },
        { status: 404 }
      );
    }

    // Ensure the user can only access their own routes
    if (savedRoute.userId !== userId) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Parse the JSON string stored in routeData
    return NextResponse.json({
      ...savedRoute,
      routeData: JSON.parse(savedRoute.routeData)
    });
    */
  } catch (error) {
    console.error("Error fetching saved route:", error);
    return NextResponse.json(
      { error: "Failed to fetch route: " + (error instanceof Error ? error.message : "Unknown error") },
      { status: 500 }
    );
  }
}

// DELETE handler to remove a saved route
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = params;

    // For testing - just return success for any ID
    return NextResponse.json({ success: true });

    // Commented out real database query for now
    /*
    // First check if the route exists and belongs to the user
    const savedRoute = await prisma.savedRoute.findUnique({
      where: { id },
    });

    if (!savedRoute) {
      return NextResponse.json(
        { error: "Route not found" },
        { status: 404 }
      );
    }

    if (savedRoute.userId !== userId) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Delete the route
    await prisma.savedRoute.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
    */
  } catch (error) {
    console.error("Error deleting saved route:", error);
    return NextResponse.json(
      { error: "Failed to delete route: " + (error instanceof Error ? error.message : "Unknown error") },
      { status: 500 }
    );
  }
} 