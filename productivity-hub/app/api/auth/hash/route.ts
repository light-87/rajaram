import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

/**
 * POST: Hash a password using bcrypt
 */
export async function POST(request: NextRequest) {
    try {
        const { password } = await request.json();

        if (!password || typeof password !== 'string') {
            return NextResponse.json(
                { error: "Password is required" },
                { status: 400 }
            );
        }

        const hash = await bcrypt.hash(password, SALT_ROUNDS);
        return NextResponse.json({ hash });
    } catch (error) {
        console.error("Hash error:", error);
        return NextResponse.json(
            { error: "Failed to hash password" },
            { status: 500 }
        );
    }
}

/**
 * PUT: Verify a password against a bcrypt hash
 */
export async function PUT(request: NextRequest) {
    try {
        const { password, hash } = await request.json();

        if (!password || !hash) {
            return NextResponse.json(
                { error: "Password and hash are required" },
                { status: 400 }
            );
        }

        const valid = await bcrypt.compare(password, hash);
        return NextResponse.json({ valid });
    } catch (error) {
        console.error("Verify error:", error);
        return NextResponse.json(
            { error: "Failed to verify password" },
            { status: 500 }
        );
    }
}
