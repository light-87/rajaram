import { sql } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const state = searchParams.get("state") || "MAHARASHTRA";
        const district = searchParams.get("district") || "";
        const search = searchParams.get("search") || "";
        const minInstallations = searchParams.get("minInstallations");
        const maxInstallations = searchParams.get("maxInstallations");
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "50");
        const sort = searchParams.get("sort") || "installations_desc";
        const offset = (page - 1) * limit;

        // Map sort parameter to SQL
        const sortMap: Record<string, string> = {
            installations_desc: "installations DESC",
            installations_asc: "installations ASC",
            capacity_desc: "capacity_kwp DESC",
            capacity_asc: "capacity_kwp ASC",
            company_asc: "company_name ASC",
            company_desc: "company_name DESC",
        };
        const orderBy = sortMap[sort] || "installations DESC";

        // Build dynamic WHERE clause
        const conditions: string[] = ["is_imported = false", "state = $1"];
        const params: any[] = [state];
        let paramIndex = 2;

        if (district) {
            conditions.push(`district = $${paramIndex}`);
            params.push(district);
            paramIndex++;
        }

        if (search) {
            conditions.push(`LOWER(company_name) LIKE LOWER($${paramIndex})`);
            params.push(`%${search}%`);
            paramIndex++;
        }

        if (minInstallations) {
            conditions.push(`installations >= $${paramIndex}`);
            params.push(parseInt(minInstallations));
            paramIndex++;
        }

        if (maxInstallations) {
            conditions.push(`installations <= $${paramIndex}`);
            params.push(parseInt(maxInstallations));
            paramIndex++;
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

        // Get total count
        const countResult = await sql.query(
            `SELECT COUNT(*) as total FROM vendor_prospects ${whereClause}`,
            params
        );
        const total = parseInt(countResult[0]?.total || "0");

        // Get paginated data
        const dataResult = await sql.query(
            `SELECT * FROM vendor_prospects ${whereClause} ORDER BY ${orderBy} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
            [...params, limit, offset]
        );

        // Get unique states (non-imported)
        const statesResult = await sql.query(
            `SELECT DISTINCT state FROM vendor_prospects WHERE is_imported = false ORDER BY state`,
            []
        );
        const states = statesResult.map((s: any) => s.state);

        // Get districts for selected state (non-imported)
        const districtsResult = await sql.query(
            `SELECT DISTINCT district FROM vendor_prospects WHERE state = $1 AND is_imported = false ORDER BY district`,
            [state]
        );
        const districts = districtsResult.map((d: any) => d.district);

        return NextResponse.json({
            data: dataResult || [],
            total,
            states,
            districts,
            page,
            limit,
        });
    } catch (error) {
        console.error("Unexpected error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
