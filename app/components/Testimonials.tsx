"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { MessageSquareQuote } from "lucide-react";
import Image from "next/image";

const testimonials = [
  {
    name: "Sebastian Speier",
    role: "Shop",
    avatar: "SS",
    image:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80",
    content:
      "iProf Tutor is a great resource and it always comes in handy to see what the best practices or standards are for educational platforms in our current landscape.",
  },
  {
    name: "Meng To",
    role: "DesignCode",
    avatar: "MT",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80",
    content:
      "iProf Tutor is a game-changer for educators looking to step up their understanding of K-12 learning patterns. It's so massive, meticulously organized, has deep user flows and even an AI plugin! It's indispensable in the modern educator's toolbox.",
  },
  {
    name: "Marco Cornacchia",
    role: "Figma",
    avatar: "MC",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80",
    content:
      'iProf Tutor is one of my favorite resources for educational design and UI inspo. I love having access to a ton of "real world examples" to see how different schools and companies handle specific learning patterns and flows.',
  },
  {
    name: "Daryl Ginn",
    role: "Endless",
    avatar: "DG",
    image:
      "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=100&q=80",
    content:
      "iProf Tutor has quickly become our favorite inspiration resource for designing educational apps. Their advanced filtering is unmatched in the learning space.",
  },
  {
    name: "Taha Hossain",
    role: "Daybreak",
    avatar: "TH",
    image:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&q=80",
    content:
      "We can't imagine a teaching process without iProf Tutor. The quality, clarity and precision it provides make it just as valuable as it is intuitive.",
  },
  {
    name: "Axel Lindmarker",
    role: "Light",
    avatar: "AL",
    image:
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&q=80",
    content:
      "iProf Tutor is one of my main tools for finding flows to gain K-12 and learning insights from. Going there saves me a lot of time from having to do it myself.",
  },
  {
    name: "Josiah Gulden",
    role: "Compound Labs",
    avatar: "JG",
    image:
      "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=100&q=80",
    content:
      "iProf Tutor is one of the best ways to stay on top of the latest patterns, modalities, and visual trends in education... it's an essential resource for my team.",
  },
  {
    name: "Haerin Song",
    role: "Visa",
    avatar: "HS",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80",
    content:
      "By using the iProf Tutor platform, I save both my research time and space in my photo galleries filled with random screenshots. I love how easy it is to search for different patterns and copy and paste flows into lessons. It is a wonderful teaching tool you cannot live without!",
  },
  {
    name: "John Bai",
    role: "Paid",
    avatar: "JB",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80",
    content:
      "All my students love iProf Tutor. I mean that. I finally deleted that folder of 1,866 unorganized screenshots and haven't looked back since. Shoutout to the team for doing amazing work.",
  },
  {
    name: "Bobby Giangeruso",
    role: "Heart Hands, Inc",
    avatar: "BG",
    image:
      "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&q=80",
    content:
      "iProf Tutor is one of those tools I never close. It's the largest up-to-date library of educational content.",
  },
  {
    name: "Rachel How",
    role: "",
    avatar: "RH",
    image:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80",
    content:
      "iProf Tutor is my go-to reference for education design. Apart from saving countless hours, it gives me insights on the learning patterns, teaching methods, and user flows of world-class platforms. A must-have for creative inspiration and efficiency!",
  },
  {
    name: "Oykun Yilmaz",
    role: "",
    avatar: "OY",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80",
    content:
      "Designing feasible solutions based on real-world products is crucial for our teaching careers. iProf Tutor provides the best resources for this approach. I use it daily!",
  },
];

export default function Testimonials() {
  return (
    <section
      id="testimonials"
      className="py-20 px-4 sm:px-6 lg:px-8 bg-white relative overflow-hidden"
    >
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
              <MessageSquareQuote size={16} />
              TESTIMONIALS
            </Badge>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-6xl font-bold text-gray-900 mb-6"
          >
            What our users are saying.
          </motion.h2>
        </div>

        {/* Testimonials Masonry Grid */}
        <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4 relative">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              className="break-inside-avoid"
            >
              <Card className="border border-gray-200 bg-white shadow-none">
                <CardContent className="p-4">
                  {/* Author */}
                  <div className="flex items-start mb-2">
                    <div className="relative h-10 w-10 rounded-full overflow-hidden shrink-0">
                      <Image
                        src={testimonial.image}
                        alt={testimonial.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="ml-3">
                      <div className="font-semibold text-gray-900 text-sm">
                        {testimonial.name}
                      </div>
                      {testimonial.role && (
                        <div className="text-xs text-gray-500">
                          {testimonial.role}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <p className="text-gray-700 text-sm leading-relaxed m-0">
                    {testimonial.content}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Bottom Gradient Fade */}
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-linear-to-t from-white via-white/80 to-transparent pointer-events-none"></div>
      </div>
    </section>
  );
}
