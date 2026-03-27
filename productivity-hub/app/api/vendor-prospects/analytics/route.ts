import { sql } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const state = searchParams.get("state") || "";

        const stateFilter = state ? "WHERE state = $1" : "";
        const stateParams = state ? [state] : [];

        // 1. District distribution
        const districtDist = await sql.query(
            `SELECT district, COUNT(*)::int as count,
                    COALESCE(SUM(installations), 0)::int as total_installations,
                    COALESCE(SUM(capacity_kwp), 0)::int as total_capacity
             FROM vendor_prospects ${stateFilter}
             GROUP BY district ORDER BY count DESC`,
            stateParams
        );

        // 2. Installation tier breakdown
        const tierBreakdown = await sql.query(
            `SELECT
                CASE
                    WHEN installations >= 500 THEN '500+'
                    WHEN installations >= 200 THEN '200-499'
                    WHEN installations >= 100 THEN '100-199'
                    WHEN installations >= 10 THEN '10-99'
                    ELSE '<10'
                END as tier,
                COUNT(*)::int as count
             FROM vendor_prospects ${stateFilter}
             GROUP BY
                CASE
                    WHEN installations >= 500 THEN '500+'
                    WHEN installations >= 200 THEN '200-499'
                    WHEN installations >= 100 THEN '100-199'
                    WHEN installations >= 10 THEN '10-99'
                    ELSE '<10'
                END
             ORDER BY
                MIN(installations) DESC`,
            stateParams
        );

        // 3. State summary
        const stateSummary = await sql.query(
            `SELECT state, COUNT(*)::int as count,
                    COALESCE(SUM(installations), 0)::int as total_installations
             FROM vendor_prospects
             GROUP BY state ORDER BY count DESC`,
            []
        );

        // 4. Import status
        const importStatus = await sql.query(
            `SELECT
                COUNT(*) FILTER (WHERE is_imported = true)::int as imported,
                COUNT(*) FILTER (WHERE is_imported = false)::int as available,
                COUNT(*)::int as total
             FROM vendor_prospects ${stateFilter}`,
            stateParams
        );

        // 5. Temperature breakdown (hot/warm/cold)
        const temperature = await sql.query(
            `SELECT
                COUNT(*) FILTER (WHERE installations >= 500)::int as hot,
                COUNT(*) FILTER (WHERE installations >= 100 AND installations < 500)::int as warm,
                COUNT(*) FILTER (WHERE installations < 100)::int as cold
             FROM vendor_prospects ${stateFilter}`,
            stateParams
        );

        // 6. Compute 4-intern territory split using greedy bin-packing
        const territorySplit = computeTerritorySplit(
            (districtDist || []) as { district: string; count: number; total_installations: number }[]
        );

        return NextResponse.json({
            districtDistribution: districtDist || [],
            tierBreakdown: tierBreakdown || [],
            stateSummary: stateSummary || [],
            importStatus: importStatus?.[0] || { imported: 0, available: 0, total: 0 },
            temperature: temperature?.[0] || { hot: 0, warm: 0, cold: 0 },
            territorySplit,
        });
    } catch (error) {
        console.error("Analytics error:", error);
        return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
    }
}

function computeTerritorySplit(districts: { district: string; count: number; total_installations: number }[]) {
    if (districts.length === 0) return [];

    // Sort by count descending
    const sorted = [...districts].sort((a, b) => b.count - a.count);

    // 4 intern buckets
    const interns = [
        { label: "Intern 1", districts: [] as string[], vendorCount: 0, installationCount: 0 },
        { label: "Intern 2", districts: [] as string[], vendorCount: 0, installationCount: 0 },
        { label: "Intern 3", districts: [] as string[], vendorCount: 0, installationCount: 0 },
        { label: "Intern 4", districts: [] as string[], vendorCount: 0, installationCount: 0 },
    ];

    // Greedy: assign each district to intern with lowest vendor count
    for (const d of sorted) {
        const minIntern = interns.reduce((min, curr) =>
            curr.vendorCount < min.vendorCount ? curr : min
        );
        minIntern.districts.push(d.district);
        minIntern.vendorCount += d.count;
        minIntern.installationCount += d.total_installations;
    }

    return interns;
}
