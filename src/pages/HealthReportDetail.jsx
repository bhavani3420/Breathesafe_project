import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiAlertCircle, FiClock, FiMapPin, FiDownload, FiUser, FiActivity, FiShield } from 'react-icons/fi';
import html2pdf from 'html2pdf.js';

const HealthReportDetail = () => {
  // Helper function to get color class based on AQI value
  const getAqiColorClass = (aqi) => {
    if (aqi <= 50) return 'bg-success-500';
    if (aqi <= 100) return 'bg-yellow-500';
    if (aqi <= 150) return 'bg-orange-500';
    if (aqi <= 200) return 'bg-danger-500';
    if (aqi <= 300) return 'bg-purple-500';
    return 'bg-red-900';
  };

  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Please log in to view health reports');
          setLoading(false);
          return;
        }

        const response = await fetch(`http://localhost:5000/api/health-report/reports/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.success) {
          setReport(data.report);
        } else {
          setError(data.message || 'Failed to fetch report');
        }
      } catch (err) {
        console.error('Error fetching health report:', err);
        setError('Failed to fetch health report');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchReport();
    }
  }, [id]);

  const downloadReport = () => {
    if (!report) return;
    
    setDownloading(true);
    const reportElement = document.getElementById('health-report');
    const options = {
      margin: 10,
      filename: `health-report-${report._id}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf()
      .from(reportElement)
      .set(options)
      .save()
      .then(() => {
        setDownloading(false);
      })
      .catch(err => {
        console.error('Error generating PDF:', err);
        setDownloading(false);
      });
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6 bg-gray-50 dark:bg-dark-900">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center">
            <div className="w-10 h-10 border-4 rounded-full border-primary-500 border-t-transparent animate-spin"></div>
            <span className="ml-3 text-gray-700 dark:text-gray-300">Loading health report...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-6 bg-gray-50 dark:bg-dark-900">
        <div className="max-w-4xl mx-auto">
          <div className="p-4 text-center text-danger-500 bg-danger-50 dark:bg-danger-900/30 rounded-lg">
            <FiAlertCircle className="w-6 h-6 mx-auto mb-2" />
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen p-6 bg-gray-50 dark:bg-dark-900">
        <div className="max-w-4xl mx-auto">
          <div className="p-4 text-center text-warning-500 bg-warning-50 dark:bg-warning-900/30 rounded-lg">
            <FiAlertCircle className="w-6 h-6 mx-auto mb-2" />
            <p>No report data available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      <div className="container-custom py-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white dark:bg-dark-800 rounded-xl shadow-lg overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-dark-700">
              <div className="flex items-center justify-between">
                <Link
                  to="/dashboard"
                  className="flex items-center text-primary-500 hover:text-primary-600 transition-colors"
          >
            <FiArrowLeft className="w-5 h-5 mr-2" />
                  Back to Dashboard
          </Link>
                <button
                  onClick={downloadReport}
                  disabled={downloading}
                  className="flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
                >
                  {downloading ? (
                    <>
                      <div className="w-4 h-4 mr-2 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
                      Generating PDF...
                    </>
                  ) : (
                    <>
                      <FiDownload className="w-4 h-4 mr-2" />
                      Download Report
                    </>
                  )}
                </button>
              </div>
        </div>

            {/* Report Content */}
            <div id="health-report" className="p-6 space-y-8">
              {/* Personal Info */}
              <section className="p-6 bg-gray-50 dark:bg-dark-700 rounded-lg">
                <div className="flex items-center mb-4">
                  <FiUser className="w-6 h-6 text-primary-500 mr-3" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Personal Information</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                    <p className="text-gray-900 dark:text-white">{report.healthData?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Age</p>
                    <p className="text-gray-900 dark:text-white">{report.healthData?.age ? `${report.healthData.age} years` : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Age Group</p>
                    <p className="text-gray-900 dark:text-white">{report.report?.userProfile?.ageGroup || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Risk Level</p>
                    <p className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      report.report?.userProfile?.riskLevel === 'High' ? 'bg-danger-100 text-danger-800 dark:bg-danger-900/30 dark:text-danger-400' :
                      report.report?.userProfile?.riskLevel === 'Moderate' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400'
                    }`}>
                      {report.report?.userProfile?.riskLevel || 'N/A'}
                    </p>
                  </div>
                </div>
              </section>

              {/* Air Quality Status */}
              <section className="p-6 bg-gray-50 dark:bg-dark-700 rounded-lg">
                <div className="flex items-center mb-4">
                  <FiActivity className="w-6 h-6 text-primary-500 mr-3" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Air Quality Status</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Current AQI</p>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getAqiColorClass(report.aqiData?.value || 0)} text-white`}>
                        {report.aqiData?.value || 'N/A'}
                        </span>
                      </div>
                    <p className="text-gray-900 dark:text-white">{report.aqiData?.status || 'N/A'}</p>
                      </div>
                  <div>
                    <div className="flex items-center mb-2">
                      <FiMapPin className="w-4 h-4 text-gray-400 mr-2" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">Location</p>
                    </div>
                    <p className="text-gray-900 dark:text-white">{report.location?.name || 'N/A'}</p>
                  </div>
                </div>
              </section>

              {/* Health Status */}
              <section className="p-6 bg-gray-50 dark:bg-dark-700 rounded-lg">
                <div className="flex items-center mb-4">
                  <FiShield className="w-6 h-6 text-primary-500 mr-3" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Health Status</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Reported Health Issues</p>
                    <div className="flex flex-wrap gap-2">
                      {report.healthData?.symptoms?.map((issue, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-400 rounded-full text-sm"
                        >
                          {issue}
                        </span>
                      )) || <span className="text-gray-500">No health issues reported</span>}
                    </div>
                  </div>
                  {report.healthData?.other && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Additional Information</p>
                      <p className="text-gray-900 dark:text-white">{report.healthData.other}</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Recommendations */}
              <section className="p-6 bg-gray-50 dark:bg-dark-700 rounded-lg">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Health Recommendations</h2>
                
                {/* General Recommendations */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">General Recommendations</h3>
                  <div className="space-y-3">
                    {report.report?.generalRecommendations?.map((rec, index) => (
                      <div key={index} className="p-4 bg-white dark:bg-dark-800 rounded-lg shadow-sm">
                        <p className="text-gray-700 dark:text-gray-300">{rec}</p>
                      </div>
                    )) || <p className="text-gray-500">No general recommendations available</p>}
                  </div>
                </div>

                {/* Age-Specific Recommendations */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Age-Specific Recommendations</h3>
                  <div className="space-y-3">
                    {report.report?.ageSpecificRecommendations?.map((rec, index) => (
                      <div key={index} className="p-4 bg-white dark:bg-dark-800 rounded-lg shadow-sm">
                        <p className="text-gray-700 dark:text-gray-300">{rec}</p>
                  </div>
                    )) || <p className="text-gray-500">No age-specific recommendations available</p>}
                  </div>
                  </div>

                {/* Health-Specific Recommendations */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Health-Specific Recommendations</h3>
                  <div className="space-y-3">
                    {report.report?.healthSpecificRecommendations?.map((rec, index) => (
                      <div key={index} className="p-4 bg-white dark:bg-dark-800 rounded-lg shadow-sm">
                        <p className="text-gray-700 dark:text-gray-300">{rec}</p>
                      </div>
                    )) || <p className="text-gray-500">No health-specific recommendations available</p>}
                  </div>
                </div>

                {/* Activity Guidelines */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Activity Guidelines</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-white dark:bg-dark-800 rounded-lg shadow-sm">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">Outdoor Activities</h4>
                      <p className="text-gray-700 dark:text-gray-300">{report.outdoorActivitySafety?.recommendation || 'No outdoor activity guidelines available'}</p>
                    </div>
                    <div className="p-4 bg-white dark:bg-dark-800 rounded-lg shadow-sm">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">Indoor Activities</h4>
                      <p className="text-gray-700 dark:text-gray-300">{report.report?.activityGuidelines?.indoor || 'No indoor activity guidelines available'}</p>
                    </div>
                    <div className="p-4 bg-white dark:bg-dark-800 rounded-lg shadow-sm">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">Exercise</h4>
                      <p className="text-gray-700 dark:text-gray-300">{report.report?.activityGuidelines?.exercise || 'No exercise guidelines available'}</p>
                    </div>
                  </div>
                </div>

                {/* Medication Recommendations */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Medication Recommendations</h3>
                  <div className="p-4 bg-white dark:bg-dark-800 rounded-lg shadow-sm">
                    <p className="text-gray-700 dark:text-gray-300">{report.medicationRecommendations?.specific || 'No specific medication recommendations available'}</p>
                  </div>
              </div>
              
                {/* Mask Recommendations */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Mask Recommendations</h3>
                  <div className="p-4 bg-white dark:bg-dark-800 rounded-lg shadow-sm">
                    <p className="text-gray-700 dark:text-gray-300">{report.maskRecommendations?.usage || 'No mask recommendations available'}</p>
                    {report.maskRecommendations?.type && (
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Recommended mask type: {report.maskRecommendations.type}
                      </p>
                    )}
                  </div>
                </div>
              </section>

              {/* Footer */}
              <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                <p>Report generated on {report.timestamp ? new Date(report.timestamp).toLocaleString() : 'N/A'}</p>
                <p className="mt-2">This report is for informational purposes only and should not be considered medical advice.</p>
                </div>
              </div>
            </motion.div>
        </div>
      </div>
    </div>
  );
};

export default HealthReportDetail;
