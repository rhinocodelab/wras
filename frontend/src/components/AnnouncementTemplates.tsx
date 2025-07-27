import React, { useState, useEffect } from 'react';
import { Megaphone, Languages, Volume2, ArrowLeft, Search, RefreshCw, Edit, Play } from 'lucide-react';
import { useToast } from './ToastContainer';

interface AnnouncementCategory {
  id: number;
  category_code: string;
  description: string;
  created_at: string;
  updated_at: string;
}

interface AnnouncementTemplate {
  id: number;
  category_id: number;
  language_code: string;
  template_text: string;
  created_at: string;
  updated_at: string;
  has_audio: boolean;
}

type ViewMode = 'categories' | 'generator';

const AnnouncementTemplates: React.FC = () => {
  const { showToast } = useToast();
  const [viewMode, setViewMode] = useState<ViewMode>('categories');
  const [categories, setCategories] = useState<AnnouncementCategory[]>([]);
  const [templates, setTemplates] = useState<AnnouncementTemplate[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<AnnouncementCategory | null>(null);
  const [selectedCategoryCode, setSelectedCategoryCode] = useState<string>('arriving');
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingTemplate, setEditingTemplate] = useState<AnnouncementTemplate | null>(null);
  const [isTranslationModalOpen, setIsTranslationModalOpen] = useState(false);
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);
  const [translationProgress, setTranslationProgress] = useState({
    isTranslating: false,
    currentStep: '',
    totalCategories: 0,
    translatedCategories: 0,
    failedCategories: 0
  });
  const [audioProgress, setAudioProgress] = useState({
    isGenerating: false,
    currentStep: '',
    totalCategories: 0,
    generatedCategories: 0,
    failedCategories: 0,
    totalFiles: 0,
    generatedFiles: 0
  });

  // Generator state
  const [generatorCategory, setGeneratorCategory] = useState('');
  const [generatorLanguage, setGeneratorLanguage] = useState('en');
  const [generatorParameters, setGeneratorParameters] = useState<{[key: string]: string}>({});
  const [generatedAnnouncement, setGeneratedAnnouncement] = useState<{
    text: string;
    audioUrl?: string;
  } | null>(null);

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'Hindi' },
    { code: 'mr', name: 'Marathi' },
    { code: 'gu', name: 'Gujarati' }
  ];

  const getLanguageName = (code: string) => {
    const lang = languages.find(l => l.code === code);
    return lang ? lang.name : code;
  };

  const getLanguageNameInNative = (code: string) => {
    const nativeNames: {[key: string]: string} = {
      'en': 'English',
      'hi': 'हिंदी',
      'mr': 'मराठी',
      'gu': 'ગુજરાતી'
    };
    return nativeNames[code] || code;
  };

  const getCategoryDisplayName = (categoryCode: string) => {
    const names: {[key: string]: string} = {
      'arriving': 'Arriving',
      'delay': 'Delay',
      'cancelled': 'Cancelled',
      'platform_change': 'Platform Change'
    };
    return names[categoryCode] || categoryCode;
  };

  const getCategoryIcon = (categoryCode: string) => {
    const icons: {[key: string]: string} = {
      'arriving': '🚂',
      'delay': '⏰',
      'cancelled': '❌',
      'platform_change': '🔄'
    };
    return icons[categoryCode] || '📢';
  };

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:5001/api/v1/announcements/categories/');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      } else {
        showToast('error', 'Failed to fetch announcement categories');
      }
    } catch (error) {
      showToast('error', 'Error fetching categories: Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTemplates = async (categoryId: number) => {
    try {
      setIsLoading(true);
      const response = await fetch(`http://localhost:5001/api/v1/announcements/templates/${categoryId}`);
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      } else {
        showToast('error', 'Failed to fetch templates');
      }
    } catch (error) {
      showToast('error', 'Error fetching templates: Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryChange = async (categoryCode: string) => {
    setSelectedCategoryCode(categoryCode);
    const category = categories.find(c => c.category_code === categoryCode);
    if (category) {
      setSelectedCategory(category);
      await fetchTemplates(category.id);
    }
  };

  const handleGenerateTranslations = async () => {
    setIsTranslationModalOpen(true);
    setTranslationProgress({
      isTranslating: true,
      currentStep: 'Starting seed database translation generation...',
      totalCategories: categories.length,
      translatedCategories: 0,
      failedCategories: 0
    });

    try {
      // Call the seed database script endpoint
      const response = await fetch('http://localhost:5001/api/v1/announcements/seed-translations/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const result = await response.json();
        setTranslationProgress(prev => ({
          ...prev,
          translatedCategories: result.total_categories || categories.length,
          currentStep: 'Seed database translation generation completed successfully!',
          isTranslating: false
        }));
        showToast('success', `Generated translations using seed database script for ${result.total_categories || categories.length} categories.`);
        
        // Refresh the categories and templates to show the new translations
        await fetchCategories();
        if (selectedCategory) {
          await fetchTemplates(selectedCategory.id);
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to generate translations using seed database');
      }
    } catch (error) {
      setTranslationProgress(prev => ({
        ...prev,
        isTranslating: false,
        failedCategories: 1,
        currentStep: 'Seed database translation generation failed. Please try again.'
      }));
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showToast('error', `Failed to generate translations using seed database: ${errorMessage}`);
    }
  };

  const handleGenerateAudio = async () => {
    setIsAudioModalOpen(true);
    setAudioProgress({
      isGenerating: true,
      currentStep: 'Starting audio segment generation with delays...',
      totalCategories: categories.length,
      generatedCategories: 0,
      failedCategories: 0,
      totalFiles: 0,
      generatedFiles: 0
    });

    try {
      const response = await fetch('http://localhost:5001/api/v1/audio-segments/generate-bulk-with-delays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          languages: ['en', 'hi', 'mr', 'gu'], 
          overwrite_existing: false,
          delay_between_requests: 2000, // 2 seconds delay between requests
          delay_between_categories: 5000  // 5 seconds delay between categories
        })
      });

      if (response.ok) {
        const result = await response.json();
        setAudioProgress(prev => ({
          ...prev,
          generatedCategories: result.total_categories,
          generatedFiles: result.total_segments_generated,
          currentStep: 'Audio segment generation completed successfully!',
          isGenerating: false
        }));
        showToast('success', `Generated ${result.total_segments_generated} audio segments across ${result.total_categories} categories with proper delays.`);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to generate audio segments');
      }
    } catch (error) {
      setAudioProgress(prev => ({
        ...prev,
        isGenerating: false,
        failedCategories: 1,
        currentStep: 'Audio segment generation failed. Please try again.'
      }));
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showToast('error', `Failed to generate audio segments: ${errorMessage}`);
    }
  };

  const handleUpdateTemplate = async (templateId: number, newText: string) => {
    try {
      const response = await fetch(`http://localhost:5001/api/v1/announcements/templates/${templateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template_text: newText })
      });

      if (response.ok) {
        showToast('success', 'Template updated successfully!');
        setEditingTemplate(null);
        if (selectedCategory) {
          await fetchTemplates(selectedCategory.id);
        }
      } else {
        const errorData = await response.json();
        showToast('error', `Failed to update template: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (error) {
      showToast('error', 'Error updating template');
    }
  };

  const handleGenerateAnnouncement = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/v1/announcements/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category_code: generatorCategory,
          language_code: generatorLanguage,
          parameters: generatorParameters
        })
      });

      if (response.ok) {
        const result = await response.json();
        setGeneratedAnnouncement({
          text: result.announcement_text,
          audioUrl: result.audio_url
        });
        showToast('success', 'Announcement generated successfully!');
      } else {
        const errorData = await response.json();
        showToast('error', `Failed to generate announcement: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (error) {
      showToast('error', 'Error generating announcement');
    }
  };

  const playAudio = (audioUrl: string) => {
    try {
      const audio = new Audio(`http://localhost:5001${audioUrl}`);
      audio.play().catch(error => {
        showToast('error', 'Error playing audio');
      });
    } catch (error) {
      showToast('error', 'Error playing audio');
    }
  };

  const renderBreadcrumb = () => (
    <div className="flex items-center space-x-2 mb-6">
      {viewMode !== 'categories' && (
        <button
          onClick={() => {
            setViewMode('categories');
            setSelectedCategory(null);
            setTemplates([]);
          }}
          className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Categories</span>
        </button>
      )}
      {viewMode === 'generator' && (
        <span className="text-gray-500">→ Announcement Generator</span>
      )}
    </div>
  );

  const renderCategories = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Announcement Templates</h1>
          <p className="text-gray-600 text-sm">Manage announcement templates and generate multilingual versions.</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleGenerateTranslations}
            disabled={isLoading}
            className="px-3 py-1.5 bg-blue-600 text-white hover:bg-blue-700 transition-colors text-xs font-medium"
          >
            Generate All Translations
          </button>
          <button
            onClick={handleGenerateAudio}
            disabled={isLoading}
            className="px-3 py-1.5 bg-green-600 text-white hover:bg-green-700 transition-colors text-xs font-medium"
          >
            Generate All Audio
          </button>
          <button
            onClick={() => setViewMode('generator')}
            className="px-3 py-1.5 bg-purple-600 text-white hover:bg-purple-700 transition-colors text-xs font-medium"
          >
            Generate Announcement
          </button>
        </div>
      </div>

      {/* Category Selection Combo Box */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-700 mb-1">Select Announcement Category</label>
          <div className="flex items-center space-x-2">
            <select
              value={selectedCategoryCode}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-40 px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.category_code}>
                  {getCategoryDisplayName(category.category_code)}
                </option>
              ))}
            </select>
            <button
              onClick={handleGenerateTranslations}
              disabled={isLoading}
              className="px-3 py-1.5 bg-orange-600 text-white hover:bg-orange-700 transition-colors text-xs font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
              title="Generate translations for all categories using seed database script"
            >
              Seed Translations
            </button>
          </div>
        </div>

        {/* Templates Display */}
        {selectedCategory && (
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-gray-800 mb-3">
              {getCategoryDisplayName(selectedCategory.category_code)} Templates
            </h3>
            
            {/* English Template - Full Width */}
            {(() => {
              const englishTemplate = templates.find(t => t.language_code === 'en');
              return (
                <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-semibold text-gray-800">English</h3>
                      {englishTemplate?.has_audio && (
                        <Volume2 className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                    <div className="flex space-x-1">
                      {englishTemplate && (
                        <>
                          <button
                            onClick={() => setEditingTemplate(englishTemplate)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit template"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          {englishTemplate.has_audio && (
                            <button
                              onClick={() => playAudio(`/ai-audio-translations/announcements/${selectedCategory?.category_code}/en/${selectedCategory?.category_code}_en.mp3`)}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                              title="Play audio"
                            >
                              <Play className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  
                  {englishTemplate ? (
                    <div className="bg-gray-50 rounded-lg p-3 min-h-[80px]">
                      <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{englishTemplate.template_text}</p>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-3 min-h-[80px] flex items-center justify-center">
                      <p className="text-sm text-gray-500 italic text-center">No English template available</p>
                    </div>
                  )}
                </div>
              );
            })()}
            
            {/* Other Languages - Small Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {languages.filter(lang => lang.code !== 'en').map((language) => {
                const template = templates.find(t => t.language_code === language.code);
                
                return (
                  <div key={language.code} className="border border-gray-200 rounded-lg p-3 bg-white shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-semibold text-gray-800">{getLanguageNameInNative(language.code)}</h3>
                        {template?.has_audio && (
                          <Volume2 className="w-3.5 h-3.5 text-green-600" />
                        )}
                      </div>
                      <div className="flex space-x-1">
                        {template && (
                          <>
                            <button
                              onClick={() => setEditingTemplate(template)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Edit template"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                            {template.has_audio && (
                              <button
                                onClick={() => playAudio(`/ai-audio-translations/announcements/${selectedCategory?.category_code}/${language.code}/${selectedCategory?.category_code}_${language.code}.mp3`)}
                                className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                                title="Play audio"
                              >
                                <Play className="w-3 h-3" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    
                    {template ? (
                      <div className="bg-gray-50 rounded-lg p-2 min-h-[70px]">
                        <p className="text-xs text-gray-800 whitespace-pre-wrap leading-relaxed">{template.template_text}</p>
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-lg p-2 min-h-[70px] flex items-center justify-center">
                        <p className="text-xs text-gray-500 italic text-center">No template available for this language</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );



  const renderGenerator = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Announcement Generator</h1>
        <p className="text-gray-600 text-sm">Generate actual announcements by filling in the parameters.</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Configuration</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={generatorCategory}
                  onChange={(e) => setGeneratorCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.category_code}>
                      {getCategoryDisplayName(category.category_code)}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                <select
                  value={generatorLanguage}
                  onChange={(e) => setGeneratorLanguage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {languages.map((language) => (
                    <option key={language.code} value={language.code}>
                      {language.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Parameters</h3>
            
            <div className="space-y-4">
              {generatorCategory && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Train Number</label>
                    <input
                      type="text"
                      value={generatorParameters.train_number || ''}
                      onChange={(e) => setGeneratorParameters(prev => ({ ...prev, train_number: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 12345"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Train Name</label>
                    <input
                      type="text"
                      value={generatorParameters.train_name || ''}
                      onChange={(e) => setGeneratorParameters(prev => ({ ...prev, train_name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Mumbai Express"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Station</label>
                    <input
                      type="text"
                      value={generatorParameters.start_station || ''}
                      onChange={(e) => setGeneratorParameters(prev => ({ ...prev, start_station: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Mumbai Central"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Station</label>
                    <input
                      type="text"
                      value={generatorParameters.end_station || ''}
                      onChange={(e) => setGeneratorParameters(prev => ({ ...prev, end_station: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Delhi Junction"
                    />
                  </div>
                  
                  {(generatorCategory === 'arriving' || generatorCategory === 'platform_change') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Platform</label>
                      <input
                        type="text"
                        value={generatorParameters.platform || ''}
                        onChange={(e) => setGeneratorParameters(prev => ({ ...prev, platform: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., 3"
                      />
                    </div>
                  )}
                  
                  {generatorCategory === 'delay' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Delay Time (minutes)</label>
                      <input
                        type="number"
                        value={generatorParameters.delay_time || ''}
                        onChange={(e) => setGeneratorParameters(prev => ({ ...prev, delay_time: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., 15"
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex justify-center">
          <button
            onClick={handleGenerateAnnouncement}
            disabled={!generatorCategory || !generatorLanguage}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Generate Announcement
          </button>
        </div>
        
        {generatedAnnouncement && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="text-lg font-semibold text-green-800 mb-2">Generated Announcement</h4>
            <p className="text-green-700 mb-3 whitespace-pre-wrap">{generatedAnnouncement.text}</p>
            {generatedAnnouncement.audioUrl && (
              <button
                onClick={() => playAudio(generatedAnnouncement.audioUrl!)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center space-x-2"
              >
                <Play className="w-4 h-4" />
                <span>Play Audio</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // Initialize data on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Load templates for selected category when categories are loaded
  useEffect(() => {
    if (categories.length > 0 && selectedCategoryCode) {
      const category = categories.find(c => c.category_code === selectedCategoryCode);
      if (category) {
        setSelectedCategory(category);
        fetchTemplates(category.id);
      }
    }
  }, [categories, selectedCategoryCode]);

  return (
    <div className="space-y-6">
      {renderBreadcrumb()}
      
      {viewMode === 'categories' && renderCategories()}
      {viewMode === 'generator' && renderGenerator()}
      
      {/* Translation Progress Modal */}
      {isTranslationModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
            <div className="text-center">
              <div className="mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  {translationProgress.isTranslating ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  ) : translationProgress.translatedCategories > 0 ? (
                    <div className="text-green-600 text-2xl">✅</div>
                  ) : (
                    <div className="text-red-600 text-2xl">❌</div>
                  )}
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">
                  {translationProgress.isTranslating ? 'Running Seed Database Script' : 'Seed Database Complete'}
                </h2>
                <p className="text-sm text-gray-600">
                  {translationProgress.currentStep}
                </p>
              </div>

              {translationProgress.totalCategories > 0 && (
                <div className="mb-6">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Total Categories:</span>
                    <span className="font-medium">{translationProgress.totalCategories}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Translated:</span>
                    <span className="font-medium text-green-600">{translationProgress.translatedCategories}</span>
                  </div>
                  {translationProgress.failedCategories > 0 && (
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Failed:</span>
                      <span className="font-medium text-red-600">{translationProgress.failedCategories}</span>
                    </div>
                  )}
                  
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${translationProgress.totalCategories > 0 ? (translationProgress.translatedCategories / translationProgress.totalCategories) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Using seed_database.sh script to generate:</h3>
                <div className="flex justify-center space-x-4 text-xs text-gray-600">
                  <span>Hindi</span>
                  <span>Marathi</span>
                  <span>Gujarati</span>
                </div>
              </div>

              {!translationProgress.isTranslating && (
                <button
                  onClick={() => setIsTranslationModalOpen(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Audio Generation Progress Modal */}
      {isAudioModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
            <div className="text-center">
              <div className="mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  {audioProgress.isGenerating ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                  ) : audioProgress.generatedFiles > 0 ? (
                    <div className="text-green-600 text-2xl">✅</div>
                  ) : (
                    <div className="text-red-600 text-2xl">❌</div>
                  )}
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">
                  {audioProgress.isGenerating ? 'Generating AI Audio Segments with Delays' : 'Audio Segment Generation Complete'}
                </h2>
                <p className="text-sm text-gray-600">
                  {audioProgress.currentStep}
                </p>
              </div>

              {audioProgress.totalCategories > 0 && (
                <div className="mb-6">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Total Categories:</span>
                    <span className="font-medium">{audioProgress.totalCategories}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Generated:</span>
                    <span className="font-medium text-green-600">{audioProgress.generatedCategories}</span>
                  </div>
                  {audioProgress.failedCategories > 0 && (
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Failed:</span>
                      <span className="font-medium text-red-600">{audioProgress.failedCategories}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Audio Segments:</span>
                    <span className="font-medium text-blue-600">{audioProgress.generatedFiles}</span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${audioProgress.totalCategories > 0 ? (audioProgress.generatedCategories / audioProgress.totalCategories) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Generating audio segments with delays for:</h3>
                <div className="flex justify-center space-x-4 text-xs text-gray-600">
                  <span>English</span>
                  <span>Hindi</span>
                  <span>Marathi</span>
                  <span>Gujarati</span>
                </div>
                <div className="text-center mt-2 text-xs text-gray-500">
                  <p>2s delay between requests • 5s delay between categories</p>
                </div>
              </div>

              {!audioProgress.isGenerating && (
                <button
                  onClick={() => setIsAudioModalOpen(false)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Template Edit Modal */}
      {editingTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Edit {getLanguageName(editingTemplate.language_code)} Template
              </h3>
              <button
                onClick={() => setEditingTemplate(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Template Text</label>
              <textarea
                value={editingTemplate.template_text}
                onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, template_text: e.target.value } : null)}
                className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Enter template text with placeholders like {train_number}, {train_name}, etc."
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setEditingTemplate(null)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateTemplate(editingTemplate.id, editingTemplate.template_text)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnouncementTemplates; 