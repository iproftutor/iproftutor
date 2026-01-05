"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { useState, useEffect } from "react";
import Image from "next/image";

const dashboards = [
  {
    title: "Parent",
    images: [
      "/product/preview1.webp",
      "/product/preview1.webp",
      "/product/preview1.webp",
    ],
  },
  {
    title: "Teacher",
    images: [
      "/product/preview1.webp",
      "/product/preview1.webp",
      "/product/preview1.webp",
    ],
  },
  {
    title: "Student",
    images: [
      "/product/preview1.webp",
      "/product/preview1.webp",
      "/product/preview1.webp",
    ],
  },
];

export default function Dashboards() {
  const [activeTab, setActiveTab] = useState(0);
  const [imageOrder, setImageOrder] = useState([0, 1, 2]);

  useEffect(() => {
    const imageInterval = setInterval(() => {
      setImageOrder((prev) => {
        const newOrder = [...prev];
        const last = newOrder.pop();
        newOrder.unshift(last!);
        return newOrder;
      });
      // Change tab when top image changes
      setActiveTab((prev) => (prev + 1) % dashboards.length);
    }, 3000);
    return () => clearInterval(imageInterval);
  }, []);

  return (
    <section id="dashboards" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-4 flex justify-center"
          >
            <Badge className="bg-[#0794d4]/10 text-[#0794d4] hover:bg-[#0794d4]/20 rounded-full px-4 py-1.5 text-sm font-medium uppercase tracking-wider inline-flex items-center gap-2">
              <Users size={16} />
              PERSONALIZED
            </Badge>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-6"
          >
            Tailored Dashboards for Everyone
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed"
          >
            Specialized interfaces designed for students, teachers, and parents
            to maximize engagement and outcomes.
          </motion.p>
        </div>

        {/* Tabs (pricing-style pill toggle) */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex items-center gap-2 bg-gray-100 rounded-full p-1">
            {dashboards.map((dashboard, index) => (
              <button
                key={index}
                onClick={() => setActiveTab(index)}
                className={`px-6 py-2 rounded-full font-medium transition-all duration-300 ${
                  activeTab === index
                    ? "bg-white text-gray-900 shadow-sm scale-105"
                    : "text-gray-600"
                }`}
              >
                {dashboard.title}
              </button>
            ))}
          </div>
        </div>

        {/* Dashboard Preview */}
        <div className="relative max-w-[1200px] mx-auto h-[800px]">
          {/* Stacked Images with Cycling Animation */}
          <div className="relative w-full h-full flex items-center justify-center">
            <AnimatePresence initial={false}>
              {imageOrder.map((imageIndex, position) => {
                const zIndex = 3 - position;
                const yOffset = position * 50;
                const scale = 1 - position * 0.03;
                const rotation = position === 0 ? -2 : position === 1 ? 0 : 2;

                return (
                  <motion.div
                    key={imageIndex}
                    initial={{
                      y: 120,
                      opacity: 0,
                      scale: 0.9,
                      rotate: 0,
                    }}
                    animate={{
                      y: yOffset,
                      opacity: 1,
                      scale: scale,
                      rotate: rotation,
                      zIndex: zIndex,
                    }}
                    exit={{
                      y: -120,
                      opacity: 0,
                      scale: 0.9,
                    }}
                    transition={{
                      duration: 0.6,
                      ease: "easeInOut",
                    }}
                    className="absolute w-full aspect-video rounded-3xl overflow-hidden shadow-2xl border-4 border-white"
                    style={{
                      top: "3%",
                    }}
                  >
                    <Image
                      src={dashboards[activeTab].images[imageIndex]}
                      alt={`${dashboards[activeTab].title} dashboard ${
                        imageIndex + 1
                      }`}
                      fill
                      className="object-cover"
                      priority
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
