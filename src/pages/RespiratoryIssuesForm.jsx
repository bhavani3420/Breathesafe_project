import React, { useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const initialForm = {
  name: "",
  age: "",
  chronicDiseases: [],
  symptoms: [],
  other: "",
  consent: false,
};

const chronicDiseaseOptions = [
  "Asthma",
  "Bronchitis",
  "COPD",
  "Pneumonia",
  "Sinusitis",
  "Tuberculosis",
  "Lung Cancer",
  "Cystic Fibrosis",
  "Pulmonary Fibrosis",
  "Pulmonary Hypertension",
  "Sleep Apnea",
  "Bronchiectasis",
  "Pleurisy",
  "Emphysema",
  "Sarcoidosis",
];

const symptomOptions = [
  "Fever",
  "Cough",
  "Breathlessness",
  "Chest Pain",
  "Wheezing",
  "Chest Tightness",
  "Rapid Breathing",
  "Coughing up Blood",
  "Blue Lips or Fingernails",
  "High Fever",
  "Severe Headache",
  "Loss of Smell/Taste",
  "Night Sweats",
  "Fatigue",
  "Loss of Appetite",
];

export default function ResponsiveHorizontalForm() {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("chronicDiseases");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      if (name === "chronicDiseases" || name === "symptoms") {
        setForm((prev) => ({
          ...prev,
          [name]: checked
            ? [...prev[name], value]
            : prev[name].filter((item) => item !== value),
        }));
      }
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const validateForm = () => {
    if (!form.name.trim()) return false;
    if (!form.age || isNaN(form.age) || Number(form.age) < 0) return false;
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please log in to submit health assessment");
        navigate("/login");
        return;
      }

      const response = await fetch(
        "http://localhost:5000/api/health-assessment",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: form.name.trim(),
            age: Number(form.age),
            chronicDiseases: form.chronicDiseases,
            symptoms: form.symptoms,
            other: form.other.trim(),
            consent: form.consent,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || `HTTP error! status: ${response.status}`
        );
      }

      if (data.success) {
        toast.success("Health assessment submitted successfully!");
        setForm(initialForm);
        navigate("/");
      } else {
        throw new Error(data.message || "Failed to submit health assessment");
      }
    } catch (error) {
      console.error("Error submitting health assessment:", error);
      toast.error(error.message || "An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setForm(initialForm);
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="max-w-4xl p-8 mx-auto mt-24 mb-12 space-y-8 transition-all bg-white border border-gray-200 shadow-2xl dark:bg-gray-800 dark:border-gray-700 rounded-2xl"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5 }}>
      <motion.h2
        className="mb-8 text-3xl font-bold text-center text-primary-700 dark:text-primary-300"
        initial={{ opacity: 0, y: -20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.5, delay: 0.2 }}>
        Respiratory Health Assessment
      </motion.h2>

      {/* Name and Age */}
      <motion.div
        className="flex flex-col gap-6 sm:flex-row"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.5, delay: 0.3 }}>
        <div className="flex flex-col flex-1">
          <label
            htmlFor="name"
            className="mb-2 font-semibold text-gray-700 dark:text-gray-200">
            Name
          </label>
          <motion.input
            id="name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            required
            placeholder="Enter your name"
            className="w-full px-4 py-3 text-gray-900 transition border border-gray-300 rounded-lg shadow-sm bg-gray-50 dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
            whileFocus={{ scale: 1.01 }}
            transition={{ duration: 0.2 }}
          />
        </div>
        <div className="flex flex-col flex-1">
          <label
            htmlFor="age"
            className="mb-2 font-semibold text-gray-700 dark:text-gray-200">
            Age
          </label>
          <motion.input
            id="age"
            name="age"
            type="number"
            min="0"
            value={form.age}
            onChange={handleChange}
            required
            placeholder="Age"
            className="w-full px-4 py-3 text-gray-900 transition border border-gray-300 rounded-lg shadow-sm bg-gray-50 dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
            whileFocus={{ scale: 1.01 }}
            transition={{ duration: 0.2 }}
          />
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        className="border-b border-gray-200 dark:border-gray-700"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.5, delay: 0.4 }}>
        <nav className="flex -mb-px space-x-8">
          <motion.button
            type="button"
            onClick={() => setActiveTab("chronicDiseases")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "chronicDiseases"
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}>
            Chronic Diseases
          </motion.button>
          <motion.button
            type="button"
            onClick={() => setActiveTab("symptoms")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "symptoms"
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}>
            Symptoms
          </motion.button>
        </nav>
      </motion.div>

      {/* Tab Content */}
      <motion.div
        className="mt-6"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.5, delay: 0.5 }}>
        {activeTab === "chronicDiseases" ? (
          <motion.div
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.1,
                },
              },
            }}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}>
            {chronicDiseaseOptions.map((disease) => (
              <motion.label
                key={disease}
                className="flex items-center gap-3 p-3 transition rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900/40"
                variants={{
                  hidden: { opacity: 0, x: -20 },
                  show: { opacity: 1, x: 0 },
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}>
                <input
                  type="checkbox"
                  name="chronicDiseases"
                  value={disease}
                  checked={form.chronicDiseases.includes(disease)}
                  onChange={handleChange}
                  className="w-4 h-4 form-checkbox accent-primary-500 focus:ring-primary-400"
                />
                <span className="text-gray-700 dark:text-gray-200">
                  {disease}
                </span>
              </motion.label>
            ))}
          </motion.div>
        ) : (
          <motion.div
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.1,
                },
              },
            }}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}>
            {symptomOptions.map((symptom) => (
              <motion.label
                key={symptom}
                className="flex items-center gap-3 p-3 transition rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900/40"
                variants={{
                  hidden: { opacity: 0, x: -20 },
                  show: { opacity: 1, x: 0 },
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}>
                <input
                  type="checkbox"
                  name="symptoms"
                  value={symptom}
                  checked={form.symptoms.includes(symptom)}
                  onChange={handleChange}
                  className="w-4 h-4 form-checkbox accent-primary-500 focus:ring-primary-400"
                />
                <span className="text-gray-700 dark:text-gray-200">
                  {symptom}
                </span>
              </motion.label>
            ))}
          </motion.div>
        )}
      </motion.div>

      {/* Additional Notes */}
      <motion.div
        className="mt-6"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.5, delay: 0.6 }}>
        <label
          htmlFor="other"
          className="block mb-2 font-semibold text-gray-700 dark:text-gray-200">
          Additional Notes
          <span className="ml-2 text-sm font-normal text-gray-500">
            (Other conditions or symptoms not listed above)
          </span>
        </label>
        <motion.textarea
          id="other"
          name="other"
          value={form.other}
          onChange={handleChange}
          rows={3}
          placeholder="Please mention any other conditions or symptoms you are experiencing..."
          className="w-full px-4 py-3 text-gray-900 transition border border-gray-300 rounded-lg shadow-sm bg-gray-50 dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
          whileFocus={{ scale: 1.01 }}
          transition={{ duration: 0.2 }}
        />
      </motion.div>

      {/* Buttons */}
      <motion.div
        className="flex justify-end gap-4 mt-8"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.5, delay: 0.7 }}>
        <motion.button
          type="button"
          onClick={handleReset}
          className="px-6 py-2 font-medium text-gray-700 transition duration-150 ease-in-out bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}>
          Reset Form
        </motion.button>
        <motion.button
          type="submit"
          disabled={submitting}
          className="px-6 py-2 font-medium text-white transition duration-150 ease-in-out rounded-lg bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}>
          {submitting ? "Submitting..." : "Submit Assessment"}
        </motion.button>
      </motion.div>
    </motion.form>
  );
}
