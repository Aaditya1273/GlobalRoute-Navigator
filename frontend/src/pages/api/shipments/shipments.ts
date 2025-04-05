// Example in Next.js API route (pages/api/shipments.ts)
import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const shipments = await prisma.shipment.findMany();
    res.status(200).json(shipments);
  } catch (error) {
    console.error('Error fetching shipments:', error);
    res.status(500).json({ message: 'Failed to fetch shipments' });
  }
}