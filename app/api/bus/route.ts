import { NextResponse } from "next/server";
import { getBusDepartures } from "@/lib/bus";

export async function GET() {
  try {
    const departures = await getBusDepartures();
    return NextResponse.json({ departures });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Busabfahrten konnten nicht geladen werden." },
      { status: 500 }
    );
  }
}