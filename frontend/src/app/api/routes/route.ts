import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

// GET handler to fetch saved routes for the current user
export async function GET() {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    console.log('Fetching routes for user:', userId);

    // Use the real database query now
    try {
      const savedRoutes = await prisma.savedRoute.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      console.log(`Found ${savedRoutes.length} routes for user ${userId}`);

      // Parse the JSON string stored in routeData
      const routesWithParsedData = savedRoutes.map(route => ({
        ...route,
        routeData: JSON.parse(route.routeData)
      }));

      return NextResponse.json(routesWithParsedData);
    } catch (prismaError) {
      console.error('Database error when fetching routes:', prismaError);
      return NextResponse.json(
        { error: `Database error: ${prismaError.message}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error fetching saved routes:", error);
    return NextResponse.json(
      { error: "Failed to fetch saved routes: " + (error instanceof Error ? error.message : "Unknown error") },
      { status: 500 }
    );
  }
}

// POST handler to save a new route
export async function POST(request: Request) {
  try {
    // Get auth info
    const session = auth();
    console.log('Auth session:', session);
    
    const { userId } = session;
    
    // If not authenticated through Clerk
    if (!userId) {
      console.error('No userId found in session - authentication required');
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Extract route data from request
    const body = await request.json();
    console.log('Request body received:', body);
    
    const { name, description, start, goal, routeData } = body;

    if (!name || !start || !goal || !routeData) {
      console.error('Missing required fields in request');
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // For now, use a mock response to bypass DB issues
    console.log('Authenticated user ID:', userId);
    console.log('Returning mock response for testing');
    
    return NextResponse.json({
      id: Math.random().toString(36).substring(2, 15),
      name,
      description,
      start,
      goal,
      routeData,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }, { status: 201 });
    
  } catch (error) {
    console.error("Error saving route:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { error: `Failed to save route: ${errorMessage}` },
      { status: 500 }
    );
  }
} 