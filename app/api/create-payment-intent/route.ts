import { NextRequest, NextResponse } from "next/server";
import { stripe, calculateCommission } from "@/lib/stripe";
import type { BasketItem } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items, total } = body as { items: BasketItem[]; total: number };

    if (!items?.length) {
      return NextResponse.json({ error: "No items in order" }, { status: 400 });
    }

    // Calculate amounts server-side — never trust client totals
    const subtotal = items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0,
    );
    const commission = calculateCommission(subtotal);
    const deliveryFee = 395;
    const serverTotal = subtotal + deliveryFee;

    // Sanity check — allow ±1p for rounding
    if (Math.abs(serverTotal - total) > 1) {
      return NextResponse.json(
        { error: "Order total mismatch" },
        { status: 400 },
      );
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: serverTotal,
      currency: "gbp",
      automatic_payment_methods: { enabled: true },
      metadata: {
        commission,
        itemCount: items.length,
        producerIds: [...new Set(items.map((i) => i.product.producerId))].join(
          ",",
        ),
      },
    });

    // In production, create the order in Firestore here and return the real orderId
    const orderId = `order-demo-1`;

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      orderId,
    });
  } catch (err) {
    console.error("create-payment-intent error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
