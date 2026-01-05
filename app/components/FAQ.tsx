"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { HelpCircle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

const faqs = [
  {
    question: "Why use iProf Tutor?",
    answer:
      "iProf Tutor combines AI-powered personalized learning with comprehensive K-12 curriculum coverage. Our platform adapts to each student's learning pace, provides 24/7 tutoring support, and offers detailed analytics for parents and teachers to track progress effectively.",
  },
  {
    question: "What subjects does iProf Tutor support?",
    answer:
      "iProf Tutor covers all major K-12 subjects including Mathematics, Science, English Language Arts, Social Studies, and more. We also offer specialized support for test preparation, homework help, and advanced placement courses.",
  },
  {
    question: "Is iProf Tutor private and secure?",
    answer:
      "Yes, we take privacy and security seriously. All student data is encrypted, we comply with COPPA and FERPA regulations, and we never share personal information with third parties. Parents have full control over their children's data and privacy settings.",
  },
  {
    question: "How do I try iProf Tutor and what does it cost?",
    answer:
      "You can start with our free tier to explore basic features. Paid plans start at $7/month when billed yearly. We offer a 14-day money-back guarantee on all paid plans, so you can try risk-free.",
  },
  {
    question: "What happens if I stop using iProf Tutor?",
    answer:
      "You can cancel your subscription at any time. Your data will be retained for 90 days in case you want to reactivate, after which it will be permanently deleted upon request. You can export all your learning progress and reports before canceling.",
  },
];

export default function FAQ() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-40">
          {/* Left Column */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mb-4"
            >
              <Badge className="bg-[#0794d4]/10 text-[#0794d4] hover:bg-[#0794d4]/20 rounded-full px-4 py-1.5 text-sm font-medium uppercase tracking-wider inline-flex items-center gap-2">
                <HelpCircle size={16} />
                FAQ
              </Badge>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl md:text-5xl font-bold text-gray-900 mb-8"
            >
              Ask us anything
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg text-gray-600 mb-12 leading-relaxed"
            >
              Have more questions or need support? Shoot us a message and
              someone from our team will be happy to help.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Button className="bg-gray-900 text-white hover:bg-gray-800 rounded-full px-8">
                Contact us
              </Button>
            </motion.div>
          </div>

          {/* Right Column - Accordion */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="border-b border-gray-200"
                >
                  <AccordionTrigger className="text-left text-lg font-medium text-gray-900 hover:no-underline py-4">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 pb-4">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
