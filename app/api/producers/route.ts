import { NextRequest, NextResponse } from "next/server";
import { MOCK_PRODUCERS } from "@/lib/mock-data";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status");
  const category = searchParams.get("category");

  let producers = MOCK_PRODUCERS;

  if (status) {
    producers = producers.filter((p) => p.status === status);
  }
  if (category) {
    producers = producers.filter((p) => p.categories.includes(category));
  }

  // Strip sensitive fields before returning
  const safe = producers.map(({ stripeConnectId: _sc, ...rest }) => rest);

  return NextResponse.json({ producers: safe });
}
