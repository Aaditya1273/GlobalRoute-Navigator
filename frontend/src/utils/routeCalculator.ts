import type { ShipmentDetails, Route } from '../types';

// Simulated route calculation
export function calculateRoutes(shipmentDetails: ShipmentDetails): Route[] {
  const routes: Route[] = [
    {
      origin: 'New York',
      destination: 'London',
      modes: ['sea', 'land'],
      duration: 168,
      cost: 3500,
      cargoType: shipmentDetails.cargoType,
      riskLevel: 'Medium',
      segments: [
        {
          mode: 'sea',
          duration: 144,
          distance: 3500,
          cost: 2800,
          origin: 'New York',
          destination: 'London'
        },
        {
          mode: 'land',
          duration: 24,
          distance: 450,
          cost: 700,
          origin: 'London',
          destination: 'London'
        },
      ],
      recommendations: [
        "Most cost-effective for non-urgent cargo",
        "Environmentally friendly option",
        "Suitable for bulk shipments"
      ],
      alerts: {
        weather: "Moderate sea conditions expected in North Atlantic",
        political: "Standard customs processing at UK border",
        security: "Regular security measures"
      }
    },
    {
      origin: 'Singapore',
      destination: 'Dubai',
      modes: ['air'],
      duration: 48,
      cost: 5800,
      cargoType: shipmentDetails.cargoType,
      riskLevel: 'Low',
      segments: [
        {
          mode: 'air',
          duration: 48,
          distance: 4200,
          cost: 5800,
          origin: 'Singapore',
          destination: 'Dubai'
        },
      ],
      recommendations: [
        "Fastest delivery option",
        "Ideal for high-value cargo",
        "Best for time-sensitive shipments"
      ],
      alerts: {
        weather: "Clear conditions across flight path",
        political: "Expedited customs clearance available",
        security: "Enhanced security protocols in place"
      }
    },
    {
      origin: 'Shanghai',
      destination: 'Tokyo',
      modes: ['land', 'air', 'land'],
      duration: 72,
      cost: 4200,
      cargoType: shipmentDetails.cargoType,
      riskLevel: 'High',
      segments: [
        {
          mode: 'land',
          duration: 12,
          distance: 250,
          cost: 400,
          origin: 'Shanghai',
          destination: 'Shanghai Airport'
        },
        {
          mode: 'air',
          duration: 36,
          distance: 3000,
          cost: 3400,
          origin: 'Shanghai Airport',
          destination: 'Tokyo Airport'
        },
        {
          mode: 'land',
          duration: 24,
          distance: 400,
          cost: 400,
          origin: 'Tokyo Airport',
          destination: 'Tokyo'
        },
      ],
      recommendations: [
        "Balanced cost-time option",
        "Flexible routing",
        "Good for medium-priority shipments"
      ],
      alerts: {
        weather: "Potential storms along coastal route",
        political: "Multiple border crossings require documentation",
        security: "Additional security checks at airports"
      }
    },
  ];

  return routes;
}