import React from 'react';
import { motion, useScroll } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';

interface MarketingLayoutProps {
  children: React.ReactNode;
}

const MarketingLayout: React.FC<MarketingLayoutProps> = ({ children }) => {
  const { scrollYProgress } = useScroll();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      {/* Scroll progress bar */}
      <motion.div
        className="fixed top-0 left-0 z-50 h-1 bg-emerald-500 origin-left"
        style={{ scaleX: scrollYProgress }}
      />

      <Navbar />

      <main className="pt-24 pb-16">
        {children}
      </main>

      <Footer />
    </div>
  );
};

export default MarketingLayout;





