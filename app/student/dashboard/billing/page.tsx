"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  CreditCard,
  Check,
  Sparkles,
  Mic,
  Video,
  BookOpen,
  MessageSquare,
  Zap,
  Crown,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Code2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

// Development mode - when true, all features are enabled
const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === "true";

interface Subscription {
  plan: string;
  status: string;
  billing_cycle?: string;
  current_period_end?: string;
}

const PLANS = [
  {
    id: "free",
    name: "Free",
    price_monthly: 0,
    price_annual: 0,
    description: "Get started with basic features",
    features: [
      "1 topic access",
      "10 flashcards",
      "20 questions/month",
      "1 mid-term + 1 final exam",
    ],
    icon: BookOpen,
    color: "gray",
    popular: false,
  },
  {
    id: "basic",
    name: "Basic",
    price_monthly: 15,
    price_annual: 153,
    description: "Full access with text AI tutor",
    features: [
      "Full content access",
      "Unlimited flashcards",
      "Unlimited questions",
      "iProf Tutor (Text AI)",
      "All exams included",
    ],
    icon: MessageSquare,
    color: "blue",
    popular: false,
  },
  {
    id: "basic_voice",
    name: "Basic + Voice",
    price_monthly: 25,
    price_annual: 255,
    description: "Voice-enabled AI learning",
    features: [
      "Everything in Basic",
      "Voice-enabled AI tutor",
      "Speech-to-text input",
      "Audio explanations",
      "OpenAI voice integration",
    ],
    icon: Mic,
    color: "purple",
    popular: true,
  },
  {
    id: "premium",
    name: "Premium",
    price_monthly: 35,
    price_annual: 357,
    description: "Ultimate learning experience",
    features: [
      "Everything in Basic + Voice",
      "AI Face Avatar tutor",
      "Interactive video lessons",
      "Priority support",
      "Synthesia/Heygen integration",
    ],
    icon: Video,
    color: "orange",
    popular: false,
  },
];

function BillingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">(
    "monthly"
  );
  const supabase = createClient();

  const success = searchParams.get("success");
  const canceled = searchParams.get("canceled");

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const response = await fetch("/api/billing");
      if (response.ok) {
        const data = await response.json();
        setSubscription(data.subscription);
      }
    } catch (error) {
      console.error("Error fetching subscription:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId: string) => {
    if (planId === "free") return;

    setCheckoutLoading(planId);
    try {
      const response = await fetch("/api/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: planId,
          billing_cycle: billingCycle,
        }),
      });

      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      } else {
        console.error("Failed to create checkout session");
      }
    } catch (error) {
      console.error("Checkout error:", error);
    } finally {
      setCheckoutLoading(null);
    }
  };

  const getColorClasses = (color: string, isActive: boolean) => {
    const colors: Record<
      string,
      { bg: string; border: string; text: string; button: string }
    > = {
      gray: {
        bg: isActive ? "bg-gray-50" : "bg-white",
        border: isActive ? "border-gray-400" : "border-gray-200",
        text: "text-gray-600",
        button: "bg-gray-100 text-gray-700 hover:bg-gray-200",
      },
      blue: {
        bg: isActive ? "bg-blue-50" : "bg-white",
        border: isActive ? "border-blue-400" : "border-gray-200",
        text: "text-blue-600",
        button: "bg-blue-600 text-white hover:bg-blue-700",
      },
      purple: {
        bg: isActive ? "bg-purple-50" : "bg-white",
        border: isActive ? "border-purple-400" : "border-gray-200",
        text: "text-purple-600",
        button: "bg-purple-600 text-white hover:bg-purple-700",
      },
      orange: {
        bg: isActive ? "bg-orange-50" : "bg-white",
        border: isActive ? "border-orange-400" : "border-gray-200",
        text: "text-orange-600",
        button: "bg-orange-600 text-white hover:bg-orange-700",
      },
    };
    return colors[color] || colors.gray;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-[#0794d4] animate-spin mx-auto mb-3" />
          <p className="text-gray-500">Loading billing information...</p>
        </div>
      </div>
    );
  }

  // In dev mode, show "No Plan" but all features are enabled
  const currentPlan = DEV_MODE ? "dev" : subscription?.plan || "free";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/student/dashboard">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Success/Cancel Messages */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-medium text-green-800">Payment successful!</p>
              <p className="text-sm text-green-600">
                Your subscription has been activated. Enjoy your new features!
              </p>
            </div>
          </div>
        )}

        {canceled && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3">
            <XCircle className="w-5 h-5 text-yellow-600" />
            <div>
              <p className="font-medium text-yellow-800">Payment canceled</p>
              <p className="text-sm text-yellow-600">
                Your subscription was not changed. Feel free to try again when
                ready.
              </p>
            </div>
          </div>
        )}

        {/* Page Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-2">
            <CreditCard className="w-8 h-8 text-[#0794d4]" />
            Billing & Subscription
          </h1>
          <p className="text-gray-500 mt-2">
            Choose the plan that fits your learning needs
          </p>
        </div>

        {/* Current Plan */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Current Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 ${
                    DEV_MODE ? "bg-green-100" : "bg-[#0794d4]/10"
                  } rounded-xl flex items-center justify-center`}
                >
                  {DEV_MODE ? (
                    <Code2 className="w-6 h-6 text-green-600" />
                  ) : currentPlan === "premium" ? (
                    <Crown className="w-6 h-6 text-[#0794d4]" />
                  ) : currentPlan === "basic_voice" ? (
                    <Mic className="w-6 h-6 text-[#0794d4]" />
                  ) : currentPlan === "basic" ? (
                    <MessageSquare className="w-6 h-6 text-[#0794d4]" />
                  ) : (
                    <BookOpen className="w-6 h-6 text-[#0794d4]" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 capitalize">
                    {DEV_MODE
                      ? "Development Mode"
                      : `${currentPlan.replace("_", " + ")} Plan`}
                  </p>
                  <p className="text-sm text-gray-500">
                    {DEV_MODE
                      ? "All features enabled for development"
                      : subscription?.status === "active"
                      ? "Active subscription"
                      : "No active subscription"}
                  </p>
                </div>
              </div>
              {DEV_MODE && (
                <Badge className="bg-green-100 text-green-700">
                  All Features Unlocked
                </Badge>
              )}
              {!DEV_MODE && subscription?.current_period_end && (
                <Badge variant="secondary">
                  Renews{" "}
                  {new Date(
                    subscription.current_period_end
                  ).toLocaleDateString()}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Billing Cycle Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-full p-1 border border-gray-200 inline-flex">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                billingCycle === "monthly"
                  ? "bg-[#0794d4] text-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("annual")}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                billingCycle === "annual"
                  ? "bg-[#0794d4] text-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Annual
              <Badge className="bg-green-100 text-green-700 text-xs">
                Save 15%
              </Badge>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PLANS.map((plan) => {
            const isActive = currentPlan === plan.id;
            const colors = getColorClasses(plan.color, isActive);
            const Icon = plan.icon;
            const price =
              billingCycle === "monthly"
                ? plan.price_monthly
                : plan.price_annual;

            return (
              <Card
                key={plan.id}
                className={`relative overflow-hidden transition-all ${
                  colors.bg
                } ${colors.border} border-2 ${
                  plan.popular ? "ring-2 ring-purple-500 ring-offset-2" : ""
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0">
                    <div className="bg-purple-600 text-white text-xs font-semibold px-3 py-1 rounded-bl-lg flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Popular
                    </div>
                  </div>
                )}

                {isActive && (
                  <div className="absolute top-0 left-0">
                    <div className="bg-green-600 text-white text-xs font-semibold px-3 py-1 rounded-br-lg flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Current
                    </div>
                  </div>
                )}

                <CardHeader className="pt-8">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${colors.text} bg-current/10`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-gray-900">
                        ${price}
                      </span>
                      {price > 0 && (
                        <span className="text-gray-500">
                          /{billingCycle === "monthly" ? "mo" : "yr"}
                        </span>
                      )}
                    </div>
                    {billingCycle === "annual" && price > 0 && (
                      <p className="text-sm text-green-600 mt-1">
                        Save ${plan.price_monthly * 12 - plan.price_annual}/year
                      </p>
                    )}
                  </div>

                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <Check
                          className={`w-4 h-4 shrink-0 mt-0.5 ${colors.text}`}
                        />
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {plan.id === "free" ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      disabled={isActive}
                    >
                      {isActive ? "Current Plan" : "Free Forever"}
                    </Button>
                  ) : (
                    <Button
                      className={`w-full ${colors.button}`}
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={isActive || checkoutLoading !== null}
                    >
                      {checkoutLoading === plan.id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Processing...
                        </>
                      ) : isActive ? (
                        "Current Plan"
                      ) : (
                        <>
                          <Zap className="w-4 h-4 mr-2" />
                          Pay with Stripe
                        </>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Currency Note */}
        <p className="text-center text-sm text-gray-500 mt-8">
          All prices are in SGD (Singapore Dollars). Pricing may vary by
          country.
        </p>

        {/* Features Comparison */}
        <Card className="mt-12">
          <CardHeader>
            <CardTitle className="text-lg">Features Comparison</CardTitle>
            <CardDescription>See what's included in each plan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="py-3 text-left font-medium text-gray-500">
                      Feature
                    </th>
                    <th className="py-3 text-center font-medium text-gray-500">
                      Free
                    </th>
                    <th className="py-3 text-center font-medium text-gray-500">
                      Basic
                    </th>
                    <th className="py-3 text-center font-medium text-gray-500">
                      Basic + Voice
                    </th>
                    <th className="py-3 text-center font-medium text-gray-500">
                      Premium
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="py-3 text-gray-700">Content Access</td>
                    <td className="py-3 text-center">1 topic</td>
                    <td className="py-3 text-center text-green-600">Full</td>
                    <td className="py-3 text-center text-green-600">Full</td>
                    <td className="py-3 text-center text-green-600">Full</td>
                  </tr>
                  <tr>
                    <td className="py-3 text-gray-700">Flashcards</td>
                    <td className="py-3 text-center">10</td>
                    <td className="py-3 text-center text-green-600">
                      Unlimited
                    </td>
                    <td className="py-3 text-center text-green-600">
                      Unlimited
                    </td>
                    <td className="py-3 text-center text-green-600">
                      Unlimited
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 text-gray-700">Questions/Month</td>
                    <td className="py-3 text-center">20</td>
                    <td className="py-3 text-center text-green-600">
                      Unlimited
                    </td>
                    <td className="py-3 text-center text-green-600">
                      Unlimited
                    </td>
                    <td className="py-3 text-center text-green-600">
                      Unlimited
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 text-gray-700">Text AI Tutor</td>
                    <td className="py-3 text-center">—</td>
                    <td className="py-3 text-center">
                      <Check className="w-5 h-5 text-green-600 mx-auto" />
                    </td>
                    <td className="py-3 text-center">
                      <Check className="w-5 h-5 text-green-600 mx-auto" />
                    </td>
                    <td className="py-3 text-center">
                      <Check className="w-5 h-5 text-green-600 mx-auto" />
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 text-gray-700">Voice AI Tutor</td>
                    <td className="py-3 text-center">—</td>
                    <td className="py-3 text-center">—</td>
                    <td className="py-3 text-center">
                      <Check className="w-5 h-5 text-green-600 mx-auto" />
                    </td>
                    <td className="py-3 text-center">
                      <Check className="w-5 h-5 text-green-600 mx-auto" />
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 text-gray-700">AI Avatar Tutor</td>
                    <td className="py-3 text-center">—</td>
                    <td className="py-3 text-center">—</td>
                    <td className="py-3 text-center">—</td>
                    <td className="py-3 text-center">
                      <Check className="w-5 h-5 text-green-600 mx-auto" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-[#0794d4] animate-spin mx-auto mb-3" />
            <p className="text-gray-500">Loading billing information...</p>
          </div>
        </div>
      }
    >
      <BillingContent />
    </Suspense>
  );
}
