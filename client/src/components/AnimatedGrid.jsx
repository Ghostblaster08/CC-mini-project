import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import './AnimatedGrid.css';

const AnimatedGrid = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Medical icons as floating shapes
  const floatingIcons = [
    { icon: '💊', x: '10%', y: '20%', delay: 0 },
    { icon: '🏥', x: '80%', y: '15%', delay: 0.5 },
    { icon: '💉', x: '15%', y: '70%', delay: 1 },
    { icon: '🩺', x: '85%', y: '65%', delay: 1.5 },
    { icon: '⚕️', x: '50%', y: '50%', delay: 2 },
    { icon: '📋', x: '25%', y: '40%', delay: 0.8 },
    { icon: '🔬', x: '70%', y: '35%', delay: 1.3 },
  ];

  return (
    <div className="animated-grid">
      {/* Gradient overlays */}
      <div className="gradient-overlay gradient-1" />
      <div className="gradient-overlay gradient-2" />
      
      {/* Grid pattern */}
      <svg className="grid-pattern" width="100%" height="100%">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              opacity="0.1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Floating medical icons */}
      {floatingIcons.map((item, index) => (
        <motion.div
          key={index}
          className="floating-icon"
          style={{ left: item.x, top: item.y }}
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: [0.3, 0.6, 0.3],
            y: [0, -15, 0],
          }}
          transition={{
            duration: 4 + index,
            repeat: Infinity,
            delay: item.delay,
            ease: 'easeInOut',
          }}
        >
          {item.icon}
        </motion.div>
      ))}

      {/* Animated lines */}
      <svg className="animated-lines" width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        {[0, 33, 66].map((xPos, i) => (
          <motion.path
            key={i}
            d={`M ${xPos} 0 Q ${xPos + 16} 50 ${xPos} 100`}
            stroke="hsl(var(--primary))"
            strokeWidth="0.5"
            fill="none"
            opacity="0.1"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ 
              pathLength: [0, 1, 0],
              opacity: [0, 0.1, 0]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              delay: i * 0.7,
              ease: 'easeInOut',
            }}
          />
        ))}
      </svg>
    </div>
  );
};

export default AnimatedGrid;
