import { NextResponse } from 'next/server';

// GET handler to fetch saved routes for the current user
export async function GET() {
  return NextResponse.json({ 
    message: 'This route is disabled in production. Use the Render backend instead.' 
  });
}

// POST handler to save a new route
export async function POST() {
  return NextResponse.json({ 
    message: 'This route is disabled in production. Use the Render backend instead.' 
  });
} 