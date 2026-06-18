"use client";

import React from "react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ScrollReveal, StaggerChildren } from "@/lib/animations";
import { ArrowRight, HelpCircle } from "lucide-react";

const FAQ: React.FC = () => {
  const items = [
    { q: "WHO IS AllyTZ Panel?", a: "A training tribe focused on discipline, patience, and survival in the markets." },
    { q: "What is forex trading?", a: "Trading currency pairs with strategies that reward skill, timing, and awareness." },
    { q: "Who is online forex trading for?", a: "Anyone willing to learn and apply a disciplined approach—predators, not gamblers." },
    { q: "How does AllyTZ Panel help your journey?", a: "We teach mindset and mechanics, provide community, signals, and mentorship." },
    { q: "Where do I start?", a: "Begin training, choose your pathway, join the tribe, and practice patient execution." },
    { q: "What does it take to join AllyTZ Panel?", a: "Register, choose a plan, and commit to disciplined, adaptive learning." },
  ];

  return (
    <section className="py-12 sm:py-16 md:py-20 relative overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white text-center leading-tight px-4 font-heading">
            Still Wondering If Trading Is{" "}
            <span className="text-transparent bg-clip-text font-heading bg-gradient-to-r from-gold via-gold-light to-gold drop-shadow-[0_0_20px_rgba(244,196,100,0.4)]">For You?</span>
          </h2>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-center text-gold/90 font-semibold mt-4 sm:mt-6 text-lg sm:text-xl leading-relaxed px-4"
          >
            Find answers to common questions about surviving and thriving in the markets
          </motion.p>
        </ScrollReveal>

        <StaggerChildren className="mt-8 sm:mt-12">
          <Accordion type="single" collapsible className="w-full space-y-2">
            {items.map((it, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
              >
                <AccordionItem 
                  value={`item-${idx}`} 
                  className="border-0 bg-nero rounded-lg px-3 sm:px-4 mb-2 border border-steel-wool/30 hover:border-gold/60 hover:shadow-lg hover:shadow-gold/10 transition-all duration-300 group"
                >
                  <AccordionTrigger className="text-white hover:text-gold transition-colors duration-200 text-left text-sm sm:text-base py-3 sm:py-4 group-hover:gap-2">
                    <div className="flex items-center gap-2">
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3, delay: idx * 0.2 }}
                      >
                        <HelpCircle className="w-4 h-4 text-gold flex-shrink-0" />
                      </motion.div>
                      <span>{it.q}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-rainy-grey leading-relaxed text-sm sm:text-base pb-3 sm:pb-4">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      {it.a}
                    </motion.div>
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </StaggerChildren>

        <ScrollReveal>
          <motion.div
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="bg-nero mt-8 sm:mt-12 border border-steel-wool/30 hover:border-gold/60 hover:shadow-xl hover:shadow-gold/20 transition-all duration-300 group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-gold/0 via-gold/0 to-gold/0 group-hover:from-gold/10 group-hover:via-gold/5 group-hover:to-gold/10 transition-all duration-500 pointer-events-none" />
              <CardContent className="p-6 sm:p-8 text-center relative z-10">
                <motion.p 
                  className="text-rainy-grey mb-4 sm:mb-6 leading-relaxed text-base sm:text-lg group-hover:text-gold/80 transition-colors duration-300"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                >
                  Can't find the answer you're looking for? Our support team is here to help.
                </motion.p>
                <Button 
                  className="bg-gradient-to-r from-gold via-gold-light to-gold text-cursed-black hover:shadow-[0_0_40px_rgba(244,196,100,0.6)] hover:shadow-gold/50 transition-all duration-300 font-extrabold min-h-[64px] text-base sm:text-lg px-8 sm:px-10 py-6 sm:py-7 group/btn relative overflow-hidden border-2 border-gold/30 rounded-full"
                  asChild
                >
                  <motion.button
                    whileHover={{ scale: 1.08, y: -2 }}
                    whileTap={{ scale: 0.96 }}
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      Contact Support
                      <ArrowRight className="w-5 h-5 transition-transform group-hover/btn:translate-x-2" />
                    </span>
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-gold-light via-gold to-gold-light"
                      initial={{ x: "-100%" }}
                      whileHover={{ x: 0 }}
                      transition={{ duration: 0.4 }}
                    />
                  </motion.button>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default FAQ;