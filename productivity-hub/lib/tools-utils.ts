import { supabase } from "./supabase";

/**
 * Geocodes an address string using OpenStreetMap's Nominatim API.
 * Returns [latitude, longitude] or null.
 */
export async function geocodeAddress(address: string): Promise<[number, number] | null> {
    if (!address) return null;

    try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'RajaramHub/1.0'
            }
        });
        const data = await response.json();

        if (data && data.length > 0) {
            return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        }
    } catch (error) {
        console.error("Geocoding error:", error);
    }

    return null;
}

/**
 * Logs an activity to the activity_logs table.
 */
export async function logActivity(
    action: string,
    details?: string,
    performedBy?: string
) {
    try {
        await supabase.from("activity_logs").insert({
            action,
            details,
            performed_by: performedBy // Optional: if null, DB trigger or RLS might handle it
        });
    } catch (error) {
        console.error("Failed to log activity:", error);
    }
}

/**
 * Basic SHA-256 hashing for passwords using Web Crypto API.
 */
export async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}
