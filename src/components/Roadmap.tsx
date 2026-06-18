"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ScrollReveal, StaggerChildren } from "@/lib/animations";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const steps = [
  { number: 1, title: "Sign Up Free", subtitle: "STEP 1" },
  { number: 2, title: "Learn Predator Mindset", subtitle: "STEP 2" },
  { number: 3, title: "Choose Your Pathway", subtitle: "STEP 3" },
  { number: 4, title: "Join the AllyTZ Community", subtitle: "STEP 4" },
  { number: 5, title: "Trade with Patience", subtitle: "STEP 5" },
];

type RoadmapProps = {
  onOpenSignup?: () => void;
};

const Roadmap: React.FC<RoadmapProps> = ({ onOpenSignup }) => {
  return (
    <section className="py-12 sm:py-16 md:py-20 relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <ScrollReveal>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold font-heading text-white leading-tight">
            Your Roadmap to{" "}
            <span className="text-transparent font-heading bg-clip-text bg-gradient-to-r from-gold via-gold-light to-gold drop-shadow-[0_0_20px_rgba(244,196,100,0.4)]">
              Survival
            </span>
          </h2>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-gold/90 font-semibold mt-4 sm:mt-6 text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto px-4"
          >
            Follow a disciplined, step-by-step path to survive and thrive in the markets.
          </motion.p>
        </ScrollReveal>

        <div className="relative mt-10 sm:mt-12 md:mt-16">
          {/* Connecting line for desktop */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gold/30 to-transparent transform -translate-y-1/2" />
          
          <StaggerChildren className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
            {steps.map((s, index) => (
              <motion.div
                key={s.number}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={{
                  hidden: { opacity: 0, y: 30, scale: 0.9 },
                  visible: { 
                    opacity: 1, 
                    y: 0, 
                    scale: 1,
                    transition: {
                      duration: 0.5,
                      delay: index * 0.15,
                      ease: [0.22, 1, 0.36, 1]
                    }
                  }
                }}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className="relative"
              >
                {/* Connection arrow for mobile/tablet */}
                {index < steps.length - 1 && (
                  <div className="hidden sm:block lg:hidden absolute top-1/2 -right-3 sm:-right-4 z-0">
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.15 + 0.3 }}
                    >
                      <ArrowRight className="w-6 h-6 text-gold/40" />
                    </motion.div>
                  </div>
                )}
                
                <Card className="bg-nero border border-steel-wool/30 hover:border-gold/60 hover:shadow-xl hover:shadow-gold/20 transition-all duration-300 group relative overflow-hidden">
                  {/* Animated background glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-gold/0 via-gold/0 to-gold/0 group-hover:from-gold/10 group-hover:via-gold/5 group-hover:to-gold/10 transition-all duration-500 pointer-events-none" />
                  
                  <CardHeader className="pb-3 sm:pb-4 relative z-10">
                    <motion.div 
                      className="relative inline-block"
                      whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="text-3xl sm:text-4xl font-extrabold text-gold mb-2 font-heading relative">
                        {s.number}
                        <motion.div
                          className="absolute -top-1 -right-1"
                          animate={{ 
                            scale: [1, 1.2, 1],
                            opacity: [0.5, 1, 0.5]
                          }}
                          transition={{ 
                            duration: 2, 
                            repeat: Infinity,
                            delay: index * 0.2
                          }}
                        >
                          <CheckCircle2 className="w-4 h-4 text-gold" />
                        </motion.div>
                      </div>
                    </motion.div>
                    <CardTitle className="text-white text-base sm:text-lg group-hover:text-gold transition-colors duration-300">
                      {s.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <motion.div 
                      className="text-xs tracking-widest text-rainy-grey opacity-80 group-hover:opacity-100 group-hover:text-gold/80 transition-all duration-300"
                      whileHover={{ scale: 1.05 }}
                    >
                      {s.subtitle}
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </StaggerChildren>
        </div>

        <ScrollReveal>
          <div className="mt-8 sm:mt-12">
            <Button 
              onClick={onOpenSignup}
              className="bg-gradient-to-r from-gold via-gold-light to-gold text-cursed-black rounded-full px-8 sm:px-10 py-6 sm:py-7 font-extrabold hover:shadow-[0_0_40px_rgba(244,196,100,0.6)] hover:shadow-gold/50 transition-all duration-300 min-h-[64px] text-base sm:text-lg group relative overflow-hidden border-2 border-gold/30"
              asChild
            >
              <motion.button
                whileHover={{ scale: 1.08, y: -2 }}
                whileTap={{ scale: 0.96 }}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Join the AllyTZ Panel community
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-2" />
                </span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-gold-light via-gold to-gold-light"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: 0 }}
                  transition={{ duration: 0.4 }}
                />
              </motion.button>
            </Button>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default Roadmap;