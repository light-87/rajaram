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
 * Now includes employee_id for proper tracking.
 */
export async function logActivity(
    action: string,
    details?: string,
    performedBy?: string,
    employeeId?: string
) {
    try {
        await supabase.from("activity_logs").insert({
            action,
            details,
            performed_by: performedBy,
            employee_id: employeeId
        });
    } catch (error) {
        console.error("Failed to log activity:", error);
    }
}

/**
 * Hash password using bcrypt via API route.
 * Bcrypt must run server-side, so we call an API endpoint.
 */
export async function hashPassword(password: string): Promise<string> {
    const response = await fetch('/api/auth/hash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
    });

    if (!response.ok) {
        throw new Error('Failed to hash password');
    }

    const { hash } = await response.json();
    return hash;
}

/**
 * Verify password against bcrypt hash via API route.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    const response = await fetch('/api/auth/hash', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, hash })
    });

    if (!response.ok) {
        return false;
    }

    const { valid } = await response.json();
    return valid;
}
