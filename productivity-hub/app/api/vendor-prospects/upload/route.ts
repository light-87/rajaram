import { sql } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

// Extend Vercel serverless function timeout to 60 seconds
export const maxDuration = 60;

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

const FIELDS_PER_ROW = 10;

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

        // Separate valid and invalid rows up front
        const validRows: {
            state: string; district: string; company_name: string;
            brand_name: string | null; contact_person: string | null;
            email: string | null; phone: string | null;
            installations: number; capacity_kwp: number; scraped_at: string | null;
        }[] = [];

        for (const row of rows) {
            if (!row.company_name || !row.state || !row.district) {
                skipped++;
                continue;
            }
            validRows.push({
                state: row.state.trim().toUpperCase(),
                district: row.district.trim(),
                company_name: row.company_name.trim(),
                brand_name: row.brand_name && row.brand_name !== ':' ? row.brand_name.trim() : null,
                contact_person: row.contact_person && row.contact_person !== ':' ? row.contact_person.trim() : null,
                email: row.email?.trim() || null,
                phone: row.phone?.trim() || null,
                installations: parseInt(String(row.installations)) || 0,
                capacity_kwp: parseInt(String(row.capacity_kwp)) || 0,
                scraped_at: row.scraped_at || null,
            });
        }

        // Batch insert all valid rows in one query
        if (validRows.length > 0) {
            try {
                const params: unknown[] = [];
                const valueClauses: string[] = [];

                validRows.forEach((r, i) => {
                    const base = i * FIELDS_PER_ROW;
                    valueClauses.push(
                        `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8}, $${base + 9}, $${base + 10}, false)`
                    );
                    params.push(
                        r.state, r.district, r.company_name, r.brand_name,
                        r.contact_person, r.email, r.phone,
                        r.installations, r.capacity_kwp, r.scraped_at
                    );
                });

                const query = `
                    INSERT INTO vendor_prospects
                        (state, district, company_name, brand_name, contact_person, email, phone, installations, capacity_kwp, scraped_at, is_imported)
                    VALUES ${valueClauses.join(", ")}
                    ON CONFLICT (company_name, phone, district)
                    DO UPDATE SET
                        installations = EXCLUDED.installations,
                        capacity_kwp = EXCLUDED.capacity_kwp,
                        email = EXCLUDED.email,
                        contact_person = EXCLUDED.contact_person,
                        brand_name = EXCLUDED.brand_name,
                        scraped_at = EXCLUDED.scraped_at`;

                await sql.query(query, params);
                inserted = validRows.length;
            } catch (err: any) {
                console.error("Batch insert error:", err);
                errors.push(err.message || "Batch insert failed");
                // Fall back to row-by-row so we still insert what we can
                for (const r of validRows) {
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
                            [r.state, r.district, r.company_name, r.brand_name, r.contact_person, r.email, r.phone, r.installations, r.capacity_kwp, r.scraped_at]
                        );
                        inserted++;
                    } catch (rowErr: any) {
                        skipped++;
                        if (errors.length < 5) {
                            errors.push(`${r.company_name}: ${rowErr.message || "Unknown error"}`);
                        }
                    }
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
