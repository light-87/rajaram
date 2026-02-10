import { sql } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const { vendorId } = await request.json();

        if (!vendorId) {
            return NextResponse.json(
                { error: "vendorId is required" },
                { status: 400 }
            );
        }

        await sql.query(
            `UPDATE vendor_prospects SET is_imported = false, imported_at = NULL, imported_by = NULL WHERE id = $1`,
            [vendorId]
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error unmarking vendor:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
