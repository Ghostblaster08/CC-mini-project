import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AnimatedGrid from '../components/AnimatedGrid';
import Button from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import './LandingPage.css';

const LandingPage = () => {
  const [showTitle, setShowTitle] = useState(false);
  const [showSubtitle, setShowSubtitle] = useState(false);
  const [showCTA, setShowCTA] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => setShowTitle(true), 300);
    const timer2 = setTimeout(() => setShowSubtitle(true), 800);
    const timer3 = setTimeout(() => setShowCTA(true), 1300);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  const features = [
    {
      icon: '💊',
      title: 'Medication Reminders',
      description: 'Never miss a dose with smart, timely notifications and adherence tracking.'
    },
    {
      icon: '📱',
      title: 'Digital Prescriptions',
      description: 'Upload and manage prescriptions securely in the cloud with instant pharmacy access.'
    },
    {
      icon: '📊',
      title: 'Health Analytics',
      description: 'Track medication adherence and view comprehensive health reports.'
    },
    {
      icon: '🏥',
      title: 'Pharmacy Management',
      description: 'Complete inventory tracking, prescription processing, and patient management.'
    },
    {
      icon: '☁️',
      title: 'Cloud Integration',
      description: 'Secure AWS infrastructure with MongoDB Atlas and S3 storage.'
    },
    {
      icon: '🔒',
      title: 'Secure & Private',
      description: 'End-to-end encryption with role-based access control for all health data.'
    }
  ];

  return (
    <div className="landing-page">
      <AnimatedGrid />

      <div className="landing-content z-20">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="container">
            {showTitle && (
              <motion.h1
                className="hero-title font-calligraphic"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1 }}
              >
                <span className="hero-logo">Ashray</span>
                <br />
                Cloud Pharmacy System
              </motion.h1>
            )}

            {showSubtitle && (
              <motion.p
                className="hero-subtitle"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.3 }}
              >
                Bridging patients and pharmacies with intelligent medication management,
                <br />
                secure cloud storage, and real-time health tracking.
              </motion.p>
            )}

            {showCTA && (
              <motion.div
                className="hero-cta"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
              >
                <Link to="/register">
                  <Button size="lg">Get Started Free</Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" size="lg">Sign In</Button>
                </Link>
              </motion.div>
            )}
          </div>
        </section>

        {/* Features Section */}
        <section className="features-section">
          <div className="container">
            <motion.h2
              className="section-title font-calligraphic text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              Everything You Need for Better Health
            </motion.h2>

            <div className="features-grid">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Card>
                    <CardHeader>
                      <div className="feature-icon">{feature.icon}</div>
                      <CardTitle>{feature.title}</CardTitle>
                      <CardDescription>{feature.description}</CardDescription>
                    </CardHeader>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="cta-section">
          <div className="container">
            <motion.div
              className="cta-card"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="cta-title font-calligraphic">Ready to Transform Your Health Management?</h2>
              <p className="cta-description">
                Join thousands of patients and pharmacies already using Ashray.
              </p>
              <Link to="/register">
                <Button size="lg">Create Account Now</Button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="landing-footer">
          <div className="container">
            <p>© 2025 Ashray Pharmacy System. Built with ❤️ by Group 3</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;
