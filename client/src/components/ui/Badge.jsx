import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import './Badge.css';

const Badge = ({ 
  children, 
  variant = 'default',
  className,
  ...props 
}) => {
  const badgeClass = cn(
    'badge',
    `badge-${variant}`,
    className
  );

  return (
    <motion.span
      className={badgeClass}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.2 }}
      {...props}
    >
      {children}
    </motion.span>
  );
};

export default Badge;
