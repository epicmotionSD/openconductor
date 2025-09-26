/**
 * Trinity AI Card Component
 * 
 * Premium Bloomberg Terminal-style card component adapted for Trinity AI agents.
 * Features glassmorphism effects, agent-specific color themes, and enhanced visual feedback.
 */

import React from 'react';
import { cn } from '../../utils/cn';

export interface TrinityCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "glass" | "elevated" | "gradient" | "glow";
  agent?: "oracle" | "sentinel" | "sage" | "neutral";
  children: React.ReactNode;
}

export function TrinityCard({
  className,
  variant = "default",
  agent = "neutral",
  children,
  ...props
}: TrinityCardProps) {
  
  const agentClasses = {
    oracle: "trinity-oracle-theme",
    sentinel: "trinity-sentinel-theme", 
    sage: "trinity-sage-theme",
    neutral: "trinity-neutral-theme"
  };

  const variantClasses = {
    default: "trinity-card-default",
    glass: "trinity-card-glass hover-lift",
    elevated: "trinity-card-elevated interactive-scale",
    gradient: "trinity-gradient-surface border-cyan-400/30 hover:border-cyan-300/40 hover:shadow-glow",
    glow: "trinity-card-glow hover:shadow-glow"
  };

  return (
    <div
      className={cn(
        "trinity-card-base transition-all duration-300 group",
        agentClasses[agent],
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function TrinityAgentCard({ 
  agent = "oracle",
  title, 
  confidence, 
  status,
  data,
  className,
  onInteraction,
  ...props 
}: {
  agent?: "oracle" | "sentinel" | "sage";
  title: string;
  confidence?: number;
  status: 'active' | 'processing' | 'idle' | 'error';
  data?: any;
  className?: string;
  onInteraction?: (action: string) => void;
}) {
  
  const agentConfig = {
    oracle: {
      icon: '🔮',
      color: 'blue',
      name: 'Oracle',
      description: 'Predictive Intelligence'
    },
    sentinel: {
      icon: '🛡️', 
      color: 'green',
      name: 'Sentinel',
      description: 'Monitoring Intelligence'
    },
    sage: {
      icon: '🧠',
      color: 'purple', 
      name: 'Sage',
      description: 'Advisory Intelligence'
    }
  };

  const config = agentConfig[agent];
  const statusColors = {
    active: `text-${config.color}-400 bg-${config.color}-500/10 border-${config.color}-500/20`,
    processing: `text-yellow-400 bg-yellow-500/10 border-yellow-500/20`,
    idle: `text-gray-400 bg-gray-500/10 border-gray-500/20`,
    error: `text-red-400 bg-red-500/10 border-red-500/20`
  };

  return (
    <TrinityCard 
      variant="glass" 
      agent={agent} 
      className={cn("p-6 space-y-4", className)} 
      {...props}
    >
      {/* Agent Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-xl backdrop-blur-xl border flex items-center justify-center shadow-glow",
            `bg-gradient-to-br from-${config.color}-500/30 to-${config.color}-600/30 border-${config.color}-400/50`
          )}>
            <span className="text-xl">{config.icon}</span>
          </div>
          <div>
            <div className="text-white font-semibold text-lg">{config.name}</div>
            <div className={cn("text-sm", `text-${config.color}-300`)}>
              {config.description}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-3 h-3 rounded-full",
            status === 'active' && `bg-${config.color}-400 animate-pulse shadow-glow`,
            status === 'processing' && "bg-yellow-400 animate-pulse",
            status === 'idle' && "bg-gray-400",
            status === 'error' && "bg-red-400 animate-pulse"
          )} />
          <div className="text-right">
            {confidence && (
              <>
                <div className="text-lg font-bold trinity-gradient-text">
                  {confidence}%
                </div>
                <div className={cn("text-xs", `text-${config.color}-300`)}>
                  Confidence
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Content Area */}
      <div className={cn(
        "p-4 rounded-lg border backdrop-blur-xl",
        `bg-${config.color}-950/40 border-${config.color}-400/20`
      )}>
        <div className={cn("text-base leading-relaxed", `text-${config.color}-100`)}>
          {title}
        </div>
        {data && (
          <div className="mt-3 text-sm text-gray-300">
            {JSON.stringify(data, null, 2)}
          </div>
        )}
      </div>
    </TrinityCard>
  );
}

export default TrinityCard;