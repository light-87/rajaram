import { sql } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const state = searchParams.get("state") || "";
        const district = searchParams.get("district") || "";
        const tier = searchParams.get("tier") || ""; // "500+", "100-499", "<100"

        // Build vendor_prospects WHERE clause
        const conditions: string[] = [];
        const params: any[] = [];
        let paramIdx = 1;

        if (state) {
            conditions.push(`state = $${paramIdx++}`);
            params.push(state);
        }
        if (district) {
            conditions.push(`district = $${paramIdx++}`);
            params.push(district);
        }
        if (tier === "500+") {
            conditions.push(`installations >= 500`);
        } else if (tier === "100-499") {
            conditions.push(`installations >= 100 AND installations < 500`);
        } else if (tier === "<100") {
            conditions.push(`installations < 100`);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

        // 1. District distribution
        const districtDist = await sql.query(
            `SELECT district, COUNT(*)::int as count,
                    COALESCE(SUM(installations), 0)::int as total_installations,
                    COALESCE(SUM(capacity_kwp), 0)::int as total_capacity,
                    COUNT(*) FILTER (WHERE is_imported = true)::int as imported_count
             FROM vendor_prospects ${whereClause}
             GROUP BY district ORDER BY count DESC`,
            params
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
             FROM vendor_prospects ${whereClause}
             GROUP BY
                CASE
                    WHEN installations >= 500 THEN '500+'
                    WHEN installations >= 200 THEN '200-499'
                    WHEN installations >= 100 THEN '100-199'
                    WHEN installations >= 10 THEN '10-99'
                    ELSE '<10'
                END
             ORDER BY MIN(installations) DESC`,
            params
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
             FROM vendor_prospects ${whereClause}`,
            params
        );

        // 5. Temperature breakdown (hot/warm/cold)
        const temperature = await sql.query(
            `SELECT
                COUNT(*) FILTER (WHERE installations >= 500)::int as hot,
                COUNT(*) FILTER (WHERE installations >= 100 AND installations < 500)::int as warm,
                COUNT(*) FILTER (WHERE installations < 100)::int as cold
             FROM vendor_prospects ${whereClause}`,
            params
        );

        // 6. Lead status breakdown - join vendor_prospects with leads via vendor_prospect_id
        // We need leads that came from vendor_prospects matching our filters
        const leadStatusQuery = state
            ? `SELECT
                    l.status,
                    COUNT(*)::int as count
               FROM leads l
               INNER JOIN vendor_prospects vp ON l.vendor_prospect_id = vp.id
               WHERE vp.state = $1 ${district ? `AND vp.district = $2` : ""}
               GROUP BY l.status
               ORDER BY count DESC`
            : `SELECT
                    l.status,
                    COUNT(*)::int as count
               FROM leads l
               INNER JOIN vendor_prospects vp ON l.vendor_prospect_id = vp.id
               GROUP BY l.status
               ORDER BY count DESC`;
        const leadStatusParams = state ? (district ? [state, district] : [state]) : [];
        const leadStatus = await sql.query(leadStatusQuery, leadStatusParams);

        // 7. Converted clients + revenue from vendor-sourced leads
        const clientRevenueQuery = state
            ? `SELECT
                    COUNT(DISTINCT bc.id)::int as client_count,
                    COALESCE(SUM(bc.setup_profit), 0)::numeric as total_setup_profit,
                    COALESCE(SUM(bc.recurring_profit), 0)::numeric as total_recurring_profit,
                    COALESCE(SUM(bc.contract_value), 0)::numeric as total_contract_value
               FROM business_clients bc
               INNER JOIN leads l ON l.status = 'converted'
                   AND l.customer_name = bc.name
               INNER JOIN vendor_prospects vp ON l.vendor_prospect_id = vp.id
               WHERE vp.state = $1 ${district ? `AND vp.district = $2` : ""}`
            : `SELECT
                    COUNT(DISTINCT bc.id)::int as client_count,
                    COALESCE(SUM(bc.setup_profit), 0)::numeric as total_setup_profit,
                    COALESCE(SUM(bc.recurring_profit), 0)::numeric as total_recurring_profit,
                    COALESCE(SUM(bc.contract_value), 0)::numeric as total_contract_value
               FROM business_clients bc
               INNER JOIN leads l ON l.status = 'converted'
                   AND l.customer_name = bc.name
               INNER JOIN vendor_prospects vp ON l.vendor_prospect_id = vp.id`;
        const clientRevenueParams = state ? (district ? [state, district] : [state]) : [];
        const clientRevenue = await sql.query(clientRevenueQuery, clientRevenueParams);

        // 8. Per-district lead status breakdown (for the selected state)
        const districtLeadStatusQuery = state
            ? `SELECT
                    vp.district,
                    l.status,
                    COUNT(*)::int as count
               FROM leads l
               INNER JOIN vendor_prospects vp ON l.vendor_prospect_id = vp.id
               WHERE vp.state = $1 ${district ? `AND vp.district = $2` : ""}
               GROUP BY vp.district, l.status
               ORDER BY vp.district, count DESC`
            : `SELECT
                    vp.district,
                    l.status,
                    COUNT(*)::int as count
               FROM leads l
               INNER JOIN vendor_prospects vp ON l.vendor_prospect_id = vp.id
               GROUP BY vp.district, l.status
               ORDER BY vp.district, count DESC`;
        const districtLeadStatusParams = state ? (district ? [state, district] : [state]) : [];
        const districtLeadStatus = await sql.query(districtLeadStatusQuery, districtLeadStatusParams);

        // 9. Get unique districts for selected state (for filter dropdown)
        const districtsQuery = state
            ? `SELECT DISTINCT district FROM vendor_prospects WHERE state = $1 ORDER BY district`
            : `SELECT DISTINCT district FROM vendor_prospects ORDER BY district`;
        const districtsParams = state ? [state] : [];
        const districts = await sql.query(districtsQuery, districtsParams);

        return NextResponse.json({
            districtDistribution: districtDist || [],
            tierBreakdown: tierBreakdown || [],
            stateSummary: stateSummary || [],
            importStatus: importStatus?.[0] || { imported: 0, available: 0, total: 0 },
            temperature: temperature?.[0] || { hot: 0, warm: 0, cold: 0 },
            leadStatus: leadStatus || [],
            clientRevenue: clientRevenue?.[0] || { client_count: 0, total_setup_profit: 0, total_recurring_profit: 0, total_contract_value: 0 },
            districtLeadStatus: districtLeadStatus || [],
            districts: (districts || []).map((d: any) => d.district),
        });
    } catch (error) {
        console.error("Analytics error:", error);
        return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
    }
}
