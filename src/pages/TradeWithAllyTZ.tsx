"use client";

import React from "react";
import DashboardLayout from "../components/dashboard/DashboardLayout.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SavannaCard from "@/components/dashboard/SavannaCard";
import { Button } from "@/components/ui/button";
import {
  Handshake,
  Gift,
  MessageSquare,
  Trophy,
  Wrench,
  Phone,
  CalendarClock,
  CheckCircle2,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { showSuccess } from "@/utils/toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import BrokerVerificationForm from "@/components/forms/BrokerVerificationForm.tsx";
import { PageTransition, ScrollReveal, StaggerChildren, fadeInUp, HoverScale } from "@/lib/animations";
import { motion } from "framer-motion";

const BenefitItem = ({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ComponentType<any>;
  title: string;
  desc: string;
}) => (
  <motion.div
    whileHover={{ scale: 1.02, y: -2 }}
    transition={{ duration: 0.2 }}
    variants={fadeInUp}
  >
    <Card className="bg-nero border-0 transition-all duration-300 hover:border hover:border-gold/40">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <motion.div
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.5 }}
            className="w-8 h-8 rounded-md bg-nero flex items-center justify-center"
          >
            <Icon className="text-gold" size={18} />
          </motion.div>
          <CardTitle className="text-white text-base">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="text-rainy-grey text-sm">{desc}</CardContent>
    </Card>
  </motion.div>
);

const TradeWithSavanna: React.FC = () => {
  const handleRegister = () => {
    showSuccess("Redirecting to broker registration…");
    // In a real app, replace with your broker referral link
    window.open("https://www.example.com/", "_blank", "noopener,noreferrer");
  };

  const [verifyOpen, setVerifyOpen] = React.useState(false);

  return (
    <PageTransition>
      <DashboardLayout>
        {/* Header banner */}
        <ScrollReveal>
          <SavannaCard className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                  className="w-9 h-9 rounded-md bg-[#6c340e] flex items-center justify-center"
                >
                  <Handshake className="text-white" size={18} />
                </motion.div>
                <h1 className="text-xl md:text-2xl font-semibold text-white">
                  Trade With Savanna
                </h1>
              </div>
              <p className="text-rainy-grey mt-2">
                Open a real broker account with SavannaFX's referral link and get lifetime access to free signals.
              </p>
            </CardContent>
          </SavannaCard>
        </ScrollReveal>

        {/* Main content: 2-column layout */}
        <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        {/* Left: Info and benefits */}
        <SavannaCard>
          <CardContent className="p-6">
            <div className="rounded-lg border border-steel-wool bg-nero/50 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Gift className="text-gold" size={18} />
                <h2 className="text-white text-lg font-semibold">
                  Trade with Savanna — Free (Lifetime Access)
                </h2>
              </div>
              <div className="bg-nero rounded-md p-4">
                <h3 className="text-white font-medium mb-1">Who this is for:</h3>
                <p className="text-rainy-grey">
                  Traders who want to join the SavannaFX ecosystem without paying upfront, and still get access to the full signal
                  experience — simply by funding their own live trading account.
                </p>
              </div>

              <div className="mt-6">
                <h3 className="text-white font-medium mb-3">What You Get:</h3>
                <StaggerChildren className="grid md:grid-cols-2 gap-4">
                  <BenefitItem
                    icon={ShieldCheck}
                    title="Lifetime Access to VIP Signal Group"
                    desc="Normally $50/month — you save $600+ yearly."
                  />
                  <BenefitItem
                    icon={MessageSquare}
                    title="Private Telegram Group"
                    desc="Verified traders — tighter community, faster updates."
                  />
                  <BenefitItem
                    icon={Trophy}
                    title="Priority Trading Competitions"
                    desc="Win real money and funded accounts."
                  />
                  <BenefitItem
                    icon={Wrench}
                    title="Early Access to Tools"
                    desc="Future bots, EAs, and strategy tools by SavannaFX."
                  />
                  <BenefitItem
                    icon={Phone}
                    title="Customer Support Line"
                    desc="Fast verification — get onboarded in less than 24hrs."
                  />
                  <BenefitItem
                    icon={CalendarClock}
                    title="Monthly Live Recaps"
                    desc="Verified traders performance analysis sessions."
                  />
                </StaggerChildren>
              </div>
            </div>
          </CardContent>
        </SavannaCard>

        {/* Right: Signup panel */}
        <ScrollReveal>
          <HoverScale>
            <SavannaCard>
              <CardContent className="p-6">
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ type: "spring" }}
                    className="text-gold text-2xl font-bold"
                  >
                    FREE
                  </motion.div>
                  <div className="text-rainy-grey">Lifetime Access</div>

              <div className="mt-6 text-rainy-grey">Don't have an account?</div>
              <Button
                className="mt-3 w-full bg-gradient-to-r from-gold-dark to-gold text-cursed-black hover:shadow-lg hover:shadow-gold/20 font-semibold h-11 rounded-md"
                onClick={handleRegister}
                disabled
              >
                REGISTER WITH BROKER
              </Button>

              <div className="mt-4 text-rainy-grey">OR</div>

              <div className="mt-3 text-rainy-grey">Already have an account with our referral link?</div>
              <Button
                variant="outline"
                className="mt-2 w-full h-11 rounded-md border-steel-wool text-rainy-grey hover:bg-nero/50 hover:border-gold/40"
                onClick={() => setVerifyOpen(true)}
              >
                SUBMIT EMAIL FOR VERIFICATION
              </Button>

              <p className="text-rainy-grey text-xs mt-2">Get instant access to signals</p>

              <div className="mt-6 text-left">
                <p className="text-white font-medium mb-2">Why This Is a Steal:</p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-rainy-grey">
                    <CheckCircle2 className="text-gold mt-0.5" size={16} />
                    <span>
                      Zero Cost to Join — just deposit your trading funds — you keep <span className="text-white">100%</span> of your money
                    </span>
                  </li>
                  <li className="flex items-start gap-2 text-rainy-grey">
                    <Wallet className="text-gold mt-0.5" size={16} />
                    <span>Stay 100% Liquid — premium access while staying risk-free from SavannaFX's side</span>
                  </li>
                  <li className="flex items-start gap-2 text-rainy-grey">
                    <Gift className="text-gold mt-0.5" size={16} />
                    <span>Premium Experience — full SavannaFX ecosystem access without subscription fees</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
            </SavannaCard>
          </HoverScale>
        </ScrollReveal>
      </div>

      <Dialog open={verifyOpen} onOpenChange={setVerifyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Verification</DialogTitle>
            <DialogDescription>Provide your email and optional details to request access.</DialogDescription>
          </DialogHeader>
          <BrokerVerificationForm onSubmitted={() => setVerifyOpen(false)} />
        </DialogContent>
      </Dialog>
      </DashboardLayout>
    </PageTransition>
  );
};

export default TradeWithSavanna;