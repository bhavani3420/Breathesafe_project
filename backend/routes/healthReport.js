const express = require('express');
const jwt = require('jsonwebtoken');
const HealthReport = require('../models/HealthReport');
const HealthAssessment = require('../models/HealthAssessment');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const router = express.Router();

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Middleware to verify JWT token
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Please authenticate' });
  }
};

// Generate health report
router.post('/generate', auth, async (req, res) => {
  try {
    // Check if Gemini API key is configured
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'AI service is not properly configured. Please contact support.'
      });
    }

    const { location, aqiData } = req.body;

    if (!location || !aqiData) {
      return res.status(400).json({
        success: false,
        message: 'Missing required data: location and aqiData are required'
      });
    }
    
    // Get latest health assessment with all user data
    const healthAssessment = await HealthAssessment.findOne({ userId: req.userId })
      .sort({ timestamp: -1 })
      .lean();

    if (!healthAssessment) {
      return res.status(400).json({
        success: false,
        message: 'Please complete a health assessment first'
      });
    }

    if (!healthAssessment.name || !healthAssessment.age || !healthAssessment.symptoms) {
      return res.status(400).json({
        success: false,
        message: 'Your health assessment is incomplete. Please update it with all required information.'
      });
    }

    // Check if health assessment is recent (within last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    if (new Date(healthAssessment.timestamp) < thirtyDaysAgo) {
      return res.status(400).json({
        success: false,
        message: 'Your health assessment is more than 30 days old. Please fill out a new health assessment form for accurate recommendations.'
      });
    }

    // Enhanced prompt for Gemini with detailed age-specific analysis and specific medicine recommendations
    const prompt = `You are a professional medical advisor specializing in air quality impacts and respiratory health. Based on the following health information, provide concise yet comprehensive health recommendations:

    Current Air Quality Status:
    - AQI Value: ${aqiData.value}
    - AQI Category: ${aqiData.status}
    - Current Time: ${new Date().toLocaleTimeString()}
    - Current Date: ${new Date().toLocaleDateString()}
    
    User Health Profile:
    - Name: ${healthAssessment.name}
    - Age: ${healthAssessment.age} years old
    - Reported Health Issues: ${healthAssessment.symptoms.join(', ')}
    ${healthAssessment.other ? `- Additional Health Information: ${healthAssessment.other}` : ''}
    
    Please provide recommendations focusing on:
    1. Age-specific health considerations
    2. Medication guidance for reported conditions
    3. Outdoor activity safety based on current AQI
    4. Protective measures and mask recommendations

    Return a JSON object with this structure:
    {
      "userProfile": {
        "age": ${healthAssessment.age},
        "ageGroup": "[determine appropriate age group: infant/child/teen/adult/senior]",
        "riskLevel": "[low/moderate/high based on age and AQI]"
      },
      "generalRecommendations": [
        "Clear, actionable recommendations for current AQI conditions"
      ],
      "ageSpecificRecommendations": [
        "Age-appropriate health guidance"
      ],
      "healthSpecificRecommendations": [
        "Condition-specific recommendations"
      ],
      "outdoorActivitySafety": {
        "isSafe": "[true/false based on current AQI]",
        "recommendation": "Clear guidance on outdoor activities with specific time recommendations"
      },
      "maskRecommendations": {
        "isRecommended": "[true/false based on AQI and health conditions]",
        "type": "Specific mask type recommendation",
        "usage": "Clear instructions for mask usage"
      },
      "medicationRecommendations": {
        "general": "General medication guidance",
        "specific": "Specific medication recommendations for reported conditions",
        "disclaimer": "Medical advice disclaimer"
      }
    }`;

    try {
      // Generate report using Gemini
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      });
      
      const response = await result.response;
      const responseText = response.text();
      
      let reportData;
      try {
        // Clean the response text to ensure it's valid JSON
        let cleanedText = responseText.replace(/```json\n?|\n?```/g, '').trim();
        
        // Additional cleaning to handle potential formatting issues
        const jsonStart = cleanedText.indexOf('{');
        const jsonEnd = cleanedText.lastIndexOf('}');
        
        if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
          cleanedText = cleanedText.substring(jsonStart, jsonEnd + 1);
        }
        
        reportData = JSON.parse(cleanedText);
        
        // If outdoorActivitySafety or maskRecommendations are missing, create detailed default values
        if (!reportData.outdoorActivitySafety) {
          const aqi = aqiData.value;
          let outdoorRecommendation = '';
          
          if (aqi < 50) {
            outdoorRecommendation = `With the current excellent air quality (AQI ${aqi}), enjoy outdoor activities freely 🌳. Morning walks 🌅 and afternoon exercises 🏃‍♀️ are perfectly safe for your respiratory health. Even extended outdoor activities like hiking 🥾 or cycling 🚴‍♀️ pose minimal risk. Keep windows open to allow fresh air circulation throughout your home 🏠.`;
          } else if (aqi < 100) {
            outdoorRecommendation = `With moderate air quality (AQI ${aqi}), most outdoor activities remain safe 🌲. Consider early morning exercises 🌄 when air quality is typically better. Limit strenuous activities like running 🏃‍♀️ to less than 60 minutes. If you experience any respiratory discomfort 😮‍💨, take breaks and move indoors.`;
          } else if (aqi < 150) {
            outdoorRecommendation = `With the current air quality (AQI ${aqi}), reduce prolonged outdoor exertion ⚠️. Morning hours 🌅 typically have better air quality for essential outdoor activities. Limit outdoor exercise to 30 minutes or less 🕐. Keep windows closed during peak pollution hours 🏙️ and use air purifiers indoors if available 🔄.`;
          } else {
            outdoorRecommendation = `With poor air quality (AQI ${aqi}), minimize all outdoor activities 🚫. Stay indoors with windows closed as much as possible 🏠. If you must go outside, limit your time to essential activities only ⏱️. Early morning hours 🌅 may have slightly better air quality if outdoor activity is unavoidable. Consider using air purifiers indoors 🔄.`;
          }
          
          reportData.outdoorActivitySafety = {
            isSafe: aqi < 100,
            recommendation: outdoorRecommendation
          };
        }
        
        if (!reportData.maskRecommendations) {
          const aqi = aqiData.value;
          let maskType = '';
          let maskUsage = '';
          let isRecommended = false;
          
          if (aqi < 50) {
            isRecommended = false;
            maskType = 'Not necessary';
            maskUsage = `With excellent air quality (AQI ${aqi}), masks are generally not necessary for most people 😊. If you have severe respiratory conditions, you might keep a cloth mask handy as a precaution 🧣. Focus instead on maintaining good indoor air quality with proper ventilation 🪟. Enjoy outdoor activities mask-free while maintaining good respiratory hygiene practices 🌬️.`;
          } else if (aqi < 100) {
            isRecommended = reportData.healthData && reportData.healthData.symptoms && reportData.healthData.symptoms.length > 0;
            maskType = 'Surgical or high-quality cloth mask';
            maskUsage = `With moderate air quality (AQI ${aqi}), consider wearing a mask if you have respiratory conditions 😷. Surgical or high-quality cloth masks are sufficient for brief outdoor activities 🚶‍♀️. Ensure your mask fits properly around your face without gaps 👌. Replace disposable masks daily or when they become damp or visibly soiled 📅.`;
          } else if (aqi < 150) {
            isRecommended = true;
            maskType = 'N95 or KN95 mask for sensitive individuals';
            maskUsage = `With the current air quality (AQI ${aqi}), wearing a mask outdoors is recommended, especially for sensitive individuals 😷. N95 or KN95 masks provide better filtration for pollution particles 🧫. Ensure a proper seal around your face for maximum protection 👍. Limit mask use to 4-6 hours per mask and avoid reusing disposable masks multiple times 🔄.`;
          } else {
            isRecommended = true;
            maskType = 'N95 or KN95 mask';
            maskUsage = `With poor air quality (AQI ${aqi}), N95 or KN95 masks are strongly recommended whenever outdoors 😷. These masks filter small particles effectively when properly fitted 🔍. Change your mask daily or when it becomes difficult to breathe through 📆. Even with a mask, minimize time outdoors and keep indoor air clean with air purifiers 🏠.`;
          }
          
          reportData.maskRecommendations = {
            isRecommended: isRecommended,
            type: maskType,
            usage: maskUsage
          };
        }
        
        // Add medication recommendations if not provided by Gemini
        if (!reportData.medicationRecommendations) {
          const symptoms = healthAssessment.symptoms || [];
          let specificAdvice = '';
          
          // Create specific advice based on reported symptoms
          if (symptoms.includes('Cough')) {
            specificAdvice += `For your cough, consider the following medications:
            - For dry cough: Dextromethorphan (Robitussin DM, Delsym)
            - For productive cough: Guaifenesin (Mucinex, Robitussin)
            - For cough with congestion: Pseudoephedrine + Guaifenesin (Mucinex D)
            - Natural remedies: Honey and lemon tea, Throat Coat tea
            Note: If cough persists beyond 7 days, consult a healthcare professional.`;
          }
          
          if (symptoms.includes('Shortness of breath')) {
            specificAdvice += `For shortness of breath:
            - Prescription inhalers: Albuterol (ProAir, Ventolin) for rescue
            - Long-acting bronchodilators: Salmeterol (Serevent), Formoterol (Foradil)
            - Inhaled corticosteroids: Fluticasone (Flovent), Budesonide (Pulmicort)
            - Combination inhalers: Fluticasone/Salmeterol (Advair), Budesonide/Formoterol (Symbicort)
            Note: Always keep rescue inhalers accessible and seek immediate medical attention for severe symptoms.`;
          }
          
          if (symptoms.includes('Wheezing')) {
            specificAdvice += `For wheezing:
            - Quick-relief inhalers: Albuterol (ProAir, Ventolin)
            - Long-term control: Montelukast (Singulair)
            - Inhaled corticosteroids: Fluticasone (Flovent), Budesonide (Pulmicort)
            - Combination medications: Fluticasone/Salmeterol (Advair)
            Note: Monitor peak flow readings if you have a meter and stay in air-conditioned environments during poor air quality.`;
          }
          
          if (symptoms.includes('Sore throat')) {
            specificAdvice += `For sore throat:
            - Pain relief: Acetaminophen (Tylenol), Ibuprofen (Advil)
            - Throat lozenges: Cepacol, Chloraseptic
            - Numbing sprays: Chloraseptic spray, Vicks VapoSpray
            - Natural remedies: Warm salt water gargles, Throat Coat tea
            Note: Avoid irritants like smoking and stay hydrated.`;
          }
          
          if (symptoms.includes('Nasal congestion')) {
            specificAdvice += `For nasal congestion:
            - Decongestants: Pseudoephedrine (Sudafed), Phenylephrine (Sudafed PE)
            - Nasal sprays: Oxymetazoline (Afrin), Fluticasone (Flonase)
            - Antihistamines: Loratadine (Claritin), Cetirizine (Zyrtec)
            - Saline rinses: NeilMed Sinus Rinse, Simply Saline
            Note: Limit decongestant use to 3 days to avoid rebound congestion.`;
          }
          
          if (symptoms.includes('Eye irritation')) {
            specificAdvice += `For eye irritation:
            - Artificial tears: Systane, Refresh, TheraTears
            - Antihistamine eye drops: Ketotifen (Zaditor), Naphazoline/Pheniramine (Visine-A)
            - Preservative-free options: Refresh Plus, TheraTears PF
            Note: Avoid rubbing eyes and consider wearing wraparound sunglasses outdoors.`;
          }
          
          if (symptoms.includes('Headache')) {
            specificAdvice += `For headaches:
            - Pain relievers: Acetaminophen (Tylenol), Ibuprofen (Advil), Aspirin
            - Combination medications: Acetaminophen/Aspirin/Caffeine (Excedrin)
            - Migraine specific: Sumatriptan (Imitrex), Rizatriptan (Maxalt)
            Note: Stay hydrated and rest in a dark, quiet room. Seek medical attention for severe or persistent headaches.`;
          }
          
          // If no specific symptoms or empty symptoms array
          if (specificAdvice === '') {
            specificAdvice = `Based on your health profile, focus on preventive measures:
            - General antihistamines: Loratadine (Claritin), Cetirizine (Zyrtec)
            - Vitamin supplements: Vitamin C, Vitamin D3
            - Antioxidant supplements: Quercetin, N-acetylcysteine
            Note: Always consult with a healthcare professional before starting any new medication.`;
          }
          
          const disclaimer = "These medication recommendations are for informational purposes only and do not constitute medical advice. Always consult with a qualified healthcare professional before starting, stopping, or changing any medication regimen. Some medications may have contraindications or interact with other medications you are taking.";
          
          reportData.medicationRecommendations = {
            specific: specificAdvice,
            disclaimer: disclaimer
          };
        }
      } catch (parseError) {
        // Create default data if parsing fails
        reportData = {
          userProfile: {
            age: healthAssessment.age,
            ageGroup: healthAssessment.age < 18 ? 'Child' : healthAssessment.age < 60 ? 'Adult' : 'Senior',
            riskLevel: aqiData.value > 150 ? 'High' : aqiData.value > 100 ? 'Moderate' : 'Low'
          },
          generalRecommendations: [
            `Based on the current AQI of ${aqiData.value}, it's recommended to ${aqiData.value > 150 ? 'stay indoors when possible' : 'monitor air quality before outdoor activities'} ⚠️`
          ],
          ageSpecificRecommendations: [
            `For your age group (${healthAssessment.age} years), ${aqiData.value > 100 ? 'take extra precautions' : 'regular precautions are sufficient'} when exposed to current air quality 👥`
          ],
          healthSpecificRecommendations: [
            `For your reported symptoms (${healthAssessment.symptoms.join(', ')}), consider staying in well-ventilated areas and using air purifiers if available 🏥`
          ],
          outdoorActivitySafety: {
            isSafe: aqiData.value < 100,
            recommendation: `Based on the current AQI of ${aqiData.value}, ${aqiData.value < 100 ? 'outdoor activities are generally safe' : 'it\'s recommended to limit outdoor activities'} 🌳`
          },
          maskRecommendations: {
            isRecommended: aqiData.value > 100,
            type: aqiData.value > 150 ? 'N95 or KN95 mask' : 'Surgical or cloth mask',
            usage: `${aqiData.value > 100 ? 'Wearing a mask is recommended when outdoors' : 'Masks are generally not needed at this air quality level'} 😷`
          }
        };
      }

      // Validate report data structure
      if (!reportData.generalRecommendations || !reportData.ageSpecificRecommendations || !reportData.healthSpecificRecommendations) {
        throw new Error('Invalid response format from AI');
      }

      // Prepare health report data
      const healthReportData = {
        userId: req.userId,
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          name: location.name
        },
        aqiData: {
          value: aqiData.value,
          status: aqiData.status,
          pollutants: aqiData.pollutants,
          timestamp: new Date()
        },
        healthData: {
          name: healthAssessment.name,
          age: healthAssessment.age,
          symptoms: healthAssessment.symptoms,
          other: healthAssessment.other || '',
          assessmentDate: healthAssessment.timestamp
        },
        report: {
          userProfile: {
            name: healthAssessment.name,
            age: healthAssessment.age,
            ageGroup: reportData.userProfile?.ageGroup || `${healthAssessment.age < 18 ? 'Child' : healthAssessment.age < 60 ? 'Adult' : 'Senior'}`,
            riskLevel: reportData.userProfile?.riskLevel || 'Medium'
          },
          generalRecommendations: reportData.generalRecommendations || [],
          ageSpecificRecommendations: reportData.ageSpecificRecommendations || [],
          healthSpecificRecommendations: reportData.healthSpecificRecommendations || [],
          medicationRecommendations: {
            general: reportData.medicationRecommendations?.general || '',
            specific: new Map(Object.entries(reportData.medicationRecommendations?.specific || {})),
            disclaimer: reportData.medicationRecommendations?.disclaimer || 'Always consult with a healthcare professional before taking any medication.'
          },
          activityGuidelines: {
            outdoor: reportData.outdoorActivitySafety?.recommendation || 'No specific outdoor activity recommendations',
            indoor: 'Stay indoors if symptoms worsen',
            exercise: 'Adjust exercise intensity based on symptoms'
          },
          protectiveMeasures: [],
          timestamp: new Date()
        }
      };

      // Create and save the health report
      const healthReport = new HealthReport(healthReportData);
      await healthReport.save();

      // Send response with user details
      const responseData = {
        success: true,
        message: 'Health report generated successfully',
        report: {
          _id: healthReport._id,
          timestamp: healthReport.timestamp,
          personalInfo: {
            name: healthAssessment.name,
            age: healthAssessment.age,
            ageGroup: reportData.userProfile.ageGroup,
            riskLevel: reportData.userProfile.riskLevel
          },
          location: healthReport.location,
          airQuality: {
            ...healthReport.aqiData,
            timestamp: new Date()
          },
          healthStatus: {
            reportedIssues: healthAssessment.symptoms,
            additionalInfo: healthAssessment.other || '',
            lastAssessmentDate: healthAssessment.timestamp
          },
          outdoorActivitySafety: reportData.outdoorActivitySafety || {
            isSafe: false,
            recommendation: 'No specific outdoor activity recommendations available'
          },
          maskRecommendations: reportData.maskRecommendations || {
            isRecommended: false,
            type: 'No specific mask type recommendation available',
            usage: 'No specific mask usage recommendation available'
          },
          recommendations: {
            general: reportData.generalRecommendations,
            ageSpecific: reportData.ageSpecificRecommendations,
            healthSpecific: reportData.healthSpecificRecommendations,
            activities: {
              outdoor: reportData.activityGuidelines?.outdoor || '',
              indoor: reportData.activityGuidelines?.indoor || '',
              exercise: reportData.activityGuidelines?.exercise || ''
            },
            precautions: reportData.protectiveMeasures || []
          }
        }
      };

      res.status(200).json(responseData);
    } catch (geminiError) {
      // Check for specific API key related errors
      if (geminiError.message.includes('API key') || geminiError.message.includes('authentication')) {
        return res.status(500).json({
          success: false,
          message: 'Invalid API key. Please check your configuration.',
          error: 'API_KEY_ERROR'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error generating health report with AI',
        error: geminiError.message
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating health report',
      error: error.message
    });
  }
});

// Get user's health reports
router.get('/my-reports', auth, async (req, res) => {
  try {
    const reports = await HealthReport.find({ userId: req.userId })
      .sort({ 'report.timestamp': -1 });
    res.json({
      success: true,
      reports
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching reports',
      error: error.message
    });
  }
});

// Get specific health report
router.get('/reports/:id', auth, async (req, res) => {
  try {
    const report = await HealthReport.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Create a copy of the report to modify
    const reportData = report.toObject();
    
    // Ensure outdoorActivitySafety is present with detailed recommendations
    if (!reportData.outdoorActivitySafety) {
      const aqi = reportData.aqiData.value;
      let outdoorRecommendation = '';
      
      if (aqi < 50) {
        outdoorRecommendation = `With the current excellent air quality (AQI ${aqi}), enjoy outdoor activities freely 🌳. Morning walks 🌅 and afternoon exercises 🏃‍♀️ are perfectly safe for your respiratory health. Even extended outdoor activities like hiking 🥾 or cycling 🚴‍♀️ pose minimal risk. Keep windows open to allow fresh air circulation throughout your home 🏠.`;
      } else if (aqi < 100) {
        outdoorRecommendation = `With moderate air quality (AQI ${aqi}), most outdoor activities remain safe 🌲. Consider early morning exercises 🌄 when air quality is typically better. Limit strenuous activities like running 🏃‍♀️ to less than 60 minutes. If you experience any respiratory discomfort 😮‍💨, take breaks and move indoors.`;
      } else if (aqi < 150) {
        outdoorRecommendation = `With the current air quality (AQI ${aqi}), reduce prolonged outdoor exertion ⚠️. Morning hours 🌅 typically have better air quality for essential outdoor activities. Limit outdoor exercise to 30 minutes or less 🕐. Keep windows closed during peak pollution hours 🏙️ and use air purifiers indoors if available 🔄.`;
      } else {
        outdoorRecommendation = `With poor air quality (AQI ${aqi}), minimize all outdoor activities 🚫. Stay indoors with windows closed as much as possible 🏠. If you must go outside, limit your time to essential activities only ⏱️. Early morning hours 🌅 may have slightly better air quality if outdoor activity is unavoidable. Consider using air purifiers indoors 🔄.`;
      }
      
      reportData.outdoorActivitySafety = {
        isSafe: aqi < 100,
        recommendation: outdoorRecommendation
      };
    }
    
    // Ensure maskRecommendations is present with detailed recommendations
    if (!reportData.maskRecommendations) {
      const aqi = reportData.aqiData.value;
      let maskType = '';
      let maskUsage = '';
      let isRecommended = false;
      
      if (aqi < 50) {
        isRecommended = false;
        maskType = 'Not necessary';
        maskUsage = `With excellent air quality (AQI ${aqi}), masks are generally not necessary for most people 😊. If you have severe respiratory conditions, you might keep a cloth mask handy as a precaution 🧣. Focus instead on maintaining good indoor air quality with proper ventilation 🪟. Enjoy outdoor activities mask-free while maintaining good respiratory hygiene practices 🌬️.`;
      } else if (aqi < 100) {
        isRecommended = reportData.healthData && reportData.healthData.symptoms && reportData.healthData.symptoms.length > 0;
        maskType = 'Surgical or high-quality cloth mask';
        maskUsage = `With moderate air quality (AQI ${aqi}), consider wearing a mask if you have respiratory conditions 😷. Surgical or high-quality cloth masks are sufficient for brief outdoor activities 🚶‍♀️. Ensure your mask fits properly around your face without gaps 👌. Replace disposable masks daily or when they become damp or visibly soiled 📅.`;
      } else if (aqi < 150) {
        isRecommended = true;
        maskType = 'N95 or KN95 mask for sensitive individuals';
        maskUsage = `With the current air quality (AQI ${aqi}), wearing a mask outdoors is recommended, especially for sensitive individuals 😷. N95 or KN95 masks provide better filtration for pollution particles 🧫. Ensure a proper seal around your face for maximum protection 👍. Limit mask use to 4-6 hours per mask and avoid reusing disposable masks multiple times 🔄.`;
      } else {
        isRecommended = true;
        maskType = 'N95 or KN95 mask';
        maskUsage = `With poor air quality (AQI ${aqi}), N95 or KN95 masks are strongly recommended whenever outdoors 😷. These masks filter small particles effectively when properly fitted 🔍. Change your mask daily or when it becomes difficult to breathe through 📆. Even with a mask, minimize time outdoors and keep indoor air clean with air purifiers 🏠.`;
      }
      
      reportData.maskRecommendations = {
        isRecommended: isRecommended,
        type: maskType,
        usage: maskUsage
      };
    }
    
    // Add medication recommendations if not provided
    if (!reportData.medicationRecommendations) {
      const symptoms = reportData.healthData.symptoms || [];
      let specificAdvice = '';
      
      // Create specific advice based on reported symptoms
      if (symptoms.includes('Cough')) {
        specificAdvice += `For your cough, consider the following medications:
        - For dry cough: Dextromethorphan (Robitussin DM, Delsym)
        - For productive cough: Guaifenesin (Mucinex, Robitussin)
        - For cough with congestion: Pseudoephedrine + Guaifenesin (Mucinex D)
        - Natural remedies: Honey and lemon tea, Throat Coat tea
        Note: If cough persists beyond 7 days, consult a healthcare professional.`;
      }
      
      if (symptoms.includes('Shortness of breath')) {
        specificAdvice += `For shortness of breath:
        - Prescription inhalers: Albuterol (ProAir, Ventolin) for rescue
        - Long-acting bronchodilators: Salmeterol (Serevent), Formoterol (Foradil)
        - Inhaled corticosteroids: Fluticasone (Flovent), Budesonide (Pulmicort)
        - Combination inhalers: Fluticasone/Salmeterol (Advair), Budesonide/Formoterol (Symbicort)
        Note: Always keep rescue inhalers accessible and seek immediate medical attention for severe symptoms.`;
      }
      
      if (symptoms.includes('Wheezing')) {
        specificAdvice += `For wheezing:
        - Quick-relief inhalers: Albuterol (ProAir, Ventolin)
        - Long-term control: Montelukast (Singulair)
        - Inhaled corticosteroids: Fluticasone (Flovent), Budesonide (Pulmicort)
        - Combination medications: Fluticasone/Salmeterol (Advair)
        Note: Monitor peak flow readings if you have a meter and stay in air-conditioned environments during poor air quality.`;
      }
      
      if (symptoms.includes('Sore throat')) {
        specificAdvice += `For sore throat:
        - Pain relief: Acetaminophen (Tylenol), Ibuprofen (Advil)
        - Throat lozenges: Cepacol, Chloraseptic
        - Numbing sprays: Chloraseptic spray, Vicks VapoSpray
        - Natural remedies: Warm salt water gargles, Throat Coat tea
        Note: Avoid irritants like smoking and stay hydrated.`;
      }
      
      if (symptoms.includes('Nasal congestion')) {
        specificAdvice += `For nasal congestion:
        - Decongestants: Pseudoephedrine (Sudafed), Phenylephrine (Sudafed PE)
        - Nasal sprays: Oxymetazoline (Afrin), Fluticasone (Flonase)
        - Antihistamines: Loratadine (Claritin), Cetirizine (Zyrtec)
        - Saline rinses: NeilMed Sinus Rinse, Simply Saline
        Note: Limit decongestant use to 3 days to avoid rebound congestion.`;
      }
      
      if (symptoms.includes('Eye irritation')) {
        specificAdvice += `For eye irritation:
        - Artificial tears: Systane, Refresh, TheraTears
        - Antihistamine eye drops: Ketotifen (Zaditor), Naphazoline/Pheniramine (Visine-A)
        - Preservative-free options: Refresh Plus, TheraTears PF
        Note: Avoid rubbing eyes and consider wearing wraparound sunglasses outdoors.`;
      }
      
      if (symptoms.includes('Headache')) {
        specificAdvice += `For headaches:
        - Pain relievers: Acetaminophen (Tylenol), Ibuprofen (Advil), Aspirin
        - Combination medications: Acetaminophen/Aspirin/Caffeine (Excedrin)
        - Migraine specific: Sumatriptan (Imitrex), Rizatriptan (Maxalt)
        Note: Stay hydrated and rest in a dark, quiet room. Seek medical attention for severe or persistent headaches.`;
      }
      
      // If no specific symptoms or empty symptoms array
      if (specificAdvice === '') {
        specificAdvice = `Based on your health profile, focus on preventive measures:
        - General antihistamines: Loratadine (Claritin), Cetirizine (Zyrtec)
        - Vitamin supplements: Vitamin C, Vitamin D3
        - Antioxidant supplements: Quercetin, N-acetylcysteine
        Note: Always consult with a healthcare professional before starting any new medication.`;
      }
      
      // const disclaimer = "These medication recommendations are for informational purposes only and do not constitute medical advice. Always consult with a qualified healthcare professional before starting, stopping, or changing any medication regimen.";
      
      reportData.medicationRecommendations = {
        specific: specificAdvice,
        
      };
    }

    res.json({
      success: true,
      report: reportData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching report',
      error: error.message
    });
  }
});

// Get count of health reports for logged-in user
router.get('/count', auth, async (req, res) => {
  try {
    const count = await HealthReport.countDocuments({ userId: req.userId });
    res.json({
      success: true,
      count
    });
  } catch (error) {
    console.error('Error fetching health reports count:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching health reports count',
      error: error.message
    });
  }
});

module.exports = router;
