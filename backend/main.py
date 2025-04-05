from fastapi import FastAPI, Query, HTTPException
import pickle
import heapq
from math import radians, sin, cos, sqrt, atan2
from typing import List, Optional, Literal
from prohibited_items import find_prohibited
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import json
import os

# Create a single FastAPI instance
app = FastAPI()

# Add CORS middleware with broader settings
origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Load the graph once
graph_path = os.path.join(os.path.dirname(__file__), "graph_final_8_precalc.pkl")
with open(graph_path, "rb") as G:
    roadsn = pickle.load(G)

# CO2 emission factors - Updated with more accurate values (kg CO2 per ton-km)
EMISSION_FACTORS = {
    "sea": 0.015,   # 15g per ton-km for sea freight (most efficient)
    "land": 0.060,  # 60g per ton-km for land freight (truck)
    "air": 0.500,   # 500g per ton-km for air freight (least efficient)
}

# Constants - Updated to more realistic values based on the graph statistics
time_min, time_max = 0.5, 100.0  # More reasonable range for travel times
price_min, price_max = 10, 1000.0  # More reasonable range for prices

def haversine(lat1, lon1, lat2, lon2):
    R = 6371  # Earth's radius in km
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    return R * c

def precompute_heuristics(multigraph, goal, time_weight, price_weight):
    goal_pos = multigraph.nodes[goal]
    heuristic_dict = {}
    for node in multigraph.nodes():
        if node == goal:
            heuristic_dict[node] = 0
            continue
        node_pos = multigraph.nodes[node]
        dist = haversine(node_pos['latitude'], node_pos['longitude'], 
                         goal_pos['latitude'], goal_pos['longitude'])
        # More accurate estimations:
        # 1. Time: Use fastest transport mode (air) speed
        time_est = dist / 800  # Fastest mode (air) in hours
        
        # 2. Price: Use cheapest transport mode (sea) price calculation
        # Base cost + very basic weight pricing (assuming 1kg)
        price_est = 20 + (dist * 0.0003) + (dist * 0.00003)
        
        # Normalize estimates to a 0-100 scale for consistent comparison
        time_norm = (time_est - time_min) / (time_max - time_min) * 100
        price_norm = (price_est - price_min) / (price_max - price_min) * 100
        
        # Weighted combination of normalized values 
        heuristic_dict[node] = (time_weight * time_norm) + (price_weight * price_norm)
    return heuristic_dict

def astar_top_n_avoid_countries(multigraph, start, goal, avoid_countries=None, penalty_countries=None, top_n=3, time_weight=0.3, price_weight=0.3, allowed_modes=['land','sea','air'], cargo_weight=1.0):
    if start not in multigraph or goal not in multigraph:
        return {"error": "Start or goal node not in graph"}
    
    # Ensure cargo_weight is valid
    if cargo_weight <= 0:
        cargo_weight = 1.0  # Default to 1kg if invalid weight

    avoid_countries = set(avoid_countries) if avoid_countries else set()
    penalty_countries = set(penalty_countries) if penalty_countries else set()
    if (multigraph.nodes[start].get('country_code') in avoid_countries or 
        multigraph.nodes[goal].get('country_code') in avoid_countries):
        return {"error": f"No valid route: Start ({start}) or goal ({goal}) is in a banned country."}
    
    heuristic_dict = precompute_heuristics(multigraph, goal, time_weight, price_weight)
    queue = [(0, 0, 0, start, [start], [])]
    visited = set()
    counter = 0
    completed_paths = []
    
    while queue:
        f_cost, g_cost, _, current, path, edge_details = heapq.heappop(queue)
        if current == goal:
            completed_paths.append((path, edge_details, g_cost))
            if len(completed_paths) >= top_n:
                completed_paths.sort(key=lambda x: x[2])
                if f_cost > completed_paths[top_n-1][2]:
                    break
            continue
        
        if current in visited:
            continue
        visited.add(current)
        
        for u, neighbor, key, data in multigraph.edges(current, keys=True, data=True):
            if data['mode'] not in allowed_modes:
                continue
            neighbor_country = multigraph.nodes[neighbor].get('country_code', '')
            current_country = multigraph.nodes[current].get('country_code', '')
            if neighbor in path or neighbor_country in avoid_countries:
                continue
            if neighbor_country in penalty_countries:
                restricted_penalty = 1
            else:
                restricted_penalty = 0
     
            border_penalty = 1 if current_country != neighbor_country else 0

            new_g_cost = g_cost + time_weight*data['time_norm'] + price_weight*data['price_norm'] + border_penalty + restricted_penalty
            h_cost = heuristic_dict[neighbor]
            new_f_cost = new_g_cost + h_cost

            new_path = path + [neighbor]
            new_edge_details = edge_details + [(current, neighbor, key, data)]

            counter += 1
            heapq.heappush(queue, (new_f_cost, new_g_cost, counter, neighbor, new_path, new_edge_details))
    
    completed_paths.sort(key=lambda x: x[2])
    if not completed_paths:
        return {"error": f"No paths found between {start} and {goal} with selected parameters."}
    
    # Extract latitude and longitude for each node in the path
    def get_coordinates(path):
        return [{
            "node": node,
            "latitude": multigraph.nodes[node]['latitude'],
            "longitude": multigraph.nodes[node]['longitude']
        } for node in path]
    
    def calculate_edge_price(edge, cargo_weight):
        """
        Calculate the total price for an edge based on realistic logistics pricing:
        1. Base price (fixed handling costs + distance-based operating costs)
        2. Weight-dependent price (cargo weight * distance * weight factor)
        3. Apply volume discounts for large weights
        """
        # Get the base price that was pre-calculated (includes fixed costs)
        base_price = edge.get('price', 0)
        
        # Get the weight factor and distance
        weight_factor = edge.get('weight_factor', 0.00008)  # Default to land transport weight factor
        distance = edge.get('distance', 0)
        mode = edge.get('mode', 'land')
        
        # Apply volume discount for larger shipments (economies of scale)
        # 1. Full rate for first 100kg
        # 2. 10% discount for 100-500kg
        # 3. 20% discount for 500-1000kg
        # 4. 30% discount for weight over 1000kg
        if cargo_weight <= 100:
            weight_price = cargo_weight * distance * weight_factor
        else:
            first_tier = 100 * distance * weight_factor
            
            if cargo_weight <= 500:
                second_tier = (cargo_weight - 100) * distance * weight_factor * 0.9
                weight_price = first_tier + second_tier
            elif cargo_weight <= 1000:
                second_tier = 400 * distance * weight_factor * 0.9  # 400kg at 10% discount
                third_tier = (cargo_weight - 500) * distance * weight_factor * 0.8  # 20% discount
                weight_price = first_tier + second_tier + third_tier
            else:
                second_tier = 400 * distance * weight_factor * 0.9  # 400kg at 10% discount
                third_tier = 500 * distance * weight_factor * 0.8  # 500kg at 20% discount
                fourth_tier = (cargo_weight - 1000) * distance * weight_factor * 0.7  # 30% discount
                weight_price = first_tier + second_tier + third_tier + fourth_tier
        
        # Calculate total price (base + weight-dependent)
        total_price = base_price + weight_price
        
        # Each mode now has a distinctive price profile for better visual differentiation
        if mode == 'air':
            # Air is now much more expensive but varies with distance
            # Make air cost dramatically different based on distance
            air_base_cost = 500  # Higher minimum cost
            distance_factor = 0.45  # Higher per-km cost
            weight_multiplier = 4.2  # Higher per-kg cost
            
            # Very dramatic distance scaling - short flights still expensive, long flights very expensive
            distance_scale = 1.0 + (distance / 1000)  # Add 100% for every 1000km
            
            # Calculate price with strong distance dependency
            air_price = air_base_cost + (distance * distance_factor * distance_scale) + (cargo_weight * weight_multiplier)
            
            # Make sure intercontinental flights (>5000km) are always >$3500
            if distance > 5000:
                air_price = max(air_price, 3500 + (distance - 5000) * 0.3)
            
            return air_price
        elif mode == 'sea':
            # Sea has low per-km cost but higher base cost
            sea_base_cost = 200
            sea_price = sea_base_cost + (distance * 0.15) + (cargo_weight * 0.4)
            return sea_price
        else:  # land
            # Land has moderate costs all around
            land_base_cost = 150
            land_price = land_base_cost + (distance * 0.25) + (cargo_weight * 0.6)
            return land_price
    
    return [{
        "path": path,
        "coordinates": get_coordinates(path),  # Include coordinates for plotting
        "edges": [{
            "from": edge[0], 
            "to": edge[1], 
            "mode": edge[3]['mode'],
            "time": edge[3]['time'], 
            "price": calculate_edge_price(edge[3], cargo_weight),
            "distance": edge[3]['distance']
        } for edge in edges],
        "time_sum": sum(edge[3]['time'] for edge in edges),
        "price_sum": sum(calculate_edge_price(edge[3], cargo_weight) for edge in edges),
        "distance_sum": sum(edge[3]['distance'] for edge in edges),
        "CO2_sum": sum(
            # Convert cargo weight to tons for CO2 calculation (industry standard is ton-km)
            edge[3]['distance'] * EMISSION_FACTORS[edge[3]['mode']] * (cargo_weight / 1000) 
            for edge in edges
        )
    } for path, edges, cost in completed_paths[:top_n]]

def make_avoid_list(description, prohibited_flag, restricted_flag):
    if prohibited_flag == "ignore" and restricted_flag == "ignore":
        return {}
    
    try:
        response = find_prohibited.ask_gemini(description)
        
        if isinstance(response, str):
            try:
                result_dict = json.loads(response)
            except json.JSONDecodeError:
                print(f"Error decoding JSON response: {response}")
                return {}
        else:
            result_dict = response
        
        if not isinstance(result_dict, dict) or 'prohibited_in' not in result_dict or 'restricted_in' not in result_dict:
            print(f"Invalid response format: {result_dict}")
            return {}
        
        if prohibited_flag == "ignore" and restricted_flag == "penalty":
            return {'penalty_countries': result_dict['restricted_in']}
        elif prohibited_flag == "ignore" and restricted_flag == "avoid":
            return {'avoid_countries': result_dict['restricted_in']}
        elif prohibited_flag == "avoid" and restricted_flag == "ignore":
            return {'avoid_countries': result_dict['prohibited_in']}
        elif prohibited_flag == "avoid" and restricted_flag == "penalty":
            return {'penalty_countries': result_dict['restricted_in'], "avoid_countries": result_dict['prohibited_in']}
        elif prohibited_flag == "avoid" and restricted_flag == "avoid":
            return {'avoid_countries': result_dict['prohibited_in'] + result_dict['restricted_in']}
    except Exception as e:
        print(f"Error in make_avoid_list: {e}")
        return {}

# Define request model
class PathRequest(BaseModel):
    start: str
    goal: str
    avoid_countries: Optional[List[str]] = []
    top_n: int = Field(3, gt=0)
    time_weight: float = Field(0.5, ge=0.0, le=1.0)
    price_weight: float = Field(0.5, ge=0.0, le=1.0)
    allowed_modes: List[str] = ["land", "sea", "air"]
    prohibited_flag: Literal["ignore", "avoid"] = "ignore"
    restricted_flag: Literal["ignore", "avoid", "penalty"] = "ignore"
    description: str
    cargo_weight: float = Field(1.0, ge=0.0, description="Cargo weight in kg")

@app.post("/find_paths/")
async def find_paths(request: PathRequest):
    # Print the received request for debugging
    print(f"Received request: {request}")
    
    # Ensure time_weight + price_weight sums to 1
    if request.time_weight + request.price_weight < 0.99 or request.time_weight + request.price_weight > 1.01:
        raise HTTPException(status_code=400, detail="time_weight and price_weight must sum to 1")

    try:
        combined_dict = make_avoid_list(request.description, request.prohibited_flag, request.restricted_flag)
        paths = astar_top_n_avoid_countries(
            roadsn,
            start=request.start,
            goal=request.goal,
            avoid_countries=request.avoid_countries + combined_dict.get('avoid_countries', []),
            penalty_countries=combined_dict.get('penalty_countries', []),
            top_n=request.top_n,
            time_weight=request.time_weight,
            price_weight=request.price_weight,
            allowed_modes=request.allowed_modes,
            cargo_weight=request.cargo_weight
        )

        return {
            "avoided_countries": request.avoid_countries + combined_dict.get('avoid_countries', []),
            "penalty_countries": combined_dict.get('penalty_countries', []),
            "paths": paths
        }
    except Exception as e:
        print(f"Error processing request: {e}")
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint to verify the API is running properly"""
    return {"status": "healthy", "message": "GlobalRoute Navigator Backend API is running"}

@app.get("/")
async def root():
    """Root endpoint that provides basic API information"""
    return {
        "message": "Welcome to the GlobalRoute Navigator API",
        "endpoints": {
            "POST /find_paths/": "Find optimal paths between locations",
            "GET /health": "Check API health status"
        },
        "documentation": "/docs"
    }