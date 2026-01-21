'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Maximize2,
  Minimize2,
  Monitor,
  Tablet,
  Smartphone,
  Code,
  Eye,
  Download,
  Rocket,
  ChevronLeft,
  ChevronRight,
  Check,
  AlertCircle,
  Loader2
} from 'lucide-react';

// Types
interface Template {
  id: string;
  templateId: string;
  name: string;
  description: string;
  purpose: string;
  targetIntent: 'transactional' | 'informational' | 'commercial' | 'navigational';
  features: string[];
}

interface TemplateVariable {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'image' | 'color' | 'array' | 'boolean' | 'select';
  required: boolean;
  placeholder?: string;
  defaultValue?: any;
  options?: string[];
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  missingRequired: string[];
}

type ViewMode = 'preview' | 'code' | 'split';
type DeviceMode = 'desktop' | 'tablet' | 'mobile';

interface TemplatePreviewProps {
  template: Template | null;
  onClose: () => void;
  onDeploy?: (templateId: string, content: Record<string, any>) => void;
}

// Component schema for each template
const TEMPLATE_VARIABLES: Record<string, TemplateVariable[]> = {
  T01: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true, placeholder: 'Professional Sisterlocks in Houston' },
    { key: 'subheadline', label: 'Subheadline', type: 'text', required: false, placeholder: 'Transform your hair with expert loc care' },
    { key: 'heroImage', label: 'Hero Image URL', type: 'image', required: true },
    { key: 'ctaText', label: 'CTA Button Text', type: 'text', required: true, defaultValue: 'Book Now' },
    { key: 'ctaUrl', label: 'CTA URL', type: 'text', required: true, placeholder: 'https://styleseat.com/...' },
    { key: 'phone', label: 'Phone Number', type: 'text', required: false },
    { key: 'address', label: 'Business Address', type: 'text', required: false }
  ],
  T02: [
    { key: 'businessName', label: 'Business Name', type: 'text', required: true },
    { key: 'logoUrl', label: 'Logo URL', type: 'image', required: false },
    { key: 'bookingProvider', label: 'Booking Provider', type: 'select', required: true, options: ['styleseat', 'calendly', 'acuity', 'custom'] },
    { key: 'bookingWidgetUrl', label: 'Booking Widget URL', type: 'text', required: true }
  ],
  T03: [
    { key: 'title', label: 'Gallery Title', type: 'text', required: true },
    { key: 'description', label: 'Gallery Description', type: 'textarea', required: false },
    { key: 'enableBeforeAfter', label: 'Enable Before/After', type: 'boolean', required: false, defaultValue: true }
  ],
  T04: [
    { key: 'title', label: 'Article Title', type: 'text', required: true },
    { key: 'metaDescription', label: 'Meta Description', type: 'textarea', required: true },
    { key: 'featuredImage', label: 'Featured Image URL', type: 'image', required: true },
    { key: 'content', label: 'Article Content', type: 'textarea', required: true },
    { key: 'author', label: 'Author Name', type: 'text', required: false }
  ],
  T05: [
    { key: 'title', label: 'Comparison Title', type: 'text', required: true, placeholder: 'Sisterlocks vs Microlocs' },
    { key: 'recommendedOption', label: 'Recommended Option', type: 'text', required: false },
    { key: 'ctaText', label: 'CTA Text', type: 'text', required: true, defaultValue: 'Book Consultation' }
  ],
  T06: [
    { key: 'productName', label: 'Product Name', type: 'text', required: true },
    { key: 'price', label: 'Price', type: 'text', required: true },
    { key: 'description', label: 'Product Description', type: 'textarea', required: true },
    { key: 'addToCartUrl', label: 'Add to Cart URL', type: 'text', required: true }
  ],
  T07: [
    { key: 'city', label: 'City Name', type: 'text', required: true, placeholder: 'Houston' },
    { key: 'neighborhood', label: 'Neighborhood', type: 'text', required: false, placeholder: 'Katy' },
    { key: 'service', label: 'Service Name', type: 'text', required: true, placeholder: 'Sisterlocks' },
    { key: 'businessName', label: 'Business Name', type: 'text', required: true },
    { key: 'address', label: 'Full Address', type: 'text', required: true },
    { key: 'phone', label: 'Phone Number', type: 'text', required: true },
    { key: 'mapEmbedUrl', label: 'Google Maps Embed URL', type: 'text', required: true }
  ],
  T08: [
    { key: 'headline', label: 'Headline', type: 'text', required: true },
    { key: 'leadMagnetTitle', label: 'Lead Magnet Title', type: 'text', required: true },
    { key: 'leadMagnetImage', label: 'Lead Magnet Image', type: 'image', required: true },
    { key: 'formAction', label: 'Form Action URL', type: 'text', required: true },
    { key: 'downloadUrl', label: 'Download URL', type: 'text', required: true }
  ],
  T09: [
    { key: 'businessName', label: 'Business Name', type: 'text', required: true },
    { key: 'avgRating', label: 'Average Rating', type: 'text', required: true, defaultValue: '4.9' },
    { key: 'totalReviews', label: 'Total Reviews', type: 'text', required: true },
    { key: 'leaveReviewUrl', label: 'Leave Review URL', type: 'text', required: false }
  ],
  T10: [
    { key: 'profileName', label: 'Profile Name', type: 'text', required: true },
    { key: 'profileImage', label: 'Profile Image', type: 'image', required: true },
    { key: 'bio', label: 'Short Bio', type: 'textarea', required: false },
    { key: 'backgroundColor', label: 'Background Color', type: 'color', required: false, defaultValue: '#1f2937' }
  ]
};

// Intent colors
const INTENT_COLORS = {
  transactional: 'bg-green-500/10 text-green-400 border-green-500/30',
  informational: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  commercial: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  navigational: 'bg-orange-500/10 text-orange-400 border-orange-500/30'
};

export function TemplatePreview({ template, onClose, onDeploy }: TemplatePreviewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('preview');
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [step, setStep] = useState<'configure' | 'preview' | 'deploy'>('configure');
  const [content, setContent] = useState<Record<string, any>>({});
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);

  // Get variables for current template
  const variables = template ? TEMPLATE_VARIABLES[template.templateId] || [] : [];

  // Initialize content with defaults
  useEffect(() => {
    if (template) {
      const defaults: Record<string, any> = {};
      variables.forEach(v => {
        if (v.defaultValue !== undefined) {
          defaults[v.key] = v.defaultValue;
        }
      });
      setContent(defaults);
    }
  }, [template]);

  // Validate content
  useEffect(() => {
    if (!template) return;

    const errors: string[] = [];
    const warnings: string[] = [];
    const missingRequired: string[] = [];

    variables.forEach(v => {
      const value = content[v.key];
      if (v.required && (value === undefined || value === null || value === '')) {
        missingRequired.push(v.key);
        errors.push(`${v.label} is required`);
      }
    });

    setValidation({
      valid: errors.length === 0,
      errors,
      warnings,
      missingRequired
    });
  }, [content, template, variables]);

  if (!template) return null;

  const handleInputChange = (key: string, value: any) => {
    setContent(prev => ({ ...prev, [key]: value }));
  };

  const handleDeploy = async () => {
    if (!validation?.valid) return;

    setIsDeploying(true);
    try {
      if (onDeploy) {
        await onDeploy(template.templateId, content);
      }
      // Show success state
      setTimeout(() => {
        setIsDeploying(false);
        onClose();
      }, 2000);
    } catch (error) {
      setIsDeploying(false);
    }
  };

  const getDeviceWidth = () => {
    switch (deviceMode) {
      case 'mobile': return '375px';
      case 'tablet': return '768px';
      default: return '100%';
    }
  };

  // Generate preview HTML
  const generatePreviewHTML = () => {
    const headline = content.headline || content.title || 'Your Headline';
    const subheadline = content.subheadline || 'Your subheadline goes here';
    const ctaText = content.ctaText || 'Get Started';
    const heroImage = content.heroImage || 'https://placehold.co/600x400/8B5CF6/white?text=Hero+Image';

    return `
      <div style="font-family: Inter, system-ui, sans-serif; background: #fff; min-height: 100%;">
        <section style="display: flex; padding: 4rem 2rem; max-width: 1200px; margin: 0 auto; gap: 2rem; align-items: center;">
          <div style="flex: 1;">
            <h1 style="font-size: 2.5rem; font-weight: 700; margin-bottom: 1rem; color: #1f2937;">${headline}</h1>
            <p style="font-size: 1.125rem; color: #6b7280; margin-bottom: 2rem;">${subheadline}</p>
            <a href="#" style="display: inline-block; background: #8B5CF6; color: white; padding: 0.875rem 2rem; border-radius: 8px; text-decoration: none; font-weight: 600;">${ctaText}</a>
          </div>
          <div style="flex: 1;">
            <img src="${heroImage}" alt="Hero" style="width: 100%; border-radius: 12px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);" />
          </div>
        </section>
      </div>
    `;
  };

  // Generate preview code
  const generatePreviewCode = () => {
    return `// ${template.name} - Next.js Component
import React from 'react';

export default function ${template.name.replace(/\s+/g, '')}Page() {
  return (
    <div className="min-h-screen bg-white">
      <section className="flex items-center max-w-7xl mx-auto px-8 py-16 gap-8">
        <div className="flex-1">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            ${content.headline || 'Your Headline'}
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            ${content.subheadline || 'Your subheadline'}
          </p>
          <a
            href="${content.ctaUrl || '#'}"
            className="inline-block bg-purple-600 text-white px-8 py-3 rounded-lg font-semibold"
          >
            ${content.ctaText || 'Get Started'}
          </a>
        </div>
        <div className="flex-1">
          <img
            src="${content.heroImage || '/placeholder.jpg'}"
            alt="${content.headline || 'Hero'}"
            className="w-full rounded-xl shadow-2xl"
          />
        </div>
      </section>
    </div>
  );
}`;
  };

  return (
    <div className={`fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 ${isFullscreen ? '' : ''}`}>
      <div className={`bg-gray-900 rounded-xl overflow-hidden flex flex-col ${isFullscreen ? 'w-full h-full' : 'w-full max-w-6xl h-[90vh]'}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">{template.name}</h2>
              <p className="text-sm text-gray-400">{template.templateId} - {template.purpose}</p>
            </div>
            <span className={`px-2 py-0.5 rounded text-xs font-medium border ${INTENT_COLORS[template.targetIntent]}`}>
              {template.targetIntent}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Step indicator */}
            <div className="flex items-center gap-2 mr-4">
              {['configure', 'preview', 'deploy'].map((s, i) => (
                <button
                  key={s}
                  onClick={() => setStep(s as any)}
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-colors ${
                    step === s
                      ? 'bg-purple-500 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-current/20 flex items-center justify-center text-xs">
                    {i + 1}
                  </span>
                  <span className="capitalize">{s}</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Configuration Panel */}
          {step === 'configure' && (
            <div className="w-full p-6 overflow-y-auto">
              <div className="max-w-2xl mx-auto">
                <h3 className="text-lg font-medium text-white mb-6">Configure Template Content</h3>

                <div className="space-y-4">
                  {variables.map(variable => (
                    <div key={variable.key}>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        {variable.label}
                        {variable.required && <span className="text-red-400 ml-1">*</span>}
                      </label>

                      {variable.type === 'text' && (
                        <input
                          type="text"
                          value={content[variable.key] || ''}
                          onChange={(e) => handleInputChange(variable.key, e.target.value)}
                          placeholder={variable.placeholder}
                          className={`w-full px-3 py-2 bg-gray-800 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                            validation?.missingRequired.includes(variable.key)
                              ? 'border-red-500'
                              : 'border-gray-700'
                          }`}
                        />
                      )}

                      {variable.type === 'textarea' && (
                        <textarea
                          value={content[variable.key] || ''}
                          onChange={(e) => handleInputChange(variable.key, e.target.value)}
                          placeholder={variable.placeholder}
                          rows={4}
                          className={`w-full px-3 py-2 bg-gray-800 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                            validation?.missingRequired.includes(variable.key)
                              ? 'border-red-500'
                              : 'border-gray-700'
                          }`}
                        />
                      )}

                      {variable.type === 'image' && (
                        <input
                          type="url"
                          value={content[variable.key] || ''}
                          onChange={(e) => handleInputChange(variable.key, e.target.value)}
                          placeholder="https://example.com/image.jpg"
                          className={`w-full px-3 py-2 bg-gray-800 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                            validation?.missingRequired.includes(variable.key)
                              ? 'border-red-500'
                              : 'border-gray-700'
                          }`}
                        />
                      )}

                      {variable.type === 'select' && (
                        <select
                          value={content[variable.key] || ''}
                          onChange={(e) => handleInputChange(variable.key, e.target.value)}
                          className={`w-full px-3 py-2 bg-gray-800 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                            validation?.missingRequired.includes(variable.key)
                              ? 'border-red-500'
                              : 'border-gray-700'
                          }`}
                        >
                          <option value="">Select {variable.label}</option>
                          {variable.options?.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      )}

                      {variable.type === 'boolean' && (
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={content[variable.key] ?? variable.defaultValue ?? false}
                            onChange={(e) => handleInputChange(variable.key, e.target.checked)}
                            className="w-4 h-4 rounded bg-gray-800 border-gray-700 text-purple-500 focus:ring-purple-500"
                          />
                          <span className="text-gray-400">Enable</span>
                        </label>
                      )}

                      {variable.type === 'color' && (
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={content[variable.key] || variable.defaultValue || '#8B5CF6'}
                            onChange={(e) => handleInputChange(variable.key, e.target.value)}
                            className="w-10 h-10 rounded cursor-pointer"
                          />
                          <input
                            type="text"
                            value={content[variable.key] || variable.defaultValue || '#8B5CF6'}
                            onChange={(e) => handleInputChange(variable.key, e.target.value)}
                            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Validation Messages */}
                {validation && !validation.valid && (
                  <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <div className="flex items-center gap-2 text-red-400 mb-2">
                      <AlertCircle className="w-4 h-4" />
                      <span className="font-medium">Missing Required Fields</span>
                    </div>
                    <ul className="text-sm text-red-300 space-y-1">
                      {validation.errors.map((error, i) => (
                        <li key={i}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => setStep('preview')}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                  >
                    Next: Preview
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Preview Panel */}
          {step === 'preview' && (
            <div className="w-full flex flex-col">
              {/* Preview Toolbar */}
              <div className="flex items-center justify-between p-3 border-b border-gray-800 bg-gray-850">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewMode('preview')}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm transition-colors ${
                      viewMode === 'preview'
                        ? 'bg-gray-700 text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Eye className="w-4 h-4" />
                    Preview
                  </button>
                  <button
                    onClick={() => setViewMode('code')}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm transition-colors ${
                      viewMode === 'code'
                        ? 'bg-gray-700 text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Code className="w-4 h-4" />
                    Code
                  </button>
                  <button
                    onClick={() => setViewMode('split')}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm transition-colors ${
                      viewMode === 'split'
                        ? 'bg-gray-700 text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Split
                  </button>
                </div>

                {viewMode !== 'code' && (
                  <div className="flex items-center gap-1 bg-gray-800 rounded p-1">
                    <button
                      onClick={() => setDeviceMode('desktop')}
                      className={`p-1.5 rounded transition-colors ${
                        deviceMode === 'desktop'
                          ? 'bg-gray-700 text-white'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <Monitor className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeviceMode('tablet')}
                      className={`p-1.5 rounded transition-colors ${
                        deviceMode === 'tablet'
                          ? 'bg-gray-700 text-white'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <Tablet className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeviceMode('mobile')}
                      className={`p-1.5 rounded transition-colors ${
                        deviceMode === 'mobile'
                          ? 'bg-gray-700 text-white'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <Smartphone className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Preview Content */}
              <div className="flex-1 overflow-hidden flex">
                {/* Preview Frame */}
                {(viewMode === 'preview' || viewMode === 'split') && (
                  <div className={`${viewMode === 'split' ? 'w-1/2' : 'w-full'} bg-gray-100 p-4 overflow-auto flex justify-center`}>
                    <div
                      className="bg-white shadow-xl rounded-lg overflow-hidden transition-all duration-300"
                      style={{ width: getDeviceWidth(), minHeight: '600px' }}
                    >
                      <iframe
                        srcDoc={generatePreviewHTML()}
                        className="w-full h-full border-0"
                        title="Template Preview"
                      />
                    </div>
                  </div>
                )}

                {/* Code View */}
                {(viewMode === 'code' || viewMode === 'split') && (
                  <div className={`${viewMode === 'split' ? 'w-1/2 border-l border-gray-800' : 'w-full'} bg-gray-950 overflow-auto`}>
                    <pre className="p-4 text-sm text-gray-300 font-mono whitespace-pre-wrap">
                      {generatePreviewCode()}
                    </pre>
                  </div>
                )}
              </div>

              {/* Navigation */}
              <div className="flex justify-between p-4 border-t border-gray-800">
                <button
                  onClick={() => setStep('configure')}
                  className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back to Configure
                </button>
                <button
                  onClick={() => setStep('deploy')}
                  disabled={!validation?.valid}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next: Deploy
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Deploy Panel */}
          {step === 'deploy' && (
            <div className="w-full p-6 overflow-y-auto">
              <div className="max-w-2xl mx-auto">
                <h3 className="text-lg font-medium text-white mb-6">Deploy Landing Page</h3>

                {/* Validation Summary */}
                <div className={`p-4 rounded-lg mb-6 ${validation?.valid ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
                  <div className="flex items-center gap-2">
                    {validation?.valid ? (
                      <>
                        <Check className="w-5 h-5 text-green-400" />
                        <span className="text-green-400 font-medium">Content Validated</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-5 h-5 text-red-400" />
                        <span className="text-red-400 font-medium">Content Incomplete</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Deployment Summary */}
                <div className="bg-gray-800 rounded-lg p-4 mb-6">
                  <h4 className="text-sm font-medium text-gray-300 mb-3">Deployment Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Template</span>
                      <span className="text-white">{template.name} ({template.templateId})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Intent</span>
                      <span className="text-white capitalize">{template.targetIntent}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Fields Configured</span>
                      <span className="text-white">{Object.keys(content).length} / {variables.length}</span>
                    </div>
                  </div>
                </div>

                {/* Deploy Options */}
                <div className="space-y-4 mb-6">
                  <label className="block">
                    <span className="text-sm font-medium text-gray-300">Target URL Slug</span>
                    <input
                      type="text"
                      placeholder="sisterlocks-houston"
                      className="mt-1 w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="w-4 h-4 rounded bg-gray-800 border-gray-700 text-purple-500 focus:ring-purple-500"
                    />
                    <span className="text-gray-300 text-sm">Include SEO Schema Markup</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="w-4 h-4 rounded bg-gray-800 border-gray-700 text-purple-500 focus:ring-purple-500"
                    />
                    <span className="text-gray-300 text-sm">Include Analytics Tracking</span>
                  </label>
                </div>

                {/* Actions */}
                <div className="flex justify-between">
                  <button
                    onClick={() => setStep('preview')}
                    className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back to Preview
                  </button>

                  <div className="flex gap-2">
                    <button
                      className="flex items-center gap-2 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Export Code
                    </button>
                    <button
                      onClick={handleDeploy}
                      disabled={!validation?.valid || isDeploying}
                      className="flex items-center gap-2 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isDeploying ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Deploying...
                        </>
                      ) : (
                        <>
                          <Rocket className="w-4 h-4" />
                          Deploy Now
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TemplatePreview;
