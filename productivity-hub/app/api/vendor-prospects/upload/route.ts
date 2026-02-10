import { sql } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

interface VendorRow {
    state: string;
    district: string;
    company_name: string;
    brand_name?: string;
    contact_person?: string;
    email?: string;
    phone?: string;
    installations?: number;
    capacity_kwp?: number;
    scraped_at?: string;
}

export async function POST(request: NextRequest) {
    try {
        const { rows } = await request.json() as { rows: VendorRow[] };

        if (!rows || !Array.isArray(rows) || rows.length === 0) {
            return NextResponse.json(
                { error: "No rows provided" },
                { status: 400 }
            );
        }

        let inserted = 0;
        let skipped = 0;
        const errors: string[] = [];

        // Process rows one at a time with upsert SQL
        for (const row of rows) {
            if (!row.company_name || !row.state || !row.district) {
                skipped++;
                continue;
            }

            const state = row.state.trim().toUpperCase();
            const district = row.district.trim();
            const company_name = row.company_name.trim();
            const brand_name = row.brand_name && row.brand_name !== ':' ? row.brand_name.trim() : null;
            const contact_person = row.contact_person && row.contact_person !== ':' ? row.contact_person.trim() : null;
            const email = row.email?.trim() || null;
            const phone = row.phone?.trim() || null;
            const installations = parseInt(String(row.installations)) || 0;
            const capacity_kwp = parseInt(String(row.capacity_kwp)) || 0;
            const scraped_at = row.scraped_at || null;

            try {
                await sql.query(
                    `INSERT INTO vendor_prospects (state, district, company_name, brand_name, contact_person, email, phone, installations, capacity_kwp, scraped_at, is_imported)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, false)
                     ON CONFLICT (company_name, phone, district) 
                     DO UPDATE SET 
                        installations = EXCLUDED.installations,
                        capacity_kwp = EXCLUDED.capacity_kwp,
                        email = EXCLUDED.email,
                        contact_person = EXCLUDED.contact_person,
                        brand_name = EXCLUDED.brand_name,
                        scraped_at = EXCLUDED.scraped_at`,
                    [state, district, company_name, brand_name, contact_person, email, phone, installations, capacity_kwp, scraped_at]
                );
                inserted++;
            } catch (err: any) {
                skipped++;
                if (errors.length < 5) {
                    errors.push(`${company_name}: ${err.message || "Unknown error"}`);
                }
            }
        }

        return NextResponse.json({
            success: true,
            inserted,
            skipped,
            total: rows.length,
            errors: errors.length > 0 ? errors : undefined,
        });
    } catch (error) {
        console.error("Unexpected error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
