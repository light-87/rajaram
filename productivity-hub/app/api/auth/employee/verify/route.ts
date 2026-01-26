import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
    try {
        const { username, password } = await request.json();

        if (!username || !password) {
            return NextResponse.json(
                { error: "Username and password are required" },
                { status: 400 }
            );
        }

        const { data: profile, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("username", username)
            .eq("is_active", true)
            .single();

        if (error || !profile) {
            return NextResponse.json(
                { error: "Invalid credentials" },
                { status: 401 }
            );
        }

        // Verify password using bcrypt
        const isValid = await bcrypt.compare(password, profile.password_hash);

        if (!isValid) {
            return NextResponse.json(
                { error: "Invalid credentials" },
                { status: 401 }
            );
        }

        // Remove sensitive data before sending response
        const { password_hash, ...safeProfile } = profile;

        return NextResponse.json({ profile: safeProfile });
    } catch (error) {
        console.error("Auth error:", error);
        return NextResponse.json(
            { error: "Authentication failed" },
            { status: 500 }
        );
    }
}
