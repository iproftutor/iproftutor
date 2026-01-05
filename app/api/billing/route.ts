import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover",
});

// Plan configurations
export const PLANS = {
  free: {
    name: "Free",
    price_monthly: 0,
    price_annual: 0,
    features: [
      "1 topic access",
      "10 flashcards",
      "20 questions/month",
      "1 mid-term + 1 final exam",
    ],
  },
  basic: {
    name: "Basic",
    price_monthly: 15,
    price_annual: 153, // 15% off
    stripe_price_monthly: "price_basic_monthly", // Will be created in Stripe
    stripe_price_annual: "price_basic_annual",
    features: [
      "Full content access",
      "Unlimited flashcards",
      "Unlimited questions",
      "iProf Tutor (Text AI)",
      "All exams included",
    ],
  },
  basic_voice: {
    name: "Basic + Voice",
    price_monthly: 25,
    price_annual: 255, // 15% off
    stripe_price_monthly: "price_basic_voice_monthly",
    stripe_price_annual: "price_basic_voice_annual",
    features: [
      "Everything in Basic",
      "Voice-enabled AI tutor",
      "Speech-to-text input",
      "Audio explanations",
      "OpenAI voice integration",
    ],
  },
  premium: {
    name: "Premium",
    price_monthly: 35,
    price_annual: 357, // 15% off
    stripe_price_monthly: "price_premium_monthly",
    stripe_price_annual: "price_premium_annual",
    features: [
      "Everything in Basic + Voice",
      "AI Face Avatar tutor",
      "Interactive video lessons",
      "Priority support",
      "Synthesia/Heygen integration",
    ],
  },
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { plan, billing_cycle } = await request.json();

    if (!plan || !["basic", "basic_voice", "premium"].includes(plan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    if (!billing_cycle || !["monthly", "annual"].includes(billing_cycle)) {
      return NextResponse.json(
        { error: "Invalid billing cycle" },
        { status: 400 }
      );
    }

    const selectedPlan = PLANS[plan as keyof typeof PLANS];
    const amount =
      billing_cycle === "monthly"
        ? selectedPlan.price_monthly
        : selectedPlan.price_annual;

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "sgd",
            product_data: {
              name: `iProf Tutor - ${selectedPlan.name} Plan`,
              description: `${
                billing_cycle === "monthly" ? "Monthly" : "Annual"
              } subscription`,
            },
            unit_amount: amount * 100, // Stripe expects cents
            recurring: {
              interval: billing_cycle === "monthly" ? "month" : "year",
            },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${request.nextUrl.origin}/student/dashboard/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.nextUrl.origin}/student/dashboard/billing?canceled=true`,
      customer_email: user.email,
      metadata: {
        user_id: user.id,
        plan: plan,
        billing_cycle: billing_cycle,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's subscription from database
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .single();

    return NextResponse.json({
      subscription: subscription || { plan: "free", status: "active" },
      plans: PLANS,
    });
  } catch (error) {
    console.error("Get subscription error:", error);
    return NextResponse.json(
      { error: "Failed to get subscription" },
      { status: 500 }
    );
  }
}
