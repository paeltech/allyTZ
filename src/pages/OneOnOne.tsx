"use client";

import React from "react";
import DashboardLayout from "../components/dashboard/DashboardLayout.tsx";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PanelCard from "@/components/dashboard/PanelCard";
import { Button } from "@/components/ui/button";
import {
  Target,
  UserRound,
  Wrench,
  BarChart3,
  Brain,
  ClipboardList,
  ShieldCheck,
  ScrollText,
  CalendarClock,
  Megaphone,
  BookMarked,
  Zap,
  Eye,
  Infinity,
  Quote,
  Star,
  CheckCircle2,
} from "lucide-react";
import { showSuccess } from "@/utils/toast";
import { PageTransition, ScrollReveal, StaggerChildren, fadeInUp, HoverScale, HoverLift } from "@/lib/animations";
import { motion } from "framer-motion";

type ItemProps = {
  icon: React.ComponentType<any>;
  title: string;
  desc: string;
};

const FeatureItem = ({ icon: Icon, title, desc }: ItemProps) => (
  <motion.div
    whileHover={{ scale: 1.02, y: -2 }}
    transition={{ duration: 0.2 }}
    variants={fadeInUp}
    className="rounded-xl border-0 bg-nero p-4 transition-all duration-300 hover:border hover:border-gold/40"
  >
    <div className="flex items-center gap-3">
      <motion.div
        whileHover={{ rotate: 360 }}
        transition={{ duration: 0.5 }}
        className="w-9 h-9 rounded-lg bg-nero flex items-center justify-center shrink-0"
      >
        <Icon className="text-gold" size={18} />
      </motion.div>
      <div>
        <div className="text-white font-medium">{title}</div>
        <div className="text-rainy-grey text-sm">{desc}</div>
      </div>
    </div>
  </motion.div>
);

const Bullet = ({ icon: Icon, text }: { icon: React.ComponentType<any>; text: string }) => (
  <motion.div
    initial={{ opacity: 0, x: -10 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.3 }}
    className="flex items-start gap-2 text-rainy-grey"
  >
    <Icon className="text-gold mt-0.5" size={16} />
    <span className="text-sm">{text}</span>
  </motion.div>
);

const TestimonialCard = ({
  quote,
  name,
}: {
  quote: string;
  name: string;
}) => (
  <motion.div
    whileHover={{ scale: 1.02, y: -2 }}
    transition={{ duration: 0.2 }}
    variants={fadeInUp}
    className="rounded-xl border-0 bg-nero p-4 flex items-start gap-3 transition-all duration-300 hover:border hover:border-gold/40"
  >
    <div className="w-9 h-9 rounded-lg bg-nero flex items-center justify-center shrink-0">
      <UserRound className="text-gold" size={18} />
    </div>
    <div className="flex-1">
      <div className="flex items-start gap-2 text-rainy-grey">
        <Quote className="text-steel-wool mt-0.5" size={16} />
        <p className="text-sm">{quote}</p>
      </div>
      <div className="mt-2 text-rainy-grey text-xs font-medium">{name}</div>
    </div>
  </motion.div>
);

const OneOnOne: React.FC = () => {
  const handleRegister = () => {
    showSuccess("Opening mentorship registration…");
    // Replace with your real booking/checkout link
    window.open("https://cal.com", "_blank", "noopener,noreferrer");
  };

  return (
    <PageTransition>
    <DashboardLayout>
      {/* Header banner */}
        <ScrollReveal>
      <PanelCard className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                    className="w-9 h-9 rounded-md bg-[#6c340e] flex items-center justify-center"
                  >
                <Target className="text-white" size={18} />
                  </motion.div>
              <div>
                <h1 className="text-xl md:text-2xl font-semibold text-white">
                  One-on-One Mentorship — <span className="text-gold">$1,500</span>
                </h1>
                <p className="text-rainy-grey text-sm">
                  Collapse 3–5 years of trading pain into 5 deep sessions
                </p>
              </div>
            </div>
            <Button
              className="bg-gradient-to-r from-gold-dark to-gold text-cursed-black hover:shadow-lg hover:shadow-gold/20 font-semibold h-11 rounded-md px-6"
              onClick={handleRegister}
            >
              REGISTER NOW
            </Button>
          </div>
        </CardContent>
      </PanelCard>
        </ScrollReveal>

      {/* Who this is for */}
      <PanelCard className="mb-6">
        <CardContent className="p-6">
          <h2 className="text-white font-medium mb-3">Who this is for:</h2>
          <p className="text-rainy-grey">
            Highly motivated traders who want to collapse 3–5 years of pain into 5 deep sessions,
            rebuild their psychology, and get a custom trading system that actually works for them.
          </p>
        </CardContent>
      </PanelCard>

      {/* What You Get */}
        <ScrollReveal>
      <PanelCard className="mb-6">
        <CardContent className="p-6">
          <h2 className="text-white font-medium mb-4">What You Get:</h2>
              <StaggerChildren className="grid md:grid-cols-2 gap-4">
            <FeatureItem
              icon={UserRound}
              title="5 Personalized Coaching Sessions"
              desc="One-on-one Zoom sessions — lifetime replay access included"
            />
            <FeatureItem
              icon={Wrench}
              title="Custom Strategy Refinement"
              desc="Optimize what you know for consistency and profitability"
            />
            <FeatureItem
              icon={BarChart3}
              title="Live Chart Reviews & Audit"
              desc="Journal analysis and trade-by-trade breakdowns"
            />
            <FeatureItem
              icon={Brain}
              title="Trading Psychology Mastery"
              desc="Identify emotional leaks and build systems that neutralize them"
            />
            <FeatureItem
              icon={ClipboardList}
              title="Your Personalized Trading Plan"
              desc="From watchlist building to entry/exit rules and risk system"
            />
            <FeatureItem
              icon={ShieldCheck}
              title="Lifetime VIP Signal Group Access"
              desc="Never pay again for signals — save $1,000+ yearly"
            />
            <FeatureItem
              icon={ScrollText}
              title="Certificate of Completion"
              desc="Mentored by AllyTZ Panel — adds credibility to your status"
            />
              </StaggerChildren>
        </CardContent>
      </PanelCard>
        </ScrollReveal>

      {/* Additional Perks */}
      <PanelCard className="mb-6">
        <CardContent className="p-6">
          <h2 className="text-white font-medium mb-4">Additional Perks:</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <FeatureItem
              icon={CalendarClock}
              title="Private Access for 60 Days"
              desc="Direct access post-mentorship for follow-up questions"
            />
            <FeatureItem
              icon={Megaphone}
              title="Mentorship Shoutout"
              desc="Public showcase across platforms — social proof boost"
            />
            <FeatureItem
              icon={BookMarked}
              title="Funded Trader Blueprint Add-On"
              desc="Step-by-step guide to secure 6-figure funding included"
            />
          </div>
        </CardContent>
      </PanelCard>

      {/* Two-column: investment highlights + pricing panel */}
      <div className="grid md:grid-cols-3 gap-6 mb-6">
        <PanelCard className="md:col-span-2 bg-nero border-0">
          <CardContent className="p-6 space-y-4">
            <h3 className="text-white text-lg font-semibold">
              Why This Investment Changes Everything
            </h3>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="rounded-lg border-0 bg-nero/50 p-4 hover:border hover:border-gold/40 transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="text-gold" size={18} />
                  <span className="text-white font-medium">Skip Years of Trial & Error</span>
                </div>
                <p className="text-rainy-grey text-sm">Get direct access to proven strategies that work</p>
              </div>
              <div className="rounded-lg border-0 bg-nero/50 p-4 hover:border hover:border-gold/40 transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="text-gold" size={18} />
                  <span className="text-white font-medium">Personalized to YOUR Trading</span>
                </div>
                <p className="text-rainy-grey text-sm">Custom solutions for your style — not generic advice</p>
              </div>
              <div className="rounded-lg border-0 bg-nero/50 p-4 hover:border hover:border-gold/40 transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <Infinity className="text-gold" size={18} />
                  <span className="text-white font-medium">Lifetime Value</span>
                </div>
                <p className="text-rainy-grey text-sm">Skills and access that pay for themselves many times over</p>
              </div>
            </div>
          </CardContent>
        </PanelCard>

        <PanelCard>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-gold text-3xl font-bold">$1,500</div>
              <div className="text-rainy-grey text-sm">One-time investment</div>
              <div className="text-steel-wool text-xs">Transform 3–5 years of struggle into 5 focused sessions</div>

              <div className="mt-4 space-y-2 text-left">
                <Bullet icon={CheckCircle2} text="5 personalized coaching sessions" />
                <Bullet icon={CheckCircle2} text="Custom strategy refinement" />
                <Bullet icon={CheckCircle2} text="Trading psychology mastery" />
                <Bullet icon={CheckCircle2} text="Lifetime VIP signal access" />
                <Bullet icon={CheckCircle2} text="Certificate of completion" />
                <Bullet icon={CheckCircle2} text="60-day follow-up access" />
              </div>

              <Button
                className="mt-5 w-full bg-red-600 hover:bg-red-700 text-white h-11 rounded-md"
                onClick={handleRegister}
              >
                REGISTER NOW
              </Button>

              <div className="mt-3 space-y-2 text-left">
                <Bullet icon={CheckCircle2} text="Lifetime value that pays for itself" />
                <Bullet icon={CheckCircle2} text="Limited spots available monthly" />
              </div>
            </div>
          </CardContent>
        </PanelCard>
      </div>

      {/* Testimonials */}
        <ScrollReveal>
          <StaggerChildren className="grid md:grid-cols-2 gap-4 mb-6">
        <TestimonialCard
          quote="Join our community and never miss out on style tips, exclusive offers, and inspiration."
          name="Laura Basmar"
        />
        <TestimonialCard
          quote="The aim of education is to sharpen intelligence, strengthen will, and refine feelings."
          name="Supitar"
        />
          </StaggerChildren>
        </ScrollReveal>

      {/* Success stories */}
      <PanelCard className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-nero flex items-center justify-center">
              <Star className="text-gold" size={18} />
            </div>
            <div>
              <div className="text-white font-semibold">1000+ Success Stories</div>
              <div className="text-rainy-grey text-sm">And counting — mentees worldwide</div>
            </div>
          </div>
        </CardContent>
      </PanelCard>

      {/* Confidence builder */}
      <PanelCard>
        <CardContent className="p-6">
          <h3 className="text-white text-lg font-semibold">
            Build your confidence to find answers to your questions!
          </h3>
          <div className="mt-3 grid sm:grid-cols-2 gap-3">
            <FeatureItem
              icon={UserRound}
              title="Personalized one-on-one sessions"
              desc="Guided coaching tailored to your strengths and goals"
            />
            <FeatureItem
              icon={BarChart3}
              title="Live chart reviews & audit"
              desc="Actionable feedback on your trade execution"
            />
            <FeatureItem
              icon={Wrench}
              title="Custom strategy refinement"
              desc="Dial in entries, exits, and risk management"
            />
            <FeatureItem
              icon={Brain}
              title="Psychology & risk control"
              desc="Systems that make discipline effortless"
            />
          </div>
        </CardContent>
      </PanelCard>
    </DashboardLayout>
    </PageTransition>
  );
};

export default OneOnOne;