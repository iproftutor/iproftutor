"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, Check } from "lucide-react";
import { useState } from "react";

const pricingTiers = [
  {
    name: "Free",
    badge: null,
    description: "For individuals getting started",
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      "Access to basic lessons",
      "Limited AI tutor queries",
      "Progress tracking",
      "Community support",
      "Up to 3 subjects",
    ],
  },
  {
    name: "Basic",
    badge: null,
    description: "For serious learners",
    monthlyPrice: 9,
    yearlyPrice: 7,
    features: [
      "All Free features",
      "Unlimited AI tutor access",
      "All K-12 subjects",
      "Download resources",
      "Priority support",
      "Parent dashboard",
    ],
  },
  {
    name: "Basic + Voice",
    badge: "Popular",
    description: "For interactive learning",
    monthlyPrice: 15,
    yearlyPrice: 12,
    features: [
      "All Basic features",
      "Voice-enabled AI tutor",
      "Real-time pronunciation",
      "Speech practice tools",
      "Advanced analytics",
      "Custom learning paths",
    ],
  },
  {
    name: "Premium",
    badge: null,
    description: "For schools & families",
    monthlyPrice: 25,
    yearlyPrice: 20,
    features: [
      "All Basic + Voice features",
      "Multiple student profiles",
      "Teacher collaboration tools",
      "Advanced reporting",
      "1-on-1 tutoring sessions",
      "Dedicated support",
      "Custom curriculum",
    ],
  },
];

export default function Pricing() {
  const [isYearly, setIsYearly] = useState(true);

  return (
    <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-4 flex justify-center"
          >
            <Badge className="bg-[#0794d4]/10 text-[#0794d4] hover:bg-[#0794d4]/20 rounded-full px-4 py-1.5 text-sm font-medium uppercase tracking-wider inline-flex items-center gap-2">
              <DollarSign size={16} />
              PRICING
            </Badge>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-6xl font-bold text-gray-900 mb-6"
          >
            Learn like a Pro.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed mb-8"
          >
            Get full access to all features from only $
            {((7 * 30) / 100).toFixed(2)} per day — Cancel anytime.
          </motion.p>

          {/* Yearly/Monthly Toggle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="inline-flex items-center gap-3 bg-gray-100 rounded-full p-1"
          >
            <button
              onClick={() => setIsYearly(true)}
              className={`px-6 py-2 rounded-full font-medium transition-all duration-300 ${
                isYearly ? "bg-white text-gray-900 shadow-sm" : "text-gray-600"
              }`}
            >
              Yearly
            </button>
            <button
              onClick={() => setIsYearly(false)}
              className={`px-6 py-2 rounded-full font-medium transition-all duration-300 ${
                !isYearly ? "bg-white text-gray-900 shadow-sm" : "text-gray-600"
              }`}
            >
              Monthly
            </button>
          </motion.div>

          {isYearly && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[#0794d4] text-sm mt-3 font-medium"
            >
              Save 33% on a yearly subscription
            </motion.p>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pricingTiers.map((tier, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card
                className={`border ${
                  tier.badge
                    ? "border-gray-300 bg-gray-50"
                    : "border-gray-200 bg-white"
                } shadow-none hover:border-gray-300 transition-colors h-full flex flex-col`}
              >
                <CardContent className="p-5 flex flex-col h-full">
                  {/* Header */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-2xl font-normal text-gray-900">
                        {tier.name}
                      </h3>
                      {tier.badge && (
                        <Badge className="bg-[#0794d4] text-white hover:bg-[#0794d4] text-xs px-2 py-0.5">
                          {tier.badge}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{tier.description}</p>
                  </div>

                  {/* Price */}
                  <div className="mb-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-gray-900">
                        ${isYearly ? tier.yearlyPrice : tier.monthlyPrice}
                      </span>
                      <span className="text-sm text-gray-600">
                        per {isYearly ? "month" : "month"}
                      </span>
                    </div>
                    {isYearly && tier.yearlyPrice > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        billed yearly
                      </p>
                    )}
                  </div>

                  {/* CTA Button */}
                  <Button
                    className={`w-full mb-4 rounded-full ${
                      tier.badge
                        ? "bg-gray-900 text-white hover:bg-gray-800"
                        : "bg-white text-gray-900 border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    Get started
                  </Button>

                  {/* Features */}
                  <ul className="space-y-2 flex-1">
                    {tier.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-3">
                        <Check
                          className="w-5 h-5 text-gray-600 shrink-0 mt-0.5"
                          strokeWidth={2}
                        />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
