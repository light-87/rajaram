import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { pin } = await request.json();
    const correctPin = process.env.APP_PIN || "12345";

    if (pin === correctPin) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
