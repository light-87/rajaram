import { supabase, sql } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const { vendorId, employeeId, employeeUsername } = await request.json();

        if (!vendorId || !employeeId) {
            return NextResponse.json(
                { error: "vendorId and employeeId are required" },
                { status: 400 }
            );
        }

        // 1. Fetch the vendor prospect
        const vendorResult = await sql.query(
            `SELECT * FROM vendor_prospects WHERE id = $1`,
            [vendorId]
        );

        const vendor = vendorResult[0];

        if (!vendor) {
            return NextResponse.json(
                { error: "Vendor prospect not found" },
                { status: 404 }
            );
        }

        if (vendor.is_imported) {
            return NextResponse.json(
                { error: "This vendor has already been imported as a lead" },
                { status: 409 }
            );
        }

        // 2. Build notes with vendor details
        const notesParts = [];
        if (vendor.installations) notesParts.push(`Installations: ${vendor.installations}`);
        if (vendor.capacity_kwp) notesParts.push(`Capacity: ${vendor.capacity_kwp} kWp`);
        if (vendor.contact_person && vendor.contact_person !== ':') notesParts.push(`Contact: ${vendor.contact_person}`);
        if (vendor.brand_name && vendor.brand_name !== ':') notesParts.push(`Brand: ${vendor.brand_name}`);
        const notes = notesParts.join(" | ");

        // 3. Create the lead
        const { data: newLead, error: leadError } = await supabase
            .from("leads")
            .insert({
                customer_name: vendor.company_name,
                phone: vendor.phone || null,
                email: vendor.email || null,
                address: `${vendor.district}, ${vendor.state}`,
                brand: "Solar Vendor",
                latitude: 0,
                longitude: 0,
                status: "new",
                created_by: employeeId,
                notes,
                vendor_prospect_id: vendorId,
            })
            .select()
            .single();

        if (leadError) {
            console.error("Error creating lead:", leadError);
            return NextResponse.json(
                { error: "Failed to create lead: " + (leadError as any).message },
                { status: 500 }
            );
        }

        // 4. Mark vendor as imported
        await sql.query(
            `UPDATE vendor_prospects SET is_imported = true, imported_at = NOW(), imported_by = $1 WHERE id = $2`,
            [employeeId, vendorId]
        );

        // 5. Log activity
        try {
            await sql.query(
                `INSERT INTO activity_logs (action, details, performed_by, employee_id) VALUES ($1, $2, $3, $4)`,
                [
                    "Vendor Imported as Lead",
                    `Vendor "${vendor.company_name}" from ${vendor.district}, ${vendor.state} imported as lead`,
                    employeeUsername || "System",
                    employeeId,
                ]
            );
        } catch {
            // Activity logging is non-critical
        }

        return NextResponse.json({
            success: true,
            lead: newLead,
            message: `"${vendor.company_name}" imported as lead successfully`,
        });
    } catch (error) {
        console.error("Unexpected error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
