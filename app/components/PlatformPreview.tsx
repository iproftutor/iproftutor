"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export default function PlatformPreview() {
  return (
    <section className="pt-0 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-8xl mx-auto">
        <div className="aspect-[0.85] w-full overflow-hidden ps-12 pt-12 min-[720px]:aspect-[1.14] min-[720px]:ps-20 min-[720px]:pt-20 min-[1280px]:aspect-[1.9] min-[1280px]:rounded-3xl min-[1280px]:px-[104px] min-[1280px]:pt-20 min-[1536px]:w-[min(80vw,1536px)] bg-gray-100">
          <div className="relative size-full min-h-[445px] min-w-[668px] overflow-hidden">
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Image
                alt="Preview image of the product interface"
                src="/product/preview1.webp"
                fill
                className="size-full select-none rounded-tl-2xl object-cover object-top-left min-[1280px]:rounded-t-2xl"
                priority
              />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
