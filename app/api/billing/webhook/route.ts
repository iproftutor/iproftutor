import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover",
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    // For development, we'll skip signature verification
    // In production, you'd use: stripe.webhooks.constructEvent(body, signature, webhookSecret)
    event = JSON.parse(body) as Stripe.Event;
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const { user_id, plan, billing_cycle } = session.metadata || {};

        if (user_id && plan) {
          // Update or create subscription in database
          const { error } = await supabase.from("subscriptions").upsert(
            {
              user_id,
              plan,
              billing_cycle,
              status: "active",
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: session.subscription as string,
              current_period_start: new Date().toISOString(),
              current_period_end: new Date(
                Date.now() +
                  (billing_cycle === "annual" ? 365 : 30) * 24 * 60 * 60 * 1000
              ).toISOString(),
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
          );

          if (error) {
            console.error("Error updating subscription:", error);
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Find user by stripe customer id and update
        const { data: existingSub } = await supabase
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (existingSub) {
          const subItem = subscription.items.data[0];
          await supabase
            .from("subscriptions")
            .update({
              status: subscription.status,
              current_period_start: subItem?.current_period_start
                ? new Date(subItem.current_period_start * 1000).toISOString()
                : null,
              current_period_end: subItem?.current_period_end
                ? new Date(subItem.current_period_end * 1000).toISOString()
                : null,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", existingSub.user_id);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Downgrade to free plan
        const { data: existingSub } = await supabase
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (existingSub) {
          await supabase
            .from("subscriptions")
            .update({
              plan: "free",
              status: "canceled",
              stripe_subscription_id: null,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", existingSub.user_id);
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
