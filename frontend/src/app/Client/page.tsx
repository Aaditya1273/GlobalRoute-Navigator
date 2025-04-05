import ShipmentMap from "@/components/ShipmentMap";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0 opacity-20">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400 rounded-full filter blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-400 rounded-full filter blur-3xl transform translate-x-1/2 translate-y-1/2"></div>
      </div>

      <div className="container mx-auto px-4 py-12 relative z-10">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4 tracking-tight">
            Global Logistics Tracker
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Track your shipments in real-time across the globe with our advanced tracking system
          </p>
        </header>
        <ShipmentMap />
      </div>
    </main>
  );
}