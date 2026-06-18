"use client";

import React from "react";
import { useParams, Link } from "react-router-dom";
import DashboardLayout from "../components/dashboard/DashboardLayout.tsx";
import { CardContent } from "@/components/ui/card";
import PanelCard from "@/components/dashboard/PanelCard";
import { Button } from "@/components/ui/button";
import { PageTransition, ScrollReveal, fadeInUp, HoverScale } from "@/lib/animations";
import { motion } from "framer-motion";

const friendlyTitle = (slug: string) =>
  slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

const DashboardFeature: React.FC = () => {
  const { section } = useParams<{ section: string }>();
  const title = section ? friendlyTitle(section) : "Section";

  return (
    <PageTransition>
      <DashboardLayout>
        <ScrollReveal>
          <HoverScale>
            <PanelCard>
              <CardContent className="p-6 space-y-3">
                <motion.h2
                  initial="hidden"
                  animate="visible"
                  variants={fadeInUp}
                  className="text-2xl md:text-3xl font-semibold text-white"
                >
                  {title}
                </motion.h2>
                <motion.p
                  initial="hidden"
                  animate="visible"
                  variants={fadeInUp}
                  transition={{ delay: 0.2 }}
                  className="text-rainy-grey"
                >
                  This is a placeholder page for {title}. We can plug in real data and tools here.
                </motion.p>
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={fadeInUp}
                  transition={{ delay: 0.4 }}
                  className="flex gap-3"
                >
                  <Link to="/dashboard">
                    <Button variant="outline" className="border-steel-wool text-rainy-grey hover:bg-nero/50 hover:border-gold/40">Back to Dashboard</Button>
                  </Link>
                  <Button className="bg-gradient-to-r from-gold-dark to-gold text-cursed-black hover:shadow-lg hover:shadow-gold/20 font-semibold">Open Tool</Button>
                </motion.div>
              </CardContent>
            </PanelCard>
          </HoverScale>
        </ScrollReveal>
      </DashboardLayout>
    </PageTransition>
  );
};

export default DashboardFeature;