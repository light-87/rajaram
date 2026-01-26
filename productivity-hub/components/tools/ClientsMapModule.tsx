"use client";

import { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
import { ProductBrand, BusinessClient } from "@/types/database";
import { Search, Loader2, ExternalLink, X } from "lucide-react";

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false }) as any;
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false }) as any;
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false }) as any;
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), { ssr: false }) as any;

interface MapModuleProps {
    clients: BusinessClient[];
    brand?: ProductBrand | "all";
}

export default function ClientsMapModule({ clients, brand = "all" }: MapModuleProps) {
    const [L, setL] = useState<any>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        // Load Leaflet on client side
        import("leaflet").then((leaflet) => {
            setL(leaflet);

            // Fix for default marker icons in React Leaflet
            delete (leaflet.Icon.Default.prototype as any)._getIconUrl;
            leaflet.Icon.Default.mergeOptions({
                iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
                iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
                shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
            });
            setIsLoaded(true);
        });
    }, []);

    // Filter clients based on search query
    const filteredClients = useMemo(() => {
        if (!searchQuery.trim()) return clients;

        const query = searchQuery.toLowerCase();
        return clients.filter(client =>
            client.name?.toLowerCase().includes(query) ||
            client.address?.toLowerCase().includes(query) ||
            client.company?.toLowerCase().includes(query)
        );
    }, [clients, searchQuery]);

    // Calculate map bounds based on filtered clients with valid coordinates
    const clientsWithCoords = useMemo(() => {
        return filteredClients.filter(c => c.latitude && c.longitude);
    }, [filteredClients]);

    if (!isLoaded) {
        return (
            <div className="h-[500px] w-full bg-background-card border border-border/50 rounded-2xl flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-pink animate-spin" />
            </div>
        );
    }

    // Default center (can be tuned to user's location)
    const center: [number, number] = [20.5937, 78.9629]; // India center

    return (
        <div className="space-y-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                <input
                    type="text"
                    placeholder="Search by name, address, or company..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 bg-background-card border border-border/50 rounded-xl focus:border-pink/50 outline-none transition-all"
                />
                {searchQuery && (
                    <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {searchQuery && (
                <p className="text-xs text-text-secondary">
                    Showing {clientsWithCoords.length} of {filteredClients.length} matching clients on map
                    {filteredClients.length !== clients.length && ` (filtered from ${clients.length} total)`}
                </p>
            )}

            <div className="h-[600px] w-full rounded-2xl overflow-hidden border border-border/50 z-0">
                <MapContainer center={center} zoom={5} style={{ height: "100%", width: "100%" }}>
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {clientsWithCoords.map((client) => {
                        // Create custom icon based on brand
                        const icon = new L.Icon({
                            iconUrl: client.brand === 'Kuberbook'
                                ? 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png'
                                : 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png',
                            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                            iconSize: [25, 41],
                            iconAnchor: [12, 41],
                            popupAnchor: [1, -34],
                            shadowSize: [41, 41]
                        });

                        return (
                            <Marker
                                key={client.id}
                                position={[Number(client.latitude), Number(client.longitude)]}
                                icon={icon}
                            >
                                <Popup>
                                    <div className="p-1">
                                        <h4 className="font-bold text-lg m-0">{client.name}</h4>
                                        <p className="text-sm text-gray-600 m-0">{client.brand}</p>
                                        <p className="text-xs text-gray-500 mt-1">{client.address}</p>
                                        <div className="mt-2 space-y-2">
                                            <div className="text-xs font-bold text-green-600">
                                                Profit: ₹{((Number(client.setup_profit) || 0) + (Number(client.recurring_profit) || 0)).toLocaleString()}
                                            </div>
                                            {client.google_maps_link && (
                                                <a
                                                    href={client.google_maps_link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1 text-[10px] text-sky hover:underline font-bold"
                                                >
                                                    <ExternalLink className="w-3 h-3" /> Navigation
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    })}
                </MapContainer>
            </div>

            <div className="flex gap-4">
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                    <div className="w-3 h-3 rounded-full bg-blue-500" /> Kuberbook
                </div>
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                    <div className="w-3 h-3 rounded-full bg-yellow-500" /> Solar Vendor
                </div>
            </div>
        </div>
    );
}
