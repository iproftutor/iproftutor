"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function CTA() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative bg-linear-to-br from-[#0794d4]/10 via-blue-50/50 to-white backdrop-blur-xl border border-blue-100/50 rounded-3xl p-12 md:p-16 text-center overflow-hidden"
        >
          {/* Glass effect overlay */}
          <div className="absolute inset-0 bg-white/40 backdrop-blur-md rounded-3xl"></div>

          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Ready to Transform Your Learning Experience?
            </h2>
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
              Join thousands of students, teachers, and parents who are already
              experiencing the power of AI-driven education.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                size="lg"
                className="bg-[#0794d4] hover:bg-[#0679b0] text-white text-base px-4 py-3 rounded-full"
              >
                Start Free Trial
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-[#0794d4] text-[#0794d4] hover:bg-[#0794d4]/10 hover:text-[#0794d4] text-base px-4 py-3 rounded-full inline-flex items-center gap-2"
              >
                Watch Demo
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>

            <p className="text-gray-500 mt-6 text-sm">
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
