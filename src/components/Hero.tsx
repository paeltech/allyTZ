"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { fadeInUp, slideInLeft, defaultTransition } from "@/lib/animations";
import TypewriterText from "./TypewriterText";
import Galaxy from "./Galaxy";

const Hero: React.FC<{ onOpenMenu: () => void; onOpenSignup?: () => void }> = ({ onOpenMenu, onOpenSignup }) => {
  return (
    <section className="relative min-h-screen flex items-center bg-black overflow-hidden">
      <Galaxy 
        mouseRepulsion={true}
        mouseInteraction={true}
        density={0.3}
        speed={0.2}
        glowIntensity={0.2}
        saturation={0.8}
        hueShift={240}
        transparent={true}
      />
      
      {/* Desktop layout - Left aligned with image on right */}
      <div className="hidden lg:block relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 xl:gap-10 items-center">
          {/* Left side - Text content */}
          <div className="w-full lg:w-2/3">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={slideInLeft}
              transition={defaultTransition}
              className="space-y-3 lg:space-y-4"
            >
              {/* Decorative element */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ ...defaultTransition, delay: 0.1 }}
                className="flex items-center gap-2 mb-1"
              >
                <motion.div
                  animate={{ 
                    rotate: [0, 360],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 3, 
                    repeat: Infinity,
                    ease: "linear"
                  }}
                >
                  <Sparkles className="w-4 h-4 text-gold" />
                </motion.div>
                <span className="text-gold/80 text-xs font-medium tracking-wider uppercase">Welcome to AllyTZ Panel</span>
              </motion.div>

              <motion.h1
                initial="hidden"
                animate="visible"
                variants={fadeInUp}
                transition={{ ...defaultTransition, delay: 0.2 }}
                className="text-4xl lg:text-5xl xl:text-6xl font-extrabold text-white leading-[1.1] tracking-tight font-heading"
              >
                <span className="block mb-0">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-gold-light to-gold font-heading drop-shadow-[0_0_30px_rgba(244,196,100,0.5)] leading-none">
                    Train like a predator.
                  </span>
                </span>
                <span className="block -mt-1">
                  <TypewriterText
                    texts={["Survive the markets", "Profit consistently.", "Win the game."]}
                    typingSpeed={100}
                    deletingSpeed={50}
                    pauseDuration={2000}
                    className="text-white font-heading text-4xl lg:text-5xl xl:text-6xl drop-shadow-[0_0_20px_rgba(255,255,255,0.3)] leading-none"
                  />
                </span>
              </motion.h1>

              <motion.p
                initial="hidden"
                animate="visible"
                variants={fadeInUp}
                transition={{ ...defaultTransition, delay: 0.4 }}
                className="text-lg lg:text-xl font-semibold text-white/60 max-w-2xl leading-relaxed mt-3"
              >
                Markets are vast, harsh, and unforgiving — only the disciplined, adaptive, and patient thrive. AllyTZ Panel empowers you to survive and thrive in the markets.
              </motion.p>

              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeInUp}
                transition={{ ...defaultTransition, delay: 0.6 }}
                className="flex items-center gap-4 pt-2"
              >
                <Button 
                  onClick={onOpenSignup}
                  className="group bg-gradient-to-r from-gold via-gold-light to-gold text-cursed-black font-extrabold px-8 lg:px-12 py-4 lg:py-4 text-base lg:text-lg rounded-full transition-all duration-300 shadow-2xl hover:shadow-[0_0_40px_rgba(244,196,100,0.6)] hover:shadow-gold/50 flex items-center justify-center gap-3 min-h-[56px] lg:min-h-[64px] relative overflow-hidden border-2 border-gold/30"
                  asChild
                >
                  <motion.button
                    whileHover={{ scale: 1.08, y: -2 }}
                    whileTap={{ scale: 0.96 }}
                  >
                    <span className="relative z-10 flex items-center gap-3">
                      Get started with AllyTZ Panel
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
              </motion.div>
            </motion.div>
          </div>

          {/* Right side - Hero image */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...defaultTransition, delay: 0.3 }}
            className="relative w-full lg:w-1/3 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ ...defaultTransition, delay: 0.5 }}
              className="relative w-full rounded-2xl overflow-hidden shadow-2xl"
              style={{ maxHeight: '75vh' }}
            >
              <img 
                src="/assets/heroimage.jpeg" 
                alt="AllyTZ Panel visual" 
                className="w-full h-auto object-contain rounded-2xl"
                style={{ maxHeight: '75vh', display: 'block', borderRadius: '1rem' }}
              />
              {/* Overlay gradient for better text contrast if needed */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none rounded-2xl" />
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Mobile layout - Centered */}
      <div className="lg:hidden relative z-10 w-full min-h-screen flex items-center justify-center px-4 sm:px-6 py-16 sm:py-20">
        <div className="absolute inset-0 w-full h-full opacity-10">
          <img src="/assets/pexels-anna-nekrashevich-6801633.jpg" alt="AllyTZ Panel visual" className="w-full h-full object-cover" />
        </div>
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          transition={defaultTransition}
          className="relative z-10 text-center space-y-5 sm:space-y-6 max-w-2xl mx-auto w-full"
        >
          {/* Decorative element for mobile */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...defaultTransition, delay: 0.1 }}
            className="flex items-center justify-center gap-2 mb-2"
          >
            <motion.div
              animate={{ 
                rotate: [0, 360],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity,
                ease: "linear"
              }}
            >
              <Sparkles className="w-4 h-4 text-gold" />
            </motion.div>
            <span className="text-gold/80 text-xs font-medium tracking-wider uppercase">Welcome to AllyTZ Panel</span>
          </motion.div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight tracking-tight font-heading px-2">
            <span className="block">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-gold-light to-gold font-heading drop-shadow-[0_0_20px_rgba(244,196,100,0.4)] leading-none">
                Train like a predator.
              </span>
            </span>
            <span className="block -mt-1 text-white font-heading drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] leading-none">Trade with patience.</span>
            <TypewriterText
              texts={["Survive the markets", "Profit consistently.", "Win the game."]}
              typingSpeed={100}
              deletingSpeed={50}
              pauseDuration={2000}
              className="text-white font-heading text-4xl sm:text-5xl md:text-6xl drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] -mt-2 leading-none"
            />
          </h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-base sm:text-lg md:text-xl font-semibold text-gold/90 leading-relaxed px-4"
          >
            AllyTZ Panel helps you build discipline, timing, and awareness to survive and thrive in the markets.
          </motion.p>
          
          <div className="flex justify-center pt-3 sm:pt-4">
            <Button 
              onClick={onOpenSignup}
              className="group bg-gradient-to-r from-gold via-gold-light to-gold text-cursed-black font-extrabold px-8 sm:px-10 py-2 sm:py-2 text-base sm:text-lg rounded-full transition-all duration-300 shadow-2xl hover:shadow-[0_0_35px_rgba(244,196,100,0.6)] hover:shadow-gold/50 flex items-center justify-center gap-2 min-h-[56px] sm:min-h-[64px] w-full max-w-sm mx-auto relative overflow-hidden border-2 border-gold/30"
              asChild
            >
              <motion.button
                whileHover={{ scale: 1.08, y: -2 }}
                whileTap={{ scale: 0.96 }}
              >
                <span className="relative z-10 flex items-center gap-2">
                  <span>Get started with AllyTZ Panel</span>
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
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...defaultTransition, delay: 1, repeat: Infinity, repeatType: "reverse", duration: 2 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 hidden lg:block"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-6 h-10 border-2 border-gold/40 rounded-full flex justify-center backdrop-blur-sm bg-black/20"
        >
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="w-1.5 h-3 bg-gold rounded-full mt-2"
          />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default Hero;