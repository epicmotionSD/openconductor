/**
 * Trinity Oracle Panel - Predictive Intelligence
 *
 * Professional predictive intelligence panel for Trinity AI Oracle agent.
 * Features Bloomberg Terminal-style glassmorphism with Oracle-specific theming.
 */

import React, { useState, useEffect } from 'react';
import { TrinityCard, TrinityAgentCard } from '../../ui/trinity-card';
import { cn } from '../../../utils/cn';

interface PredictionData {
  id: string;
  type: 'forecast' | 'classification' | 'regression' | 'anomaly';
  value: number;
  confidence: number;
  model: string;
  timestamp: Date;
  factors: string[];
}

interface OraclePanelProps {
  className?: string;
  onPredictionSelect?: (prediction: PredictionData) => void;
  webSocketData?: any;
}

const TrinityOraclePanel: React.FC<OraclePanelProps> = ({
  className,
  onPredictionSelect,
  webSocketData
}) => {
  const [predictions, setPredictions] = useState<PredictionData[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('ensemble');
  const [timeHorizon, setTimeHorizon] = useState<number>(168); // 7 days in hours
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Available prediction models
  const models = [
    { id: 'ensemble', name: 'Ensemble Model', accuracy: 94.2 },
    { id: 'time-series', name: 'Time Series Forecast', accuracy: 91.8 },
    { id: 'regression', name: 'Performance Regressor', accuracy: 88.7 },
    { id: 'classification', name: 'Category Classifier', accuracy: 96.1 }
  ];

  // Simulate Oracle predictions
  useEffect(() => {
    const generatePredictions = () => {
      const newPredictions: PredictionData[] = Array.from({ length: 6 }, (_, i) => ({
        id: `pred-${Date.now()}-${i}`,
        type: ['forecast', 'classification', 'regression', 'anomaly'][Math.floor(Math.random() * 4)] as any,
        value: Math.random() * 100,
        confidence: Math.random() * 20 + 80,
        model: selectedModel,
        timestamp: new Date(Date.now() - Math.random() * 3600000),
        factors: ['historical_data', 'market_trends', 'external_variables'].slice(0, Math.floor(Math.random() * 3) + 1)
      }));

      setPredictions(prev => [...newPredictions, ...prev.slice(0, 12)]);
    };

    const interval = setInterval(generatePredictions, 5000);
    generatePredictions(); // Initial load

    return () => clearInterval(interval);
  }, [selectedModel]);

  // Process WebSocket data
  useEffect(() => {
    if (webSocketData?.type === 'oracle_prediction') {
      setIsProcessing(true);
      
      setTimeout(() => {
        setPredictions(prev => [webSocketData.data, ...prev.slice(0, 11)]);
        setIsProcessing(false);
      }, 1000);
    }
  }, [webSocketData]);

  const handleRunPrediction = () => {
    setIsProcessing(true);
    
    // Simulate prediction processing
    setTimeout(() => {
      const newPrediction: PredictionData = {
        id: `pred-${Date.now()}`,
        type: 'forecast',
        value: Math.random() * 100,
        confidence: Math.random() * 15 + 85,
        model: selectedModel,
        timestamp: new Date(),
        factors: ['real_time_data', 'pattern_recognition', 'ml_inference']
      };
      
      setPredictions(prev => [newPrediction, ...prev.slice(0, 11)]);
      setIsProcessing(false);
      
      if (onPredictionSelect) {
        onPredictionSelect(newPrediction);
      }
    }, 2000);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'forecast': return 'text-blue-300 bg-blue-500/20 border-blue-400/30';
      case 'classification': return 'text-cyan-300 bg-cyan-500/20 border-cyan-400/30';
      case 'regression': return 'text-indigo-300 bg-indigo-500/20 border-indigo-400/30';
      case 'anomaly': return 'text-purple-300 bg-purple-500/20 border-purple-400/30';
      default: return 'text-blue-300 bg-blue-500/20 border-blue-400/30';
    }
  };

  return (
    <div className={cn("h-full space-y-6", className)}>
      {/* Oracle Agent Status */}
      <TrinityAgentCard
        agent="oracle"
        title="Predictive Intelligence System"
        confidence={94.2}
        status={isProcessing ? 'processing' : 'active'}
        data={{
          activeModel: selectedModel,
          timeHorizon: `${timeHorizon}h`,
          totalPredictions: predictions.length
        }}
        onInteraction={handleRunPrediction}
      />

      {/* Model Selection */}
      <TrinityCard variant="glass" agent="oracle" className="p-4">
        <div className="trinity-body-md text-blue-100 mb-4">Model Configuration</div>
        
        <div className="space-y-4">
          <div>
            <label className="trinity-body-sm text-blue-200 mb-2 block">Prediction Model</label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full p-2 rounded-md trinity-glass-oracle text-blue-100 text-sm"
            >
              {models.map(model => (
                <option key={model.id} value={model.id}>
                  {model.name} ({model.accuracy}% accuracy)
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="trinity-body-sm text-blue-200 mb-2 block">
              Time Horizon: {timeHorizon}h
            </label>
            <input
              type="range"
              min="1"
              max="720"
              value={timeHorizon}
              onChange={(e) => setTimeHorizon(Number(e.target.value))}
              className="w-full h-2 trinity-glass-oracle rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between trinity-body-sm text-blue-400 mt-1">
              <span>1h</span>
              <span>30d</span>
            </div>
          </div>
          
          <button
            onClick={handleRunPrediction}
            disabled={isProcessing}
            className={cn(
              "w-full p-3 rounded-md transition-all trinity-body-md font-medium",
              isProcessing
                ? "trinity-glass-oracle text-blue-400 cursor-not-allowed"
                : "trinity-gradient-oracle text-white hover:shadow-glow interactive-scale"
            )}
          >
            {isProcessing ? 'Processing Prediction...' : 'Generate Prediction'}
          </button>
        </div>
      </TrinityCard>

      {/* Recent Predictions */}
      <TrinityCard variant="glass" agent="oracle" className="p-4">
        <div className="trinity-body-md text-blue-100 mb-4 flex items-center justify-between">
          <span>Prediction History</span>
          <span className="trinity-body-sm text-blue-300">{predictions.length} results</span>
        </div>
        
        <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
          {predictions.map((prediction) => (
            <div
              key={prediction.id}
              onClick={() => onPredictionSelect && onPredictionSelect(prediction)}
              className="trinity-glass-oracle rounded-lg p-3 cursor-pointer hover:bg-blue-950/30 transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <div className={cn(
                  "px-2 py-1 rounded text-xs font-medium border",
                  getTypeColor(prediction.type)
                )}>
                  {prediction.type}
                </div>
                <div className="trinity-body-sm text-blue-300 font-medium">
                  {prediction.value.toFixed(2)}
                </div>
              </div>
              
              <div className="flex items-center justify-between mb-2">
                <div className="trinity-body-sm text-blue-200">
                  Confidence: {prediction.confidence.toFixed(1)}%
                </div>
                <div className="trinity-body-sm text-blue-400">
                  {prediction.model}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="trinity-body-sm text-blue-400 text-xs">
                  {prediction.timestamp.toLocaleTimeString()}
                </div>
                <div className="trinity-body-sm text-blue-400 text-xs">
                  {prediction.factors.length} factors
                </div>
              </div>
            </div>
          ))}
          
          {predictions.length === 0 && (
            <div className="text-center py-8">
              <div className="trinity-body-md text-blue-300 mb-2">No predictions yet</div>
              <div className="trinity-body-sm text-blue-400">
                Generate your first prediction to see results here
              </div>
            </div>
          )}
        </div>
      </TrinityCard>
    </div>
  );
};

export default TrinityOraclePanel;