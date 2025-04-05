
export interface ShipmentDetails {
    origin: string;
    destination: string;
    cargoType: string;
    weight: string;
    deadline: string;
  }
  
  export interface RouteSegment {
    mode: 'air' | 'sea' | 'land';
    duration: number;
    distance: number;
    cost: number;
    origin: string;
    destination: string;
  }
  
  export interface RouteAlerts {
    weather: string;
    political: string;
    security: string;
  }
  
  export interface Route {
    origin: string;
    destination: string;
    modes: ('air' | 'sea' | 'land')[];
    duration: number;
    cost: number;
    cargoType: string;
    riskLevel: string;
    segments: RouteSegment[];
    recommendations: string[];
    alerts: RouteAlerts;
  }