import React from 'react';

interface GlassContainerProps {
  children: React.ReactNode;
  className?: string;
}

const GlassContainer: React.FC<GlassContainerProps> = ({ children, className = "" }) => (
  <div 
    className={`bg-white/20 backdrop-blur-2xl rounded-3xl shadow-glass-neumorphic border border-white/30 
                dark:bg-zinc-900/70 dark:border-zinc-800/60 dark:shadow-dark-glass-neumorphic 
                p-6 ${className}`}
  >
    {children}
  </div>
);

export default GlassContainer;
