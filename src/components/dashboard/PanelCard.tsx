"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Props = React.HTMLAttributes<HTMLDivElement> & {
  hoverable?: boolean;
  rounded?: "lg" | "xl";
};

const PanelCard: React.FC<Props> = ({ className, hoverable = true, rounded = "xl", ...props }) => {
  const roundedClass = rounded === "xl" ? "rounded-xl" : "rounded-lg";
  return (
    <Card
      className={cn(
        // AllyTZ Panel dark card style with enhanced mobile-friendly design
        "bg-nero/95 border-steel-wool/50 backdrop-blur-sm",
        roundedClass,
        hoverable && "transition-all duration-300 hover:border-gold/40 hover:bg-nero hover:shadow-lg hover:shadow-gold/5",
        className
      )}
      {...props}
    />
  );
};

export default PanelCard;
