import { NextApiRequest, NextApiResponse } from 'next';

// Mock data for route options
const mockRouteOptions = [
  {
    id: 'route-001',
    routeType: 'Air',
    carrier: 'FedEx',
    transitTime: 2,
    cost: 1200,
    borderCrossings: 1,
    co2Emissions: 500,
    reliability: 95,
    score: 92,
  },
  {
    id: 'route-002',
    routeType: 'Sea',
    carrier: 'Maersk',
    transitTime: 14,
    cost: 800,
    borderCrossings: 3,
    co2Emissions: 200,
    reliability: 85,
    score: 88,
  },
  {
    id: 'route-003',
    routeType: 'Land',
    carrier: 'DHL',
    transitTime: 5,
    cost: 1000,
    borderCrossings: 2,
    co2Emissions: 300,
    reliability: 90,
    score: 91,
  },
];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { shipmentId } = req.query;

  if (!shipmentId) {
    return res.status(400).json({ error: 'Shipment ID is required' });
  }

  // Simulate fetching route options based on shipmentId
  const routeOptions = mockRouteOptions;

  res.status(200).json(routeOptions);
}