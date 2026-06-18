"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Briefcase, Rocket, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { ScrollReveal, StaggerChildren } from "@/lib/animations";

interface ChoiceSectionProps {
  onOpenSignup?: () => void;
}

const ChoiceSection: React.FC<ChoiceSectionProps> = ({ onOpenSignup }) => {
  const [selected, setSelected] = useState<"traditional" | "forex">("forex");

  const ListItem = ({ text, delay = 0 }: { text: string; delay?: number }) => (
    <motion.div 
      className="flex items-start sm:items-center gap-2 sm:gap-3 leading-relaxed"
      initial={{ opacity: 0, x: -10 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.3 }}
    >
      <motion.div
        whileHover={{ scale: 1.2, rotate: 360 }}
        transition={{ duration: 0.3 }}
      >
        <CheckCircle className="text-gold flex-shrink-0 mt-0.5 sm:mt-0" size={16} />
      </motion.div>
      <span className="text-rainy-grey text-sm sm:text-base">{text}</span>
    </motion.div>
  );

  return (
    <section className="py-12 sm:py-16 md:py-20 relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="flex justify-center mb-8 sm:mb-12">
            <div className="inline-flex bg-nero rounded-full p-1 border border-steel-wool flex-wrap justify-center gap-1 sm:gap-0 relative">
              <motion.div
                className="absolute bg-gold rounded-full"
                initial={false}
                animate={{
                  left: selected === "traditional" ? "4px" : "50%",
                  width: "calc(50% - 4px)",
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                style={{ height: "calc(100% - 8px)", top: "4px" }}
              />
              <button
                className={`relative z-10 px-4 sm:px-6 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 min-h-[44px] ${
                  selected === "traditional"
                    ? "text-cursed-black"
                    : "text-rainy-grey hover:text-gold"
                }`}
                onClick={() => setSelected("traditional")}
              >
                <span className="hidden sm:inline">Traditional Path</span>
                <span className="sm:hidden">Traditional</span>
              </button>
              <button
                className={`relative z-10 px-4 sm:px-6 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 min-h-[44px] ${
                  selected === "forex"
                    ? "text-cursed-black"
                    : "text-rainy-grey hover:text-gold"
                }`}
                onClick={() => setSelected("forex")}
              >
                <span className="hidden sm:inline">The AllyTZ Panel Path</span>
                <span className="sm:hidden">AllyTZ Panel</span>
              </button>
            </div>
          </div>
        </ScrollReveal>

        <StaggerChildren className="flex flex-col sm:grid sm:grid-cols-2 gap-6 sm:gap-8">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5 }}
            className={selected === "forex" ? "order-2 sm:order-1" : "order-1 sm:order-1"}
          >
            <Card
              className={`bg-nero transition-all duration-300 border relative overflow-hidden group ${
                selected === "traditional" 
                  ? "border-gold/60 shadow-xl shadow-gold/20" 
                  : "border-steel-wool/30 hover:border-steel-wool"
              }`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br from-gold/0 to-gold/0 transition-all duration-500 ${
                selected === "traditional" ? "from-gold/10 to-gold/5" : ""
              }`} />
              <CardHeader className="pb-3 sm:pb-4 relative z-10">
                <CardTitle className="flex items-center gap-2 sm:gap-3 text-white text-lg sm:text-xl group-hover:text-gold transition-colors duration-300">
                  <motion.div
                    animate={selected === "traditional" ? { rotate: [0, 10, -10, 0] } : {}}
                    transition={{ duration: 0.5 }}
                  >
                    <Briefcase className="text-gold flex-shrink-0" size={18} />
                  </motion.div>
                  <span>Traditional 9-5 Path</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3 relative z-10">
                <ListItem text="40+ years of daily 9-5 grind" delay={0.1} />
                <ListItem text="Limited salary growth potential" delay={0.15} />
                <ListItem text="Financial stress and uncertainty" delay={0.2} />
                <ListItem text="Retirement may not be enough" delay={0.25} />
                <ListItem text="Little control over your time" delay={0.3} />
                <motion.p 
                  className="text-gold mt-4 sm:mt-6 italic leading-relaxed opacity-90 text-sm sm:text-base"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 0.9 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.35 }}
                >
                  "Work for decades and hope for a decent retirement."
                </motion.p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5 }}
            className={selected === "forex" ? "order-1 sm:order-2" : "order-2 sm:order-2"}
          >
            <Card
              className={`bg-nero transition-all duration-300 border relative overflow-hidden group ${
                selected === "forex" 
                  ? "border-gold/60 shadow-xl shadow-gold/20" 
                  : "border-steel-wool/30 hover:border-steel-wool"
              }`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br from-gold/0 to-gold/0 transition-all duration-500 ${
                selected === "forex" ? "from-gold/10 to-gold/5" : ""
              }`} />
              <CardHeader className="pb-3 sm:pb-4 relative z-10">
                <CardTitle className="flex items-center gap-2 sm:gap-3 text-white text-lg sm:text-xl group-hover:text-gold transition-colors duration-300">
                  <motion.div
                    animate={selected === "forex" ? { rotate: [0, -15, 15, 0], scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 0.5 }}
                  >
                    <Rocket className="text-gold flex-shrink-0" size={18} />
                  </motion.div>
                  <span>The AllyTZ Panel Path</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3 relative z-10">
                <ListItem text="Train the predator mindset" delay={0.1} />
                <ListItem text="Trade with discipline and patience" delay={0.15} />
                <ListItem text="Build multiple income streams" delay={0.2} />
                <ListItem text="Reward skill, timing, and awareness" delay={0.25} />
                <ListItem text="Thrive with a focused community" delay={0.3} />
                <motion.p 
                  className="text-gold mt-4 sm:mt-6 italic leading-relaxed opacity-90 text-sm sm:text-base"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 0.9 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.35 }}
                >
                  "Survive and thrive in the markets with AllyTZ Panel."
                </motion.p>
              </CardContent>
            </Card>
          </motion.div>
        </StaggerChildren>

        <ScrollReveal>
          <div className="mt-8 sm:mt-12 text-center">
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="bg-nero hover:border hover:border-gold/40 hover:shadow-xl hover:shadow-gold/10 transition-all duration-300 max-w-3xl mx-auto">
                <CardContent className="p-6 sm:p-8">
                  <motion.p 
                    className="text-rainy-grey mb-4 sm:mb-6 leading-relaxed text-base sm:text-lg"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                  >
                    The decision you make today will determine your financial future. Stop settling for average and start building the life you deserve.
                  </motion.p>
                  <Button
                    className="bg-gradient-to-r from-gold via-gold-light to-gold text-cursed-black font-extrabold rounded-full px-8 sm:px-10 py-6 sm:py-7 hover:shadow-[0_0_40px_rgba(244,196,100,0.6)] hover:shadow-gold/50 transition-all duration-300 min-h-[64px] text-base sm:text-lg w-full sm:w-auto group relative overflow-hidden border-2 border-gold/30"
                    onClick={() => onOpenSignup?.()}
                    asChild
                  >
                    <motion.button
                      whileHover={{ scale: 1.08, y: -2 }}
                      whileTap={{ scale: 0.96 }}
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        Choose Financial Freedom
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
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default ChoiceSection;