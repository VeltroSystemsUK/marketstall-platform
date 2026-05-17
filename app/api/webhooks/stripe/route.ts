import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import type Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 },
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "payment_intent.succeeded": {
      const pi = event.data.object as Stripe.PaymentIntent;
      console.log(`[Webhook] Payment succeeded: ${pi.id}`);
      // TODO: Update order status to 'confirmed' in Firestore
      // TODO: Trigger producer notification email via SendGrid
      // TODO: Create Stripe transfer to producer (minus commission)
      break;
    }

    case "payment_intent.payment_failed": {
      const pi = event.data.object as Stripe.PaymentIntent;
      console.log(`[Webhook] Payment failed: ${pi.id}`);
      // TODO: Update order status to 'cancelled'
      // TODO: Notify consumer
      break;
    }

    case "account.updated": {
      // Stripe Connect producer account updated
      const account = event.data.object as Stripe.Account;
      console.log(`[Webhook] Connect account updated: ${account.id}`);
      // TODO: Update producer's stripeConnectId / onboarding status in Firestore
      break;
    }

    default:
      // Unhandled event type — ignore
      break;
  }

  return NextResponse.json({ received: true });
}

// App Router Route Handlers receive the raw body by default — no bodyParser config needed.
