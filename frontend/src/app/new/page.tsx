"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, Box, Navigation } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { RouteMap } from "@/components/route-map";
import { RouteList } from "@/components/route-list";
import type { RouteResponse } from "@/lib/types";
import { findPaths } from "@/services/api";
import { SaveRouteDialog } from "@/components/save-route-dialog";
import { useToast } from "@/components/ui/use-toast";
import { DebugInfo } from '@/components/debug-info';

const CARGO_TYPES = [
  { value: "general", label: "General Merchandise" },
  { value: "perishable", label: "Perishable Goods" },
  { value: "hazardous", label: "Hazardous Materials" },
  { value: "fragile", label: "Fragile Items" },
  { value: "bulk", label: "Bulk Goods" },
  { value: "liquid", label: "Liquid Cargo" },
];

const TRANSPORT_MODES = [
  { value: "land", label: "Land" },
  { value: "sea", label: "Sea" },
  { value: "air", label: "Air" },
];

export default function Home() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  // Default form data
  const defaultFormData = {
    start: "",
    goal: "",
    avoid_countries: [] as string[],
    top_n: 3,
    time_weight: 0.5,
    price_weight: 0.5,
    allowed_modes: ["land", "sea", "air"],
    prohibited_flag: "avoid",
    restricted_flag: "avoid",
    description: "",
    cargo_type: "general",
    weight: 1,
  };
  
  const [formData, setFormData] = useState(defaultFormData);
  const [countryInput, setCountryInput] = useState("");
  const [routes, setRoutes] = useState<RouteResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<number>(0);
  const [autoSubmit, setAutoSubmit] = useState(false);

  // Effect to load URL parameters into the form
  useEffect(() => {
    if (!searchParams) return;
    
    // Get values from URL query parameters
    const start = searchParams.get('start');
    const goal = searchParams.get('goal');
    const description = searchParams.get('description');
    const avoidCountries = searchParams.get('avoidCountries');
    const modes = searchParams.get('modes');
    
    // If we have required fields (at least start and goal), update the form
    if (start && goal) {
      // Parse avoid countries if present
      const avoidCountriesArray = avoidCountries 
        ? avoidCountries.split(',').filter(Boolean)
        : [];
      
      // Parse allowed modes if present
      let allowedModes = ["land", "sea", "air"]; // default
      if (modes) {
        // Convert to lowercase and filter valid modes
        const requestedModes = modes.split(',')
          .map(m => m.toLowerCase())
          .filter(m => ["land", "sea", "air"].includes(m));
        
        if (requestedModes.length > 0) {
          allowedModes = requestedModes;
        }
      }
      
      // Update form data
      setFormData(prev => ({
        ...prev,
        start: start,
        goal: goal,
        description: description || '',
        avoid_countries: avoidCountriesArray,
        allowed_modes: allowedModes,
      }));
      
      // Set auto-submit flag to true to automatically search for routes
      setAutoSubmit(true);
      
      // Show a toast to inform the user
      toast({
        title: 'Route details loaded',
        description: 'The form has been filled with saved route details',
      });
    }
  }, [searchParams, toast]);
  
  // Effect to auto-submit the form if needed
  useEffect(() => {
    if (autoSubmit && formData.start && formData.goal) {
      // Create a timeout to allow the form to render first
      const timer = setTimeout(() => {
        handleSubmit(new Event('submit') as any);
        setAutoSubmit(false);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [autoSubmit, formData]);

  const handleModeChange = (mode: string) => {
    setFormData(prev => ({
      ...prev,
      allowed_modes: prev.allowed_modes.includes(mode)
        ? prev.allowed_modes.filter(m => m !== mode)
        : [...prev.allowed_modes, mode]
    }));
  };

  const handleAddCountry = () => {
    if (countryInput && !formData.avoid_countries.includes(countryInput.toUpperCase())) {
      setFormData(prev => ({
        ...prev,
        avoid_countries: [...prev.avoid_countries, countryInput.toUpperCase()]
      }));
      setCountryInput("");
    }
  };

  const handleRemoveCountry = (country: string) => {
    setFormData(prev => ({
      ...prev,
      avoid_countries: prev.avoid_countries.filter(c => c !== country)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate that we have the minimum required fields
    if (!formData.start || !formData.goal) {
      setError("Origin and destination are required");
      setLoading(false);
      return;
    }

    // Make sure we have at least one transport mode selected
    if (formData.allowed_modes.length === 0) {
      setError("At least one transportation mode must be selected");
      setLoading(false);
      return;
    }

    // Validate weight is greater than 0
    if (formData.weight <= 0) {
      setError("Weight must be greater than 0");
      setLoading(false);
      return;
    }

    try {
      const data = await findPaths(formData);
      
      if (data && 'error' in data) {
        setError(data.error);
        setLoading(false);
        return;
      }
      
      setRoutes(data);
      setSelectedRoute(0);
    } catch (err) {
      console.error("Error submitting route request:", err);
      
      // Provide more helpful error messages based on the error type
      if (err instanceof Error) {
        if (err.message.includes("Network Error") || err.message.includes("Cannot connect")) {
          setError("Network Error: Cannot connect to the route planning server. Please ensure the backend is running at http://127.0.0.1:8000");
        } else if (err.message.includes("timeout")) {
          setError("Server is taking too long to respond. The route calculation might be complex or the server is overloaded.");
        } else {
          setError(err.message);
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="max-w-[1400px] mx-auto p-6">
        <div className="flex items-center space-x-4 mb-8 bg-white/5 backdrop-blur-lg p-6 rounded-2xl border border-white/10 shadow-xl">
          <Box className="w-12 h-12 text-sky-400" />
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500">
            Advanced Logistics Route Planner Pro
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 shadow-2xl transition-all duration-300 hover:shadow-sky-500/10">
              <h2 className="text-2xl font-semibold mb-8 text-sky-400">Shipment Details</h2>
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-sky-300">Origin</label>
                    <input
                      type="text"
                      value={formData.start}
                      onChange={(e) => setFormData({ ...formData, start: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all duration-200"
                      required
                      placeholder="Enter origin"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-sky-300">Destination</label>
                    <input
                      type="text"
                      value={formData.goal}
                      onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all duration-200"
                      required
                      placeholder="Enter destination"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-sky-300">Cargo Description</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all duration-200"
                    required
                    placeholder="Describe your cargo"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-sky-300">Cargo Type</label>
                    <select
                      value={formData.cargo_type}
                      onChange={(e) => setFormData({ ...formData, cargo_type: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all duration-200"
                    >
                      {CARGO_TYPES.map((type) => (
                        <option key={type.value} value={type.value} className="bg-slate-800 text-white">
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-sky-300">
                      Weight (kg)
                      <span className="text-xs text-slate-400 ml-1">
                        (Affects pricing)
                      </span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: Number(e.target.value) })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all duration-200"
                      required
                      placeholder="Enter weight in kg"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-sky-300">Number of Routes</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={formData.top_n}
                    onChange={(e) => setFormData({ ...formData, top_n: Number(e.target.value) })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all duration-200"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-sky-300">Transport Modes</label>
                  <div className="flex flex-wrap gap-3">
                    {TRANSPORT_MODES.map((mode) => (
                      <button
                        key={mode.value}
                        type="button"
                        onClick={() => handleModeChange(mode.value)}
                        className={`px-4 py-2 rounded-lg border transition-all ${
                          formData.allowed_modes.includes(mode.value)
                            ? "bg-sky-500/20 border-sky-500 text-sky-300"
                            : "bg-slate-800/50 border-slate-600 text-slate-400 hover:border-slate-500"
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-sky-300">
                    Avoided Countries{" "}
                    <span className="text-xs text-slate-400">
                      (Optional)
                    </span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={countryInput}
                      onChange={(e) => setCountryInput(e.target.value)}
                      className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all duration-200"
                      placeholder="Enter country code"
                    />
                    <button
                      type="button"
                      onClick={handleAddCountry}
                      className="px-4 py-3 bg-sky-600 hover:bg-sky-700 rounded-xl text-white transition-all duration-200"
                    >
                      Add
                    </button>
                  </div>
                  
                  {formData.avoid_countries.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {formData.avoid_countries.map((country) => (
                        <span
                          key={country}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-red-900/20 text-red-300 border border-red-500/40 rounded-full text-xs"
                        >
                          {country}
                          <button
                            type="button"
                            onClick={() => handleRemoveCountry(country)}
                            className="hover:text-white"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <label className="block text-sm font-medium text-sky-300">Priority Weighting</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={formData.time_weight}
                    onChange={(e) => {
                      const timeWeight = parseFloat(e.target.value);
                      setFormData({
                        ...formData,
                        time_weight: timeWeight,
                        price_weight: 1 - timeWeight,
                      });
                    }}
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-sky-500 [&::-webkit-slider-thumb]:appearance-none hover:[&::-webkit-slider-thumb]:bg-sky-400 transition-colors"
                  />
                  <div className="flex justify-between text-sm">
                    <span className="text-sky-300">Cost Priority</span>
                    <span className="text-sky-300">Time Priority</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-sky-300">Prohibited Country Handling</label>
                  <select
                    value={formData.prohibited_flag}
                    onChange={(e) => setFormData({ ...formData, prohibited_flag: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all duration-200"
                  >
                    <option value="avoid" className="bg-slate-800">Avoid if possible</option>
                    <option value="strict" className="bg-slate-800">Strictly avoid</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 px-6 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-500 rounded-xl font-semibold text-lg shadow-lg hover:shadow-sky-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-[1.02]"
                >
                  {loading ? "Calculating Routes..." : "Calculate Routes"}
                </button>
              </form>
            </div>

            {routes && Array.isArray(routes.paths) && (
              <RouteList
                routes={routes}
                selectedRoute={selectedRoute}
                onRouteSelect={setSelectedRoute}
              />
            )}
          </div>

          <div className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-6 py-4 rounded-xl flex items-center space-x-3">
                <AlertTriangle className="w-5 h-5" />
                <p>{error}</p>
              </div>
            )}

            {loading ? (
              <div className="space-y-6">
                <Skeleton className="h-[400px] w-full rounded-xl" />
                <Skeleton className="h-[200px] w-full rounded-xl" />
              </div>
            ) : routes && Array.isArray(routes.paths) ? (
              <>
                <div className="pt-5 space-y-6">
                  <h2 className="text-2xl font-semibold text-sky-400">Route Visualization</h2>
                  <div className="relative h-[500px] bg-slate-800 rounded-xl overflow-hidden border border-slate-700">
                    <RouteMap route={routes.paths[selectedRoute]} />
                  </div>
                  
                  <h3 className="text-xl font-semibold mb-6 text-sky-400">Route Information</h3>
                  {routes.avoided_countries.length > 0 && (
                    <div className="mb-6">
                      <p className="text-sky-300 mb-2">Avoided Countries:</p>
                      <div className="flex flex-wrap gap-2">
                        <div className="px-3 py-1 bg-red-900/30 border border-red-500/30 rounded-lg text-red-300">
                          {routes.avoided_countries.join(", ")}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-4">
                    {routes.paths[selectedRoute].edges.map((edge, i) => (
                      <div 
                        key={i}
                        className={`p-4 rounded-lg border ${
                          edge.mode === "air" 
                            ? "bg-blue-900/20 border-blue-500/30" 
                            : edge.mode === "sea" 
                            ? "bg-teal-900/20 border-teal-500/30"
                            : "bg-amber-900/20 border-amber-500/30"
                        }`}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <div className="font-medium text-white">
                            {edge.from} → {edge.to}
                          </div>
                          <div className={`px-2 py-1 rounded text-xs font-medium uppercase ${
                            edge.mode === "air" 
                              ? "bg-blue-500/20 text-blue-300" 
                              : edge.mode === "sea" 
                              ? "bg-teal-500/20 text-teal-300"
                              : "bg-amber-500/20 text-amber-300"
                          }`}>
                            {edge.mode}
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <span className="text-slate-400">Distance: </span>
                            <span className="text-white">{Math.round(edge.distance)} km</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Time: </span>
                            <span className="text-white">{Math.round(edge.time)} hrs</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Cost: </span>
                            <span className="text-white">
                              ${edge.price < 1000 
                                ? edge.price.toFixed(2) 
                                : (edge.price / 1000).toFixed(2) + 'k'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-8 flex justify-between items-center">
                    <div className="grid grid-cols-3 gap-x-8 text-sm">
                      <div className="space-y-1">
                        <p className="text-slate-400">Total Distance</p>
                        <p className="text-2xl font-bold text-white">
                          {Math.round(routes.paths[selectedRoute].distance_sum)} km
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-slate-400">Total Time</p>
                        <p className="text-2xl font-bold text-white">
                          {Math.round(routes.paths[selectedRoute].time_sum)} hrs
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-slate-400">Total Cost</p>
                        <p className="text-2xl font-bold text-white">
                          ${routes.paths[selectedRoute].price_sum < 1000 
                            ? Math.round(routes.paths[selectedRoute].price_sum) 
                            : (routes.paths[selectedRoute].price_sum / 1000).toFixed(2) + 'k'}
                        </p>
                      </div>
                    </div>
                    
                    <SaveRouteDialog 
                      route={routes} 
                      origin={formData.start} 
                      destination={formData.goal}
                      onSaved={() => {
                        // Optional callback when a route is saved
                      }}
                    />
                  </div>
                </div>

                {/* Debug info for development */}
                {process.env.NODE_ENV === 'development' && <DebugInfo routes={routes} />}
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}