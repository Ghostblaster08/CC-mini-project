import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import './Button.css';

const Button = ({ 
  children, 
  variant = 'default', 
  size = 'default',
  className,
  disabled,
  ...props 
}) => {
  const buttonClass = cn(
    'btn',
    `btn-${variant}`,
    `btn-${size}`,
    disabled && 'btn-disabled',
    className
  );

  return (
    <motion.button
      className={buttonClass}
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.02, y: -2 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      transition={{ duration: 0.2 }}
      {...props}
    >
      {children}
    </motion.button>
  );
};

export default Button;
