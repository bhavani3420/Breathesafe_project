import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  FiHeart,
  FiShield,
  FiUsers,
  FiGlobe,
  FiAward,
  FiTrendingUp,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";

const AboutPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleButtonClick = (path) => {
    if (!user) {
      navigate('/login', { 
        state: { 
          background: location,
          from: path 
        } 
      });
    } else {
      navigate(path);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  // Values data
  const values = [
    {
      icon: <FiHeart className="w-8 h-8 text-primary-500" />,
      title: "Health First",
      description:
        "We prioritize your health and well-being by providing accurate air quality information and personalized health recommendations.",
    },
    {
      icon: <FiShield className="w-8 h-8 text-primary-500" />,
      title: "Data Security",
      description:
        "Your data privacy is our top priority. We ensure all your personal information and health data is securely protected.",
    },
    {
      icon: <FiUsers className="w-8 h-8 text-primary-500" />,
      title: "Community Focus",
      description:
        "We believe in building a community of informed citizens who can make better decisions for their health and environment.",
    },
  ];

  return (
    <div className="pt-16">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden bg-gradient-to-br from-primary-500 to-primary-600">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto text-center">
            <h1 className="mb-4 text-4xl font-bold text-white sm:text-5xl">
              About BreatheSafe
            </h1>
            <p className="mb-8 text-lg text-white/90">
              Empowering communities with real-time air quality data and
              personalized health insights.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="section bg-white dark:bg-dark-800">
        <div className="container-custom">
          <motion.div
            className="max-w-3xl mx-auto text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}>
            <h2 className="mb-6 text-gray-900 heading-md dark:text-white">
              Our Mission
            </h2>
            <p className="mb-8 text-lg leading-relaxed text-gray-700 dark:text-gray-300">
              We believe everyone has the right to breathe clean air.
              BreatheSafe provides accurate, real-time air quality data and
              personalized health insights to help you make informed decisions
              about your outdoor activities and take control of your respiratory
              health.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <button
                onClick={() => handleButtonClick('/live-aqi')}
                className="btn-primary"
              >
                Check Your Air Quality
              </button>
              <button
                onClick={() => handleButtonClick('/forecasting')}
                className="btn-secondary"
              >
                View AQI Forecast
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Values Section */}
      <section className="section bg-gray-50 dark:bg-dark-900">
        <div className="container-custom">
          <motion.div
            className="mb-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}>
            <h2 className="mb-4 text-gray-900 heading-md dark:text-white">
              Our Values
            </h2>
            <p className="max-w-2xl mx-auto text-lg text-gray-600 dark:text-gray-400">
              These core values guide everything we do at BreatheSafe.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 gap-8 md:grid-cols-3"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}>
            {values.map((value, index) => (
              <motion.div key={index} variants={itemVariants}>
                <div className="h-full p-6 card">
                  <div className="flex flex-col items-center text-center">
                    <div className="p-3 mb-4 bg-primary-50 dark:bg-primary-900/30 rounded-xl">
                      {value.icon}
                    </div>
                    <h3 className="mb-3 text-xl font-semibold text-gray-900 dark:text-white">
                      {value.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {value.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
