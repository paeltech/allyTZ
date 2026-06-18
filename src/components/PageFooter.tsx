"use client";

import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const PageFooter: React.FC = () => {
  return (
    <footer className="bg-black text-rainy-grey pt-12 sm:pt-16 pb-6 sm:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 lg:gap-12">
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <img src="/assets/logo.png" alt="AllyTZ Panel logo" className="w-24 sm:w-28 md:w-32 rounded-lg" />
            </div>
            <p className="text-xs sm:text-sm text-rainy-grey leading-relaxed">
              AllyTZ Panel teaches and empowers traders to survive and thrive in the markets with discipline, timing, and awareness.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Quick Links</h4>
            <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-rainy-grey leading-relaxed">
              <li className="hover:text-gold transition-colors duration-200 cursor-pointer min-h-[32px] flex items-center">Home</li>
              <li className="hover:text-gold transition-colors duration-200 cursor-pointer min-h-[32px] flex items-center">Course</li>
              <li className="hover:text-gold transition-colors duration-200 cursor-pointer min-h-[32px] flex items-center">Mentorship</li>
              <li className="hover:text-gold transition-colors duration-200 cursor-pointer min-h-[32px] flex items-center">Academy</li>
              <li className="hover:text-gold transition-colors duration-200 cursor-pointer min-h-[32px] flex items-center">Booking</li>
              <li className="hover:text-gold transition-colors duration-200 cursor-pointer min-h-[32px] flex items-center">Dashboard</li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Services</h4>
            <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-rainy-grey leading-relaxed">
              <li className="hover:text-gold transition-colors duration-200 cursor-pointer min-h-[32px] flex items-center">Signals</li>
              <li className="hover:text-gold transition-colors duration-200 cursor-pointer min-h-[32px] flex items-center">Collaborations</li>
              <li className="hover:text-gold transition-colors duration-200 cursor-pointer min-h-[32px] flex items-center">Community</li>
              <li className="hover:text-gold transition-colors duration-200 cursor-pointer min-h-[32px] flex items-center">Strategy Course</li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Contact</h4>
            <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-rainy-grey leading-relaxed mb-4 sm:mb-6">
              <li>Email: info@allytz.co</li>
              <li>Phone: +255716885996</li>
              <li>Location: Dar es salaam, Tanzania</li>
              <li>Website: www.allytz.co</li>
            </ul>
            <Button className="bg-gradient-to-r from-gold-dark to-gold text-cursed-black hover:shadow-lg hover:shadow-gold/20 transition-all duration-300 min-h-[44px] text-xs sm:text-sm w-full sm:w-auto">Subscribe Now</Button>
          </div>
        </div>

        <div className="border-t border-nero mt-8 sm:mt-12 pt-6 sm:pt-8">
          {/* Disclaimer Section */}
          <div className="mb-6 pb-6 border-b border-nero/50">
            <p className="text-xs text-rainy-grey leading-relaxed text-center max-w-4xl mx-auto">
              <strong className="text-white">Risk Disclaimer:</strong> Trading in financial markets involves substantial risk of loss and is not suitable for all investors. Past performance is not indicative of future results. The information provided on this website is for educational purposes only and should not be considered as financial advice. Always conduct your own research and consult with a qualified financial advisor before making any trading decisions. AllyTZ Panel does not guarantee any specific results or profits from trading activities.
            </p>
          </div>
          
          {/* Copyright Section */}
          <div className="text-xs sm:text-sm text-rainy-grey leading-relaxed">
            <p>© {new Date().getFullYear()} AllyTZ Panel — All rights reserved.</p>
            <div className="mt-3 flex flex-wrap gap-3 sm:gap-4">
              <Link 
                to="/privacy" 
                className="hover:text-gold transition-colors duration-200 cursor-pointer min-h-[32px] flex items-center"
              >
                Privacy Policy
              </Link>
              <span className="text-steel-wool hidden sm:inline">•</span>
              <span className="hover:text-gold transition-colors duration-200 cursor-pointer min-h-[32px] flex items-center">Terms</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default PageFooter;