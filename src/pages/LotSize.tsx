"use client";

import React, { useState, useMemo } from "react";
import DashboardLayout from "../components/dashboard/DashboardLayout.tsx";
import { CardContent } from "@/components/ui/card";
import PanelCard from "@/components/dashboard/PanelCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageTransition, ScrollReveal, fadeInUp } from "@/lib/animations";
import { motion } from "framer-motion";
import { Calculator, TrendingUp, DollarSign, AlertTriangle, Info } from "lucide-react";

// Currency pair configurations
const currencyPairs = [
  { value: "EUR/USD", label: "EUR/USD", pipValue: 0.0001, lotSize: 100000 },
  { value: "GBP/USD", label: "GBP/USD", pipValue: 0.0001, lotSize: 100000 },
  { value: "USD/JPY", label: "USD/JPY", pipValue: 0.01, lotSize: 100000 },
  { value: "AUD/USD", label: "AUD/USD", pipValue: 0.0001, lotSize: 100000 },
  { value: "USD/CAD", label: "USD/CAD", pipValue: 0.0001, lotSize: 100000 },
  { value: "USD/CHF", label: "USD/CHF", pipValue: 0.0001, lotSize: 100000 },
  { value: "NZD/USD", label: "NZD/USD", pipValue: 0.0001, lotSize: 100000 },
  { value: "EUR/GBP", label: "EUR/GBP", pipValue: 0.0001, lotSize: 100000 },
  { value: "EUR/JPY", label: "EUR/JPY", pipValue: 0.01, lotSize: 100000 },
  { value: "GBP/JPY", label: "GBP/JPY", pipValue: 0.01, lotSize: 100000 },
  { value: "XAU/USD", label: "XAU/USD (Gold)", pipValue: 0.01, lotSize: 100 },
];

const accountCurrencies = ["USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "NZD"];

const LotSize: React.FC = () => {
  const [accountBalance, setAccountBalance] = useState<string>("10000");
  const [riskPercentage, setRiskPercentage] = useState<string>("2");
  const [stopLossPips, setStopLossPips] = useState<string>("50");
  const [currencyPair, setCurrencyPair] = useState<string>("EUR/USD");
  const [accountCurrency, setAccountCurrency] = useState<string>("USD");

  const calculation = useMemo(() => {
    const balance = parseFloat(accountBalance) || 0;
    const risk = parseFloat(riskPercentage) || 0;
    const stopLoss = parseFloat(stopLossPips) || 0;

    if (balance <= 0 || risk <= 0 || stopLoss <= 0) {
      return null;
    }

    const selectedPair = currencyPairs.find((pair) => pair.value === currencyPair);
    if (!selectedPair) return null;

    // Calculate risk amount in account currency
    const riskAmount = (balance * risk) / 100;

    // Calculate pip value per standard lot
    // For most pairs: 1 pip = $10 per standard lot (100,000 units)
    // For JPY pairs: 1 pip ≈ $10 per standard lot (depends on exchange rate, simplified)
    // For gold (XAU/USD): 1 pip = $10 per standard lot (100 oz)
    let pipValuePerStandardLot = 10; // Default $10 per standard lot
    
    if (currencyPair === "XAU/USD") {
      // Gold: 1 standard lot = 100 oz, 1 pip = 0.01, so 1 pip = $10
      pipValuePerStandardLot = 10;
    } else if (currencyPair.includes("JPY")) {
      // For JPY pairs, pip value depends on current rate, but typically ~$10 per standard lot
      pipValuePerStandardLot = 10;
    } else {
      // For most pairs (EUR/USD, GBP/USD, etc.): 1 pip = $10 per standard lot
      pipValuePerStandardLot = 10;
    }

    // Calculate lot size
    // Formula: Lot Size = Risk Amount / (Stop Loss in Pips × Pip Value per Standard Lot)
    const standardLots = riskAmount / (stopLoss * pipValuePerStandardLot);
    
    // Ensure lot size is not negative
    if (standardLots < 0) return null;
    
    // Convert to different lot sizes
    const lotSize = standardLots * 100000; // Total units
    const miniLots = standardLots * 10; // 1 standard lot = 10 mini lots
    const microLots = standardLots * 100; // 1 standard lot = 100 micro lots

    // Position value (contract size)
    const positionValue = lotSize;

    return {
      riskAmount,
      lotSize,
      standardLots,
      miniLots,
      microLots,
      positionValue,
      pipValuePerStandardLot,
    };
  }, [accountBalance, riskPercentage, stopLossPips, currencyPair]);

  const handleReset = () => {
    setAccountBalance("10000");
    setRiskPercentage("2");
    setStopLossPips("50");
    setCurrencyPair("EUR/USD");
    setAccountCurrency("USD");
  };

  return (
    <PageTransition>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <ScrollReveal>
            <PanelCard>
              <CardContent className="p-6">
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={fadeInUp}
                  className="flex items-center gap-4"
                >
                  <div className="w-12 h-12 rounded-lg bg-nero flex items-center justify-center">
                    <Calculator className="text-gold" size={24} />
                  </div>
                  <div>
                    <h1 className="text-2xl md:text-3xl font-semibold text-white">Lot Size Calculator</h1>
                    <p className="text-rainy-grey mt-1">
                      Calculate the optimal position size based on your risk management parameters.
                    </p>
                  </div>
                </motion.div>
              </CardContent>
            </PanelCard>
          </ScrollReveal>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Input Form */}
            <ScrollReveal>
              <PanelCard>
                <CardContent className="p-6 space-y-5">
                  <motion.h2
                    initial="hidden"
                    animate="visible"
                    variants={fadeInUp}
                    className="text-xl font-semibold text-white mb-4"
                  >
                    Calculator Parameters
                  </motion.h2>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="balance" className="text-white mb-2 block">
                        Account Balance ({accountCurrency})
                      </Label>
                      <Input
                        id="balance"
                        type="number"
                        value={accountBalance}
                        onChange={(e) => setAccountBalance(e.target.value)}
                        placeholder="10000"
                        className="bg-nero border-steel-wool text-white placeholder:text-rainy-grey focus-visible:ring-gold"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <Label htmlFor="risk" className="text-white mb-2 block">
                        Risk Percentage (%)
                      </Label>
                      <Input
                        id="risk"
                        type="number"
                        value={riskPercentage}
                        onChange={(e) => setRiskPercentage(e.target.value)}
                        placeholder="2"
                        className="bg-nero border-steel-wool text-white placeholder:text-rainy-grey focus-visible:ring-gold"
                        min="0"
                        max="100"
                        step="0.1"
                      />
                      <p className="text-rainy-grey text-xs mt-1">
                        Recommended: 1-2% per trade
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="stopLoss" className="text-white mb-2 block">
                        Stop Loss (Pips)
                      </Label>
                      <Input
                        id="stopLoss"
                        type="number"
                        value={stopLossPips}
                        onChange={(e) => setStopLossPips(e.target.value)}
                        placeholder="50"
                        className="bg-nero border-steel-wool text-white placeholder:text-rainy-grey focus-visible:ring-gold"
                        min="0"
                        step="0.1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="pair" className="text-white mb-2 block">
                        Currency Pair
                      </Label>
                      <Select value={currencyPair} onValueChange={setCurrencyPair}>
                        <SelectTrigger className="bg-nero border-steel-wool text-white focus:ring-gold">
                          <SelectValue placeholder="Select currency pair" />
                        </SelectTrigger>
                        <SelectContent>
                          {currencyPairs.map((pair) => (
                            <SelectItem
                              key={pair.value}
                              value={pair.value}
                              className="text-white focus:bg-nero"
                            >
                              {pair.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="accountCurrency" className="text-white mb-2 block">
                        Account Currency
                      </Label>
                      <Select value={accountCurrency} onValueChange={setAccountCurrency}>
                        <SelectTrigger className="bg-nero border-steel-wool text-white focus:ring-gold">
                          <SelectValue placeholder="Select account currency" />
                        </SelectTrigger>
                        <SelectContent>
                          {accountCurrencies.map((currency) => (
                            <SelectItem
                              key={currency}
                              value={currency}
                              className="text-white focus:bg-nero"
                            >
                              {currency}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      type="button"
                      onClick={handleReset}
                      variant="outline"
                      className="w-full border-steel-wool text-rainy-grey hover:bg-nero/50 hover:border-gold/40"
                    >
                      Reset to Defaults
                    </Button>
                  </div>
                </CardContent>
              </PanelCard>
            </ScrollReveal>

            {/* Results */}
            <ScrollReveal>
              <PanelCard>
                <CardContent className="p-6">
                  <motion.h2
                    initial="hidden"
                    animate="visible"
                    variants={fadeInUp}
                    className="text-xl font-semibold text-white mb-4"
                  >
                    Calculation Results
                  </motion.h2>

                  {calculation ? (
                    <div className="space-y-4">
                      <div className="rounded-lg border-0 bg-nero/50 p-4 hover:border hover:border-gold/40 transition-all">
                        <div className="flex items-center gap-3 mb-2">
                          <DollarSign className="text-gold" size={18} />
                          <span className="text-rainy-grey text-sm">Risk Amount</span>
                        </div>
                        <div className="text-2xl font-bold text-white">
                          {accountCurrency} {calculation.riskAmount.toFixed(2)}
                        </div>
                      </div>

                      <div className="rounded-lg border-0 bg-nero/50 p-4 hover:border hover:border-gold/40 transition-all">
                        <div className="flex items-center gap-3 mb-2">
                          <Calculator className="text-gold" size={18} />
                          <span className="text-rainy-grey text-sm">Standard Lots</span>
                        </div>
                        <div className="text-2xl font-bold text-white">
                          {calculation.standardLots.toFixed(2)}
                        </div>
                        <div className="text-rainy-grey text-xs mt-1">
                          {calculation.miniLots.toFixed(2)} mini lots • {calculation.microLots.toFixed(2)} micro lots
                        </div>
                      </div>

                      <div className="rounded-lg border-0 bg-nero/50 p-4 hover:border hover:border-gold/40 transition-all">
                        <div className="flex items-center gap-3 mb-2">
                          <TrendingUp className="text-gold" size={18} />
                          <span className="text-rainy-grey text-sm">Position Value</span>
                        </div>
                        <div className="text-2xl font-bold text-white">
                          {accountCurrency} {calculation.positionValue.toFixed(2)}
                        </div>
                      </div>

                      <div className="rounded-lg border border-steel-wool bg-nero/30 p-4 mt-4">
                        <div className="flex items-start gap-3">
                          <Info className="text-gold mt-0.5" size={18} />
                          <div className="text-rainy-grey text-sm space-y-1">
                            <p className="font-medium text-white">Calculation Formula:</p>
                            <p>Lot Size = (Balance × Risk %) ÷ (Stop Loss × Pip Value)</p>
                            <p className="mt-2">
                              <span className="font-medium text-white">Risk Amount:</span> {accountCurrency} {calculation.riskAmount.toFixed(2)}
                            </p>
                            <p>
                              <span className="font-medium text-white">Pip Value:</span> ${calculation.pipValuePerStandardLot.toFixed(2)} per standard lot
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-steel-wool bg-nero/30 p-6 text-center">
                      <AlertTriangle className="text-gold mx-auto mb-3" size={32} />
                      <p className="text-rainy-grey">
                        Please enter valid values to calculate lot size.
                      </p>
                    </div>
                  )}
                </CardContent>
              </PanelCard>
            </ScrollReveal>
          </div>

          {/* Info Card */}
          <ScrollReveal>
            <PanelCard>
              <CardContent className="p-6">
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={fadeInUp}
                  className="space-y-3"
                >
                  <h3 className="text-lg font-semibold text-white">About Lot Size Calculation</h3>
                  <div className="text-rainy-grey space-y-2 text-sm">
                    <p>
                      <span className="text-gold font-medium">Standard Lot:</span> 100,000 units of the base currency
                    </p>
                    <p>
                      <span className="text-gold font-medium">Mini Lot:</span> 10,000 units of the base currency
                    </p>
                    <p>
                      <span className="text-gold font-medium">Micro Lot:</span> 1,000 units of the base currency
                    </p>
                    <p className="mt-4">
                      <span className="text-gold font-medium">Risk Management Tip:</span> Never risk more than 1-2% of your account balance per trade. 
                      This calculator helps you determine the appropriate position size to maintain proper risk management.
                    </p>
                  </div>
                </motion.div>
              </CardContent>
            </PanelCard>
          </ScrollReveal>
        </div>
      </DashboardLayout>
    </PageTransition>
  );
};

export default LotSize;

