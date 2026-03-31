import { NextResponse } from "next/server";
import { getNextTrashPickups } from "@/lib/trash";

export async function GET() {
  try {
    const pickups = await getNextTrashPickups(6);
    return NextResponse.json({ pickups });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Mülltermine konnten nicht geladen werden." },
      { status: 500 }
    );
  }
}