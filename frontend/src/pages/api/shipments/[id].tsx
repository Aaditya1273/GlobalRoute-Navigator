import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const shipment = await prisma.shipment.findUnique({
        where: { id: id as string },
        include: {
          routes: {
            include: {
              segments: true,
            },
          },
        },
      });

      if (!shipment) {
        return res.status(404).json({ message: 'Shipment not found' });
      }

      res.status(200).json(shipment);
    } catch (error) {
      res.status(500).json({ message: 'Something went wrong', error });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}