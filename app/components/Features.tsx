"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Target, BarChart3, Bot, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    icon: Target,
    title: "Personalized Learning Paths",
    description:
      "AI-driven curriculum adapts to each student's pace and learning style, ensuring optimal progress and engagement throughout their learning journey.",
    image:
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80",
  },
  {
    icon: BarChart3,
    title: "Real-Time Progress Tracking",
    description:
      "Monitor student performance with comprehensive analytics and insights accessible to all stakeholders. Get detailed reports and visualizations.",
    image:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
  },
  {
    icon: Bot,
    title: "AI-Powered Tutoring",
    description:
      "24/7 intelligent assistance that provides instant help and explanations for K-12 subjects. Your personal tutor is always available.",
    image:
      "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&q=80",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-4 flex justify-center"
          >
            <Badge className="bg-[#0794d4]/10 text-[#0794d4] hover:bg-[#0794d4]/20 rounded-full px-4 py-1.5 text-sm font-medium uppercase tracking-wider inline-flex items-center gap-2">
              <Sparkles size={16} />
              FEATURES
            </Badge>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-6xl font-bold text-gray-900 mb-6"
          >
            Everything You Need for Success
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed"
          >
            iProf Tutor connects to thousands of educational resources, from
            large school districts and learning platforms to individual tutoring
            services, turning fragments into a complete learning experience
            finally in your hands.
          </motion.p>
        </div>

        {/* Features List */}
        <div className="space-y-32">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`flex flex-col ${
                index % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"
              } gap-12 lg:gap-20 items-center`}
            >
              {/* Text Content */}
              <motion.div
                initial={{ opacity: 0, x: index % 2 === 0 ? -40 : 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="flex-1"
              >
                <div className="w-12 h-12 mb-6 text-[#0794d4]">
                  <feature.icon size={48} strokeWidth={1.5} />
                </div>
                <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-lg text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>

              {/* Image Card */}
              <motion.div
                initial={{ opacity: 0, x: index % 2 === 0 ? 40 : -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="flex-1 w-full"
              >
                <div className="relative aspect-4/3 rounded-3xl overflow-hidden bg-linear-to-br from-gray-50 to-gray-100 shadow-xl">
                  <Image
                    src={feature.image}
                    alt={feature.title}
                    fill
                    className="object-cover"
                  />
                </div>
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
