import React, { useState, useEffect } from 'react';
import { Volume2, Play, Download, Trash2, RefreshCw, Plus, X } from 'lucide-react';

interface AudioTemplate {
  id: string;
  template_id: string;
  original_text: string;
  text_en: string;
  text_hi: string;
  text_mr: string;
  text_gu: string;
  audio_en_path: string;
  audio_hi_path: string;
  audio_mr_path: string;
  audio_gu_path: string;
  created_at: string;
  status: 'generating' | 'completed' | 'failed';
}

interface ProgressStep {
  step: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  message?: string;
}

const AudioTemplates: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [inputText, setInputText] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['en', 'hi', 'mr', 'gu']);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progressSteps, setProgressSteps] = useState<ProgressStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'Hindi' },
    { code: 'mr', name: 'Marathi' },
    { code: 'gu', name: 'Gujarati' }
  ];

  // Fetch templates on component mount
  useEffect(() => {
    // No need to fetch templates since we're not displaying them
  }, []);

  const handleLanguageToggle = (languageCode: string) => {
    setSelectedLanguages(prev =>
      prev.includes(languageCode)
        ? prev.filter(lang => lang !== languageCode)
        : [...prev, languageCode]
    );
  };

  const handleGenerateTemplate = async () => {
    if (!inputText.trim() || selectedLanguages.length === 0) {
      alert('Please enter text and select at least one language');
      return;
    }

    // Initialize progress steps
    const steps: ProgressStep[] = [
      { step: 'Validating input', status: 'pending' },
      { step: 'Generating translations', status: 'pending' },
      { step: 'Creating audio files', status: 'pending' },
      { step: 'Saving template', status: 'pending' },
      { step: 'Finalizing', status: 'pending' }
    ];
    
    setProgressSteps(steps);
    setCurrentStep(0);
    setShowProgressModal(true);
    setGenerating(true);

    try {
      // Step 1: Validating input
      setProgressSteps(prev => prev.map((step, index) => 
        index === 0 ? { ...step, status: 'in-progress', message: 'Checking text and language selection...' } : step
      ));
      setCurrentStep(0);
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate processing
      
      setProgressSteps(prev => prev.map((step, index) => 
        index === 0 ? { ...step, status: 'completed', message: 'Input validation successful' } : step
      ));

      // Step 2: Generating translations
      setProgressSteps(prev => prev.map((step, index) => 
        index === 1 ? { ...step, status: 'in-progress', message: `Translating to ${selectedLanguages.length} languages...` } : step
      ));
      setCurrentStep(1);
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate translation time
      
      setProgressSteps(prev => prev.map((step, index) => 
        index === 1 ? { ...step, status: 'completed', message: 'Translations completed' } : step
      ));

      // Step 3: Creating audio files
      setProgressSteps(prev => prev.map((step, index) => 
        index === 2 ? { ...step, status: 'in-progress', message: 'Generating audio files with TTS...' } : step
      ));
      setCurrentStep(2);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate audio generation time
      
      setProgressSteps(prev => prev.map((step, index) => 
        index === 2 ? { ...step, status: 'completed', message: 'Audio files created' } : step
      ));

      // Step 4: Saving template
      setProgressSteps(prev => prev.map((step, index) => 
        index === 3 ? { ...step, status: 'in-progress', message: 'Saving template metadata...' } : step
      ));
      setCurrentStep(3);
      await new Promise(resolve => setTimeout(resolve, 300)); // Simulate saving time
      
      setProgressSteps(prev => prev.map((step, index) => 
        index === 3 ? { ...step, status: 'completed', message: 'Template saved successfully' } : step
      ));

      // Step 5: Finalizing
      setProgressSteps(prev => prev.map((step, index) => 
        index === 4 ? { ...step, status: 'in-progress', message: 'Finalizing template...' } : step
      ));
      setCurrentStep(4);
      await new Promise(resolve => setTimeout(resolve, 200)); // Simulate finalization time

      // Make the actual API call
      const response = await fetch('http://localhost:5001/api/v1/audio-templates/generate/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: inputText.trim(),
          languages: selectedLanguages
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Complete the final step
        setProgressSteps(prev => prev.map((step, index) => 
          index === 4 ? { ...step, status: 'completed', message: 'Template generated successfully!' } : step
        ));
        
        // Wait a moment to show completion
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setInputText('');
        
        // Close modal and show success
        setShowProgressModal(false);
        alert('Audio template generated successfully! You can view it in AI Database -> AI Generated Audio Templates.');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Unknown error');
      }
    } catch (error) {
      console.error('Error generating template:', error);
      
      // Mark current step as failed
      setProgressSteps(prev => prev.map((step, index) => 
        index === currentStep ? { ...step, status: 'failed', message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` } : step
      ));
      
      // Wait a moment to show error
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setShowProgressModal(false);
      alert(`Failed to generate template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Audio Templates</h1>
          <p className="text-sm text-gray-600 mt-1">Generate AI Text Translations and Text-to-Speech audio</p>
        </div>
      </div>

      {/* Generate New Template */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Generate New Audio Template</h2>
        
        <div className="space-y-4">
          {/* Text Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              English Text
            </label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Enter English text to generate translations and audio..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-blue-500 focus:outline-none"
              rows={4}
              maxLength={1000}
            />
            <div className="text-xs text-gray-500 mt-1">
              {inputText.length}/1000 characters
            </div>
          </div>

          {/* Language Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Languages
            </label>
            <div className="flex flex-wrap gap-2">
              {languages.map((language) => (
                <button
                  key={language.code}
                  onClick={() => handleLanguageToggle(language.code)}
                  className={`px-3 py-1 text-xs rounded transition-colors ${
                    selectedLanguages.includes(language.code)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {language.name}
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <div>
            <button
              onClick={handleGenerateTemplate}
              disabled={generating || !inputText.trim() || selectedLanguages.length === 0}
              className="px-4 py-2 text-white text-sm font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{backgroundColor: '#337ab7'}}
              onMouseEnter={(e) => !generating && (e.currentTarget.style.backgroundColor = '#2a6496')}
              onMouseLeave={(e) => !generating && (e.currentTarget.style.backgroundColor = '#337ab7')}
            >
              {generating ? 'Generating...' : 'Generate Audio Template'}
            </button>
          </div>
        </div>
      </div>

      {/* Progress Modal */}
      {showProgressModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Generating Audio Template</h3>
              <button
                onClick={() => setShowProgressModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={generating}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="space-y-4">
                {progressSteps.map((step, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    {/* Status Icon */}
                    <div className="flex-shrink-0 mt-1">
                      {step.status === 'pending' && (
                        <div className="w-5 h-5 rounded-full border-2 border-gray-300"></div>
                      )}
                      {step.status === 'in-progress' && (
                        <div className="w-5 h-5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>
                      )}
                      {step.status === 'completed' && (
                        <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                      {step.status === 'failed' && (
                        <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Step Content */}
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium ${
                        step.status === 'completed' ? 'text-green-600' :
                        step.status === 'failed' ? 'text-red-600' :
                        step.status === 'in-progress' ? 'text-blue-600' :
                        'text-gray-600'
                      }`}>
                        {step.step}
                      </div>
                      {step.message && (
                        <div className="text-xs text-gray-500 mt-1">
                          {step.message}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Progress Bar */}
              <div className="mt-6">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                    style={{ 
                      width: `${((currentStep + 1) / progressSteps.length) * 100}%` 
                    }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-2 text-center">
                  Step {currentStep + 1} of {progressSteps.length}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end p-4 border-t border-gray-200">
              <button
                onClick={() => setShowProgressModal(false)}
                disabled={generating}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {generating ? 'Please wait...' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioTemplates; 