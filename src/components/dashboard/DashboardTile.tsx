"use client";

import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PanelCard from "./PanelCard";
import { ArrowRight } from "lucide-react";

type Props = {
  to: string;
  title: string;
  description: string;
  Icon: React.ComponentType<{ className?: string; size?: number }>;
  iconBg?: string;
};

const DashboardTile: React.FC<Props> = ({ to, title, description, Icon, iconBg = "bg-gold" }) => {
  return (
    <Link to={to} className="block group">
      <PanelCard 
        className="cursor-pointer h-full transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-gold/10 active:scale-[0.98]"
        hoverable={true}
      >
        <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
          <div className="flex items-start justify-between mb-3 sm:mb-4">
            <div 
              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl ${iconBg} flex items-center justify-center 
                transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-lg`}
            >
              <Icon className="text-cursed-black" size={24} />
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <ArrowRight className="text-gold" size={20} />
            </div>
          </div>
          <CardTitle className="text-white text-base sm:text-lg font-bold leading-tight group-hover:text-gold transition-colors duration-300">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-rainy-grey text-xs sm:text-sm leading-relaxed px-4 sm:px-6 pb-4 sm:pb-6">
          {description}
        </CardContent>
      </PanelCard>
    </Link>
  );
};

export default DashboardTile;