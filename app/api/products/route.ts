import { NextRequest, NextResponse } from "next/server";
import { MOCK_PRODUCTS } from "@/lib/mock-data";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const category = searchParams.get("category");
  const producerId = searchParams.get("producerId");
  const seasonal = searchParams.get("seasonal");
  const featured = searchParams.get("featured");

  let products = MOCK_PRODUCTS.filter((p) => p.available);

  if (category) products = products.filter((p) => p.category === category);
  if (producerId)
    products = products.filter((p) => p.producerId === producerId);
  if (seasonal === "true") products = products.filter((p) => p.seasonal);
  if (featured === "true") products = products.filter((p) => p.featured);

  return NextResponse.json({ products });
}
