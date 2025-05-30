import { useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { FiVolume2, FiVolumeX } from "react-icons/fi";

const DiseaseInfoPage = () => {
  const { isDarkMode } = useTheme();
  const [speakingDisease, setSpeakingDisease] = useState(null);

  const diseases = [
    {
      name: "Asthma",
      symptoms: [
        "Shortness of breath",
        "Wheezing",
        "Chest tightness",
        "Chronic cough",
      ],
      causes:
        "Airborne allergens, industrial pollutants, and respiratory irritants",
      pollutants: [
        "Pollen",
        "Dust mites",
        "Smoke from burning wood",
        "Ozone (O₃)",
      ],
    },
    {
      name: "Bronchitis",
      symptoms: [
        "Persistent cough",
        "Mucus production",
        "Fatigue",
        "Shortness of breath",
      ],
      causes: "Exposure to smoke, air pollution, and viral infections",
      pollutants: [
        "Particulate matter (PM2.5, PM10)",
        "Carbon monoxide (CO)",
        "Sulfur dioxide (SO₂)",
      ],
    },
    {
      name: "COPD",
      symptoms: [
        "Progressive breathlessness",
        "Chronic cough",
        "Frequent respiratory infections",
        "Fatigue",
      ],
      causes: "Long-term exposure to harmful gases and particulate matter",
      pollutants: [
        "Tobacco smoke",
        "Industrial dust",
        "Chemical fumes",
        "Air pollution",
      ],
    },
    {
      name: "Pneumonia",
      symptoms: [
        "High fever",
        "Cough with phlegm",
        "Difficulty breathing",
        "Chest pain",
      ],
      causes: "Bacterial or viral infections, weakened immune system",
      pollutants: [
        "Air pollution",
        "Smoke inhalation",
        "Chemical fumes",
        "Dust particles",
      ],
    },
    {
      name: "Sinusitis",
      symptoms: [
        "Nasal congestion",
        "Facial pain",
        "Headache",
        "Post-nasal drip",
      ],
      causes: "Viral infections, allergies, air pollution",
      pollutants: [
        "Airborne allergens",
        "Pollution particles",
        "Mold spores",
        "Dust",
      ],
    },
    {
      name: "Tuberculosis",
      symptoms: [
        "Persistent cough",
        "Night sweats",
        "Weight loss",
        "Chest pain",
      ],
      causes: "Bacterial infection, poor air quality",
      pollutants: [
        "Indoor air pollution",
        "Tobacco smoke",
        "Industrial emissions",
        "Dust particles",
      ],
    },
    {
      name: "Lung Cancer",
      symptoms: [
        "Persistent cough",
        "Chest pain",
        "Shortness of breath",
        "Unexplained weight loss",
      ],
      causes: "Long-term exposure to carcinogens",
      pollutants: ["Tobacco smoke", "Radon gas", "Asbestos", "Air pollution"],
    },
    {
      name: "Allergic Rhinitis",
      symptoms: ["Sneezing", "Runny nose", "Itchy eyes", "Nasal congestion"],
      causes: "Allergic reactions to airborne particles",
      pollutants: ["Pollen", "Dust mites", "Pet dander", "Mold spores"],
    },
  ];

  const toggleSpeech = (disease) => {
    if (speakingDisease === disease.name) {
      window.speechSynthesis.cancel();
      setSpeakingDisease(null);
      return;
    }

    const text = `Disease: ${
      disease.name
    }. Symptoms include: ${disease.symptoms.join(", ")}. Caused by: ${
      disease.causes
    }. Major pollutants are: ${disease.pollutants.join(", ")}.`;

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";

    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find(
      (voice) => voice.name.includes("Female") || voice.gender === "female"
    );
    if (femaleVoice) {
      utterance.voice = femaleVoice;
    }

    utterance.onend = () => setSpeakingDisease(null);
    window.speechSynthesis.speak(utterance);
    setSpeakingDisease(disease.name);
  };

  return (
    <div className="min-h-screen pt-20 pb-8 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-dark-900">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Airborne Disease Information
          </h1>
          <p className="text-base text-gray-600 dark:text-gray-300">
            Learn about common airborne diseases and their relationship with air
            quality
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {diseases.map((disease, index) => (
            <motion.div
              key={disease.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`rounded-xl p-6 relative ${
                isDarkMode
                  ? "bg-dark-800 border border-dark-700"
                  : "bg-white border border-gray-200"
              } shadow-lg hover:shadow-xl transition-all duration-300`}>
              <button
                onClick={() => toggleSpeech(disease)}
                className={`absolute top-4 right-4 p-2 rounded-full transition-colors duration-200 ${
                  speakingDisease === disease.name
                    ? "bg-red-500 hover:bg-red-600 text-white"
                    : "bg-gray-100 hover:bg-gray-200 dark:bg-dark-700 dark:hover:bg-dark-600 text-gray-600 dark:text-gray-300"
                }`}
                aria-label={
                  speakingDisease === disease.name ? "Stop" : "Listen"
                }>
                {speakingDisease === disease.name ? (
                  <FiVolumeX className="w-5 h-5" />
                ) : (
                  <FiVolume2 className="w-5 h-5" />
                )}
              </button>

              <h2 className="text-2xl font-bold text-primary-500 mb-4 pr-12">
                {disease.name}
              </h2>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Symptoms
                  </h3>
                  <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-1">
                    {disease.symptoms.map((symptom) => (
                      <li key={symptom}>{symptom}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Caused By
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {disease.causes}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Major Pollutants
                  </h3>
                  <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-1">
                    {disease.pollutants.map((pollutant) => (
                      <li key={pollutant}>{pollutant}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DiseaseInfoPage;
