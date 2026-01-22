import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { hashPassword } from "@/lib/tools-utils";

export async function POST(request: NextRequest) {
    try {
        const { username, password } = await request.json();

        const { data: profile, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("username", username)
            .single();

        if (profile) {
            const incomingHash = await hashPassword(password);
            if (incomingHash === profile.password_hash) {
                return NextResponse.json({ profile });
            }
        }

        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    } catch (error) {
        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
}
