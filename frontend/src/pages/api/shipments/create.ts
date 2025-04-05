import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      const { origin, destination, cargo_weight, cargo_volume, priority, status } = req.body;
      
      const newShipment = await prisma.shipment.create({
        data: { origin, destination, cargo_weight, cargo_volume, priority, status },
      });

      res.status(201).json(newShipment);
    } catch (error) {
      res.status(500).json({ error: "Error creating shipment" });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
