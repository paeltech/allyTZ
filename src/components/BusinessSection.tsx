"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ScrollReveal, StaggerChildren } from "@/lib/animations";
import { Sparkles, ArrowRight } from "lucide-react";

type Service = {
  title: string;
  price: string;
  bullets: string[];
  cta: string;
  icon?: React.ReactNode;
};

const services: Service[] = [
  {
    title: "Trading Signals",
    price: "Included",
    bullets: ["Real-time alerts", "Entry, SL & TP levels", "Active signal updates"],
    cta: "View Signals",
    icon: <Sparkles className="w-5 h-5" />,
  },
  {
    title: "Trade Analysis",
    price: "Included",
    bullets: ["Daily pair breakdowns", "Market context", "Actionable insights"],
    cta: "Read Analysis",
    icon: <Sparkles className="w-5 h-5" />,
  },
  {
    title: "Documents",
    price: "Included",
    bullets: ["Guides and playbooks", "View-only access", "Curated resources"],
    cta: "Browse Docs",
    icon: <Sparkles className="w-5 h-5" />,
  },
  {
    title: "Trade With AllyTZ",
    price: "Partnership",
    bullets: ["Broker program", "Community access", "Dedicated support"],
    cta: "Learn More",
    icon: <Sparkles className="w-5 h-5" />,
  },
];

const BusinessSection: React.FC = () => {
  return (
    <section className="py-12 sm:py-16 md:py-20 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white text-center font-heading leading-tight px-4">
            Build Your Business <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-gold-light to-gold font-heading drop-shadow-[0_0_20px_rgba(244,196,100,0.4)]">Right from Your Browser</span>
          </h2>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-gold/90 font-semibold text-center mt-4 sm:mt-6 text-lg sm:text-xl leading-relaxed max-w-3xl mx-auto px-4"
          >
            Everything you need to start, grow, and scale your trading business is accessible from any device.
          </motion.p>
        </ScrollReveal>

        <StaggerChildren className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mt-10 sm:mt-12 md:mt-16">
          {services.map((s, index) => (
            <motion.div
              key={s.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={{
                hidden: { opacity: 0, y: 30, scale: 0.95 },
                visible: { 
                  opacity: 1, 
                  y: 0, 
                  scale: 1,
                  transition: {
                    duration: 0.5,
                    delay: index * 0.1,
                    ease: [0.22, 1, 0.36, 1]
                  }
                }
              }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
            >
              <Card className="bg-nero flex flex-col border border-steel-wool/30 hover:border-gold/60 hover:shadow-xl hover:shadow-gold/20 transition-all duration-300 group relative overflow-hidden">
                {/* Animated gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-gold/0 via-gold/0 to-gold/0 group-hover:from-gold/5 group-hover:via-gold/0 group-hover:to-gold/5 transition-all duration-500 pointer-events-none" />
                
                <CardHeader className="pb-3 sm:pb-4 relative z-10">
                  <CardTitle className="text-white text-lg sm:text-xl flex items-center gap-2 group-hover:text-gold transition-colors duration-300">
                    {s.icon && (
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                        className="text-gold"
                      >
                        {s.icon}
                      </motion.div>
                    )}
                    {s.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-gold relative z-10">
                  <motion.div 
                    className="text-gold font-semibold text-base sm:text-lg mb-3 sm:mb-4"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    {s.price}
                  </motion.div>
                  <ul className="mt-2 sm:mt-3 space-y-2 sm:space-y-3">
                    {s.bullets.map((b, idx) => (
                      <motion.li 
                        key={b} 
                        className="text-xs sm:text-sm text-rainy-grey leading-relaxed flex items-start gap-2"
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 + idx * 0.05 }}
                      >
                        <span className="text-gold mt-1">•</span>
                        <span className="group-hover:text-gold/80 transition-colors duration-300">{b}</span>
                      </motion.li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="mt-auto pt-3 sm:pt-4 relative z-10">
                  <Button 
                    className="w-full bg-gradient-to-r from-gold-dark to-gold text-cursed-black hover:shadow-xl hover:shadow-gold/30 transition-all duration-300 rounded-md font-semibold min-h-[44px] text-sm sm:text-base group/btn relative overflow-hidden"
                    asChild
                  >
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        {s.cta}
                        <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                      </span>
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-gold to-gold-light"
                        initial={{ x: "-100%" }}
                        whileHover={{ x: 0 }}
                        transition={{ duration: 0.3 }}
                      />
                    </motion.button>
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </StaggerChildren>
      </div>
    </section>
  );
};

export default BusinessSection;