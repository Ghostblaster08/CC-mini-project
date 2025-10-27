import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import Button from './ui/Button';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  // Don't show navbar on landing, login, or register pages
  if (['/', '/login', '/register'].includes(location.pathname)) {
    return null;
  }

  const handleLogout = () => {
    logout();
  };

  return (
    <motion.nav
      className="navbar"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="navbar-container">
        <Link to="/dashboard" className="navbar-brand">
          <span className="brand-icon">💊</span>
          <span className="brand-text font-calligraphic">Ashray</span>
        </Link>

        <div className="navbar-menu">
          {user && (
            <>
              <Link
                to="/dashboard"
                className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
              >
                Dashboard
              </Link>
              
              {user.role === 'patient' && (
                <>
                  <Link
                    to="/medications"
                    className={`nav-link ${location.pathname === '/medications' ? 'active' : ''}`}
                  >
                    Medications
                  </Link>
                  <Link
                    to="/prescriptions"
                    className={`nav-link ${location.pathname === '/prescriptions' ? 'active' : ''}`}
                  >
                    Prescriptions
                  </Link>
                </>
              )}

              {user.role === 'pharmacy' && (
                <>
                  <Link
                    to="/pharmacy/inventory"
                    className={`nav-link ${location.pathname === '/pharmacy/inventory' ? 'active' : ''}`}
                  >
                    Inventory
                  </Link>
                  <Link
                    to="/pharmacy/orders"
                    className={`nav-link ${location.pathname === '/pharmacy/orders' ? 'active' : ''}`}
                  >
                    Orders
                  </Link>
                </>
              )}
            </>
          )}
        </div>

        <div className="navbar-actions">
          <ThemeToggle />
          {user && (
            <>
              <span className="user-name">Hi, {user.name}!</span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </>
          )}
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
