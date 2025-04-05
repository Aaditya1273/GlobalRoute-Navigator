import React from 'react';

interface DebugInfoProps {
  routes: any;
}

export function DebugInfo({ routes }: DebugInfoProps) {
  if (!routes || !routes.paths) return null;

  return (
    <div className="p-4 bg-slate-800 border border-slate-700 rounded-lg mt-4">
      <h3 className="text-lg font-semibold mb-2 text-sky-400">Route Debug Information</h3>
      {routes.paths.map((route: any, index: number) => (
        <div key={index} className="mb-4 p-3 bg-slate-900 rounded border border-slate-700">
          <h4 className="text-emerald-400 font-medium mb-2">Route {index + 1}</h4>
          <div className="text-xs font-mono break-all whitespace-pre-wrap">
            <p className="text-sky-300 mb-2">Total Price: {route.price_sum} (Display format: ${route.price_sum < 1000 
              ? route.price_sum.toFixed(2) 
              : (route.price_sum / 1000).toFixed(2) + 'k'})</p>
            <div className="mt-2">
              <h5 className="text-amber-400 mb-1">Route Edges:</h5>
              {route.edges.map((edge: any, edgeIndex: number) => (
                <div key={edgeIndex} className="ml-2 mb-2 p-2 bg-slate-800 rounded">
                  <p className="text-slate-300">From: {edge.from} → To: {edge.to}</p>
                  <p className="text-slate-300">Mode: <span className="text-purple-400">{edge.mode}</span></p>
                  <p className="text-slate-300">Price: <span className="text-green-400">{edge.price}</span> (Display: ${edge.price < 1000 
                    ? edge.price.toFixed(2) 
                    : (edge.price / 1000).toFixed(2) + 'k'})</p>
                  <p className="text-slate-300">Distance: {edge.distance} km | Time: {edge.time}h</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 