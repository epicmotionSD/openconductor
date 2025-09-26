/**
 * Service Dependency Engine - Intelligent Impact Analysis
 * 
 * Maps service dependencies and analyzes how issues cascade through
 * the system. Provides intelligent impact analysis that shows exactly
 * which services will be affected and when.
 * 
 * Strategic Value:
 * - Shows blast radius of incidents before they cascade
 * - Predicts dependency failures using Trinity AI
 * - Provides intelligent recovery prioritization
 * - Enables proactive dependency health monitoring
 */

import { Logger } from '../utils/logger';
import { ErrorManager } from '../utils/error-manager';
import { EventBus } from '../types/events';
import { OracleAgent } from '../agents/oracle-agent';
import { SentinelAgent } from '../agents/sentinel-agent';

export interface ServiceDependency {
  from_service: string;
  to_service: string;
  dependency_type: 'synchronous' | 'asynchronous' | 'data' | 'shared_resource';
  criticality: 'low' | 'medium' | 'high' | 'critical';
  health_correlation: number; // 0-1 how much from_service health depends on to_service
  failure_propagation_time: number; // seconds until failure cascades
  recovery_dependency: boolean; // does from_service need to_service to recover
  sla_impact: number; // 0-1 how much dependency affects SLA
  metadata: {
    discovered_at: Date;
    last_verified: Date;
    confidence: number;
    evidence: string[];
  };
}

export interface ServiceNode {
  service_id: string;
  service_name: string;
  service_type: 'api' | 'database' | 'queue' | 'cache' | 'auth' | 'frontend' | 'worker';
  criticality: 'low' | 'medium' | 'high' | 'critical';
  current_health: {
    status: 'healthy' | 'degraded' | 'unhealthy' | 'critical';
    health_score: number; // 0-1
    last_updated: Date;
  };
  dependencies: {
    upstream: string[]; // services this depends on
    downstream: string[]; // services that depend on this
    shared_resources: string[]; // shared databases, caches, etc.
  };
  sla_requirements: {
    availability: number;
    response_time: number;
    error_rate: number;
  };
  deployment_info: {
    last_deployed: Date;
    deployment_frequency: number; // deployments per week
    rollback_capability: boolean;
  };
}

export interface DependencyGraph {
  nodes: Map<string, ServiceNode>;
  edges: Map<string, ServiceDependency>;
  topology: {
    layers: string[][]; // services organized by dependency layers
    critical_path: string[]; // most critical dependency chain
    circular_dependencies: string[][]; // detected circular deps
  };
  health_propagation: {
    healthy_services: string[];
    at_risk_services: string[];
    cascade_predictions: CascadePrediction[];
  };
}

export interface CascadePrediction {
  trigger_service: string;
  cascade_timeline: Array<{
    timestamp: Date;
    affected_service: string;
    impact_severity: 'minimal' | 'moderate' | 'severe' | 'critical';
    confidence: number;
    mitigation_window: number; // seconds to prevent cascade
  }>;
  total_impact: {
    services_affected: number;
    users_impacted: number;
    revenue_at_risk: number;
    recovery_time_estimate: number; // minutes
  };
  prevention_actions: Array<{
    action: string;
    target_service: string;
    effectiveness: number; // 0-1
    implementation_time: number; // minutes
  }>;
}

export interface ImpactAnalysisResult {
  analysis_id: string;
  trigger_event: {
    service_id: string;
    event_type: 'failure' | 'degradation' | 'maintenance' | 'deployment';
    timestamp: Date;
    severity: 'low' | 'medium' | 'high' | 'critical';
  };
  immediate_impact: {
    directly_affected: string[];
    impact_timeline: Array<{
      service_id: string;
      affected_at: Date;
      severity: 'minimal' | 'moderate' | 'severe';
      recovery_estimate: number; // minutes
    }>;
  };
  cascade_analysis: {
    propagation_paths: Array<{
      path: string[];
      probability: number;
      total_time: number; // seconds for full cascade
      mitigation_points: Array<{ service: string; action: string; }>;
    }>;
    blast_radius: {
      tier_1: string[]; // immediately affected
      tier_2: string[]; // affected within 5 minutes
      tier_3: string[]; // affected within 15 minutes
    };
  };
  business_impact: {
    user_impact: {
      total_users_affected: number;
      user_experience_degradation: number; // 0-1
      estimated_churn_risk: number;
    };
    financial_impact: {
      revenue_per_minute: number;
      total_revenue_at_risk: number;
      sla_penalty_risk: number;
    };
    operational_impact: {
      incident_response_cost: number;
      engineering_hours_required: number;
      reputation_impact: 'minimal' | 'moderate' | 'significant';
    };
  };
  mitigation_strategies: Array<{
    strategy: string;
    target_services: string[];
    effectiveness: number;
    implementation_cost: number;
    time_to_implement: number;
  }>;
  oracle_insights: {
    similar_incidents: Array<{
      incident_id: string;
      similarity_score: number;
      resolution_time: number;
      successful_mitigations: string[];
    }>;
    prediction_confidence: number;
    recommended_monitoring: string[];
  };
}

/**
 * Service Dependency Engine
 */
export class ServiceDependencyEngine {
  private logger: Logger;
  private errorManager: ErrorManager;
  private eventBus: EventBus;
  private oracleAgent: OracleAgent;
  private sentinelAgent: SentinelAgent;
  
  // Dependency graph storage
  private dependencyGraph: DependencyGraph;
  private dependencyDiscoveryInterval?: NodeJS.Timeout;
  
  // Impact analysis cache
  private impactAnalysisCache = new Map<string, ImpactAnalysisResult>();
  private cascadePredictionCache = new Map<string, CascadePrediction[]>();
  
  // Learning and optimization
  private historicalIncidents: Array<{
    incident_id: string;
    actual_cascade: string[];
    predicted_cascade: string[];
    accuracy_score: number;
    resolution_time: number;
  }> = [];

  constructor(
    oracleAgent: OracleAgent,
    sentinelAgent: SentinelAgent,
    logger: Logger,
    errorManager: ErrorManager,
    eventBus: EventBus
  ) {
    this.oracleAgent = oracleAgent;
    this.sentinelAgent = sentinelAgent;
    this.logger = logger;
    this.errorManager = errorManager;
    this.eventBus = eventBus;
    
    this.dependencyGraph = {
      nodes: new Map(),
      edges: new Map(),
      topology: {
        layers: [],
        critical_path: [],
        circular_dependencies: []
      },
      health_propagation: {
        healthy_services: [],
        at_risk_services: [],
        cascade_predictions: []
      }
    };
    
    this.initializeDependencyDiscovery();
    this.logger.info('Service Dependency Engine initialized');
  }

  /**
   * Analyze impact of service event or failure
   */
  async analyzeServiceImpact(
    serviceId: string,
    eventType: 'failure' | 'degradation' | 'maintenance' | 'deployment',
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): Promise<ImpactAnalysisResult> {
    const analysisId = this.generateAnalysisId();
    const startTime = Date.now();
    
    try {
      this.logger.info('Analyzing service impact', {
        analysisId,
        serviceId,
        eventType,
        severity
      });

      // Step 1: Get service node and immediate dependencies
      const serviceNode = this.dependencyGraph.nodes.get(serviceId);
      if (!serviceNode) {
        throw new Error(`Service ${serviceId} not found in dependency graph`);
      }

      // Step 2: Calculate immediate impact
      const immediateImpact = await this.calculateImmediateImpact(serviceNode, eventType, severity);

      // Step 3: Use Oracle to predict cascade propagation
      const cascadeAnalysis = await this.predictCascadePropagation(
        serviceId,
        eventType,
        severity,
        immediateImpact
      );

      // Step 4: Calculate business impact
      const businessImpact = await this.calculateBusinessImpact(
        immediateImpact,
        cascadeAnalysis,
        serviceNode
      );

      // Step 5: Generate mitigation strategies using Oracle + historical data
      const mitigationStrategies = await this.generateMitigationStrategies(
        serviceId,
        cascadeAnalysis,
        businessImpact
      );

      // Step 6: Get Oracle insights from similar incidents
      const oracleInsights = await this.getOracleInsights(serviceId, eventType, severity);

      const analysisTime = Date.now() - startTime;
      
      const result: ImpactAnalysisResult = {
        analysis_id: analysisId,
        trigger_event: {
          service_id: serviceId,
          event_type: eventType,
          timestamp: new Date(),
          severity
        },
        immediate_impact: immediateImpact,
        cascade_analysis: cascadeAnalysis,
        business_impact: businessImpact,
        mitigation_strategies: mitigationStrategies,
        oracle_insights: oracleInsights
      };

      // Cache the result
      this.impactAnalysisCache.set(analysisId, result);

      // Emit impact analysis event
      await this.eventBus.emit({
        type: 'service.impact_analyzed',
        timestamp: new Date(),
        data: {
          analysisId,
          serviceId,
          eventType,
          severity,
          servicesAffected: immediateImpact.directly_affected.length + 
                          cascadeAnalysis.blast_radius.tier_1.length +
                          cascadeAnalysis.blast_radius.tier_2.length,
          analysisTime
        }
      });

      this.logger.info('Service impact analysis completed', {
        analysisId,
        serviceId,
        servicesAffected: result.cascade_analysis.blast_radius.tier_1.length,
        analysisTime
      });

      return result;

    } catch (error) {
      this.logger.error('Service impact analysis failed', {
        analysisId,
        serviceId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw this.errorManager.wrapError(error as Error, {
        context: 'service-impact-analysis',
        serviceId,
        analysisId
      });
    }
  }

  /**
   * Predict cascade propagation using Oracle agent
   */
  private async predictCascadePropagation(
    serviceId: string,
    eventType: string,
    severity: string,
    immediateImpact: any
  ): Promise<ImpactAnalysisResult['cascade_analysis']> {
    try {
      // Prepare historical cascade data for Oracle
      const historicalCascades = this.getHistoricalCascadeData(serviceId, eventType);
      
      // Use Oracle to predict cascade propagation
      const cascadePrediction = await this.oracleAgent.predict(historicalCascades, {
        timeHorizon: 60, // 1 hour cascade prediction
        confidence: 0.75,
        model: 'default-forecast'
      });

      // Generate propagation paths
      const propagationPaths = await this.generatePropagationPaths(
        serviceId,
        severity,
        cascadePrediction
      );

      // Calculate blast radius using dependency graph
      const blastRadius = this.calculateBlastRadius(serviceId, propagationPaths);

      return {
        propagation_paths: propagationPaths,
        blast_radius: blastRadius
      };

    } catch (error) {
      this.logger.error('Cascade propagation prediction failed', {
        serviceId,
        error: error instanceof Error ? error.message : String(error)
      });
      
      // Fallback to static dependency analysis
      return this.generateStaticCascadeAnalysis(serviceId);
    }
  }

  /**
   * Generate propagation paths showing how failure cascades
   */
  private async generatePropagationPaths(
    serviceId: string,
    severity: string,
    oraclePrediction: any
  ): Promise<ImpactAnalysisResult['cascade_analysis']['propagation_paths']> {
    const paths: ImpactAnalysisResult['cascade_analysis']['propagation_paths'] = [];
    
    // Get all downstream dependencies
    const serviceNode = this.dependencyGraph.nodes.get(serviceId);
    if (!serviceNode) return paths;

    // Trace each dependency path
    for (const dependentService of serviceNode.dependencies.downstream) {
      const path = await this.traceDependencyPath(serviceId, dependentService, severity);
      
      if (path.length > 1) {
        // Calculate probability using Oracle prediction confidence
        const probability = Math.min(0.95, oraclePrediction.confidence * this.getDependencyStrength(serviceId, dependentService));
        
        // Calculate total propagation time
        const totalTime = this.calculatePropagationTime(path);
        
        // Generate mitigation points
        const mitigationPoints = this.identifyMitigationPoints(path);

        paths.push({
          path,
          probability,
          total_time: totalTime,
          mitigation_points: mitigationPoints
        });
      }
    }

    // Sort by probability and impact
    return paths.sort((a, b) => b.probability - a.probability).slice(0, 10);
  }

  /**
   * Calculate blast radius for different time horizons
   */
  private calculateBlastRadius(
    serviceId: string,
    propagationPaths: any[]
  ): ImpactAnalysisResult['cascade_analysis']['blast_radius'] {
    const tier1: string[] = []; // Immediate (0-2 minutes)
    const tier2: string[] = []; // Short-term (2-10 minutes)
    const tier3: string[] = []; // Medium-term (10-30 minutes)

    for (const path of propagationPaths) {
      let cumulativeTime = 0;
      
      for (let i = 1; i < path.path.length; i++) {
        const service = path.path[i];
        const propagationTime = this.getServicePropagationTime(path.path[i-1], service);
        cumulativeTime += propagationTime;

        if (cumulativeTime <= 120) { // 2 minutes
          if (!tier1.includes(service)) tier1.push(service);
        } else if (cumulativeTime <= 600) { // 10 minutes
          if (!tier2.includes(service)) tier2.push(service);
        } else if (cumulativeTime <= 1800) { // 30 minutes
          if (!tier3.includes(service)) tier3.push(service);
        }
      }
    }

    return { tier_1: tier1, tier_2: tier2, tier_3: tier3 };
  }

  /**
   * Discover service dependencies automatically
   */
  async discoverServiceDependencies(serviceId: string): Promise<{
    discovered_dependencies: ServiceDependency[];
    confidence_score: number;
    discovery_method: string[];
  }> {
    try {
      this.logger.info('Discovering dependencies for service', { serviceId });

      const discoveredDeps: ServiceDependency[] = [];
      const discoveryMethods: string[] = [];

      // Method 1: Network traffic analysis
      const networkDeps = await this.discoverNetworkDependencies(serviceId);
      discoveredDeps.push(...networkDeps);
      if (networkDeps.length > 0) discoveryMethods.push('network_traffic_analysis');

      // Method 2: Configuration analysis
      const configDeps = await this.discoverConfigurationDependencies(serviceId);
      discoveredDeps.push(...configDeps);
      if (configDeps.length > 0) discoveryMethods.push('configuration_analysis');

      // Method 3: Runtime dependency detection
      const runtimeDeps = await this.discoverRuntimeDependencies(serviceId);
      discoveredDeps.push(...runtimeDeps);
      if (runtimeDeps.length > 0) discoveryMethods.push('runtime_detection');

      // Method 4: Log analysis using Sentinel
      const logDeps = await this.discoverLogDependencies(serviceId);
      discoveredDeps.push(...logDeps);
      if (logDeps.length > 0) discoveryMethods.push('log_analysis');

      // Deduplicate and validate dependencies
      const validatedDeps = this.validateAndDeduplicate(discoveredDeps);
      
      // Calculate overall confidence
      const confidenceScore = validatedDeps.length > 0 ? 
        validatedDeps.reduce((sum, dep) => sum + dep.metadata.confidence, 0) / validatedDeps.length : 0;

      // Update dependency graph
      for (const dep of validatedDeps) {
        this.addDependencyToGraph(dep);
      }

      this.logger.info('Dependency discovery completed', {
        serviceId,
        dependenciesFound: validatedDeps.length,
        confidenceScore,
        discoveryMethods
      });

      return {
        discovered_dependencies: validatedDeps,
        confidence_score: confidenceScore,
        discovery_method: discoveryMethods
      };

    } catch (error) {
      this.logger.error('Dependency discovery failed', {
        serviceId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Get service dependency health dashboard data
   */
  async getServiceDependencyHealth(serviceId: string): Promise<{
    service_health: ServiceNode['current_health'];
    dependency_health: Array<{
      service_id: string;
      service_name: string;
      dependency_type: string;
      health_status: string;
      health_score: number;
      impact_if_failed: 'minimal' | 'moderate' | 'severe' | 'critical';
      last_incident: Date | null;
      trend: 'improving' | 'stable' | 'degrading';
    }>;
    critical_path_health: {
      overall_score: number;
      weakest_link: string;
      risk_assessment: string;
    };
    predictive_insights: Array<{
      prediction: string;
      confidence: number;
      time_horizon: number;
      mitigation_available: boolean;
    }>;
  }> {
    const serviceNode = this.dependencyGraph.nodes.get(serviceId);
    if (!serviceNode) {
      throw new Error(`Service ${serviceId} not found in dependency graph`);
    }

    // Get health of all dependencies
    const dependencyHealth = await Promise.all(
      serviceNode.dependencies.upstream.map(async (depServiceId) => {
        const depNode = this.dependencyGraph.nodes.get(depServiceId);
        if (!depNode) return null;

        const dependency = this.getDependency(depServiceId, serviceId);
        const healthTrend = await this.calculateDependencyHealthTrend(depServiceId);
        
        return {
          service_id: depServiceId,
          service_name: depNode.service_name,
          dependency_type: dependency?.dependency_type || 'unknown',
          health_status: depNode.current_health.status,
          health_score: depNode.current_health.health_score,
          impact_if_failed: this.calculateFailureImpact(depServiceId, serviceId),
          last_incident: await this.getLastIncidentDate(depServiceId),
          trend: healthTrend
        };
      })
    );

    // Calculate critical path health
    const criticalPathHealth = this.calculateCriticalPathHealth(serviceId);

    // Generate predictive insights using Oracle
    const predictiveInsights = await this.generateDependencyPredictions(serviceId);

    return {
      service_health: serviceNode.current_health,
      dependency_health: dependencyHealth.filter(Boolean) as any[],
      critical_path_health: criticalPathHealth,
      predictive_insights: predictiveInsights
    };
  }

  // Helper methods for dependency discovery
  private async discoverNetworkDependencies(serviceId: string): Promise<ServiceDependency[]> {
    // Simulate network traffic analysis
    // In production, this would analyze actual network flows
    const mockDependencies: ServiceDependency[] = [
      {
        from_service: serviceId,
        to_service: 'auth-service',
        dependency_type: 'synchronous',
        criticality: 'critical',
        health_correlation: 0.95,
        failure_propagation_time: 30,
        recovery_dependency: true,
        sla_impact: 0.8,
        metadata: {
          discovered_at: new Date(),
          last_verified: new Date(),
          confidence: 0.92,
          evidence: ['HTTP calls detected', 'Authentication API usage', 'Session validation']
        }
      },
      {
        from_service: serviceId,
        to_service: 'database-primary',
        dependency_type: 'synchronous',
        criticality: 'critical',
        health_correlation: 0.98,
        failure_propagation_time: 10,
        recovery_dependency: true,
        sla_impact: 0.95,
        metadata: {
          discovered_at: new Date(),
          last_verified: new Date(),
          confidence: 0.98,
          evidence: ['Database connections', 'SQL queries', 'Connection pooling']
        }
      }
    ];

    return mockDependencies;
  }

  private async discoverConfigurationDependencies(serviceId: string): Promise<ServiceDependency[]> {
    // Simulate configuration analysis
    // In production, this would parse config files, environment variables, etc.
    return [
      {
        from_service: serviceId,
        to_service: 'redis-cache',
        dependency_type: 'asynchronous',
        criticality: 'medium',
        health_correlation: 0.6,
        failure_propagation_time: 300,
        recovery_dependency: false,
        sla_impact: 0.3,
        metadata: {
          discovered_at: new Date(),
          last_verified: new Date(),
          confidence: 0.85,
          evidence: ['Redis connection string in config', 'Cache operations in code']
        }
      }
    ];
  }

  private async discoverRuntimeDependencies(serviceId: string): Promise<ServiceDependency[]> {
    // Simulate runtime dependency detection
    return [];
  }

  private async discoverLogDependencies(serviceId: string): Promise<ServiceDependency[]> {
    // Use Sentinel to analyze logs for dependency patterns
    try {
      const logAnalysis = await this.sentinelAgent.execute({
        service_id: serviceId,
        analysis_type: 'dependency_discovery',
        time_range: { hours: 24 }
      });

      // Convert log analysis to dependencies
      return this.convertLogAnalysisToDependencies(serviceId, logAnalysis);
    } catch (error) {
      this.logger.warn('Log dependency discovery failed', { serviceId, error: error instanceof Error ? error.message : String(error) });
      return [];
    }
  }

  private validateAndDeduplicate(dependencies: ServiceDependency[]): ServiceDependency[] {
    const uniqueDeps = new Map<string, ServiceDependency>();
    
    for (const dep of dependencies) {
      const key = `${dep.from_service}->${dep.to_service}`;
      const existing = uniqueDeps.get(key);
      
      if (!existing || dep.metadata.confidence > existing.metadata.confidence) {
        uniqueDeps.set(key, dep);
      }
    }
    
    return Array.from(uniqueDeps.values()).filter(dep => dep.metadata.confidence > 0.5);
  }

  private addDependencyToGraph(dependency: ServiceDependency): void {
    // Add dependency edge
    const edgeKey = `${dependency.from_service}->${dependency.to_service}`;
    this.dependencyGraph.edges.set(edgeKey, dependency);

    // Update service nodes
    this.updateServiceNode(dependency.from_service);
    this.updateServiceNode(dependency.to_service);

    // Rebuild topology
    this.rebuildGraphTopology();
  }

  private updateServiceNode(serviceId: string): void {
    if (!this.dependencyGraph.nodes.has(serviceId)) {
      // Create new service node
      this.dependencyGraph.nodes.set(serviceId, {
        service_id: serviceId,
        service_name: `Service ${serviceId}`,
        service_type: 'api', // Default type
        criticality: 'medium',
        current_health: {
          status: 'healthy',
          health_score: 0.9,
          last_updated: new Date()
        },
        dependencies: {
          upstream: [],
          downstream: [],
          shared_resources: []
        },
        sla_requirements: {
          availability: 0.99,
          response_time: 2000,
          error_rate: 0.01
        },
        deployment_info: {
          last_deployed: new Date(),
          deployment_frequency: 2,
          rollback_capability: true
        }
      });
    }

    // Update dependency lists
    const node = this.dependencyGraph.nodes.get(serviceId)!;
    
    // Reset dependency lists and rebuild from edges
    node.dependencies.upstream = [];
    node.dependencies.downstream = [];
    
    for (const [_, dependency] of this.dependencyGraph.edges) {
      if (dependency.from_service === serviceId) {
        node.dependencies.downstream.push(dependency.to_service);
      }
      if (dependency.to_service === serviceId) {
        node.dependencies.upstream.push(dependency.from_service);
      }
    }
  }

  private rebuildGraphTopology(): void {
    // Rebuild dependency layers
    this.dependencyGraph.topology.layers = this.calculateDependencyLayers();
    
    // Identify critical path
    this.dependencyGraph.topology.critical_path = this.identifyCriticalPath();
    
    // Detect circular dependencies
    this.dependencyGraph.topology.circular_dependencies = this.detectCircularDependencies();
  }

  private calculateDependencyLayers(): string[][] {
    const layers: string[][] = [];
    const visited = new Set<string>();
    const services = Array.from(this.dependencyGraph.nodes.keys());

    // Layer 0: Services with no upstream dependencies
    const layer0 = services.filter(serviceId => {
      const node = this.dependencyGraph.nodes.get(serviceId);
      return node?.dependencies.upstream.length === 0;
    });
    
    if (layer0.length > 0) {
      layers.push(layer0);
      layer0.forEach(service => visited.add(service));
    }

    // Build subsequent layers
    let currentLayer = 0;
    while (visited.size < services.length && currentLayer < 10) {
      const nextLayer = services.filter(serviceId => {
        if (visited.has(serviceId)) return false;
        
        const node = this.dependencyGraph.nodes.get(serviceId);
        if (!node) return false;
        
        // Check if all upstream dependencies are in previous layers
        return node.dependencies.upstream.every(upstreamId => visited.has(upstreamId));
      });

      if (nextLayer.length === 0) break; // Prevent infinite loop
      
      layers.push(nextLayer);
      nextLayer.forEach(service => visited.add(service));
      currentLayer++;
    }

    return layers;
  }

  // Utility methods
  private generateAnalysisId(): string {
    return `impact_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  private getDependencyStrength(fromService: string, toService: string): number {
    const dependency = this.getDependency(fromService, toService);
    return dependency?.health_correlation || 0.5;
  }

  private getDependency(fromService: string, toService: string): ServiceDependency | undefined {
    const key = `${fromService}->${toService}`;
    return this.dependencyGraph.edges.get(key);
  }

  private getHistoricalCascadeData(serviceId: string, eventType: string): any[] {
    // In production, this would fetch actual historical cascade data
    return Array.from({length: 20}, () => Math.random() * 100);
  }

  private initializeDependencyDiscovery(): void {
    // Start periodic dependency discovery
    this.dependencyDiscoveryInterval = setInterval(async () => {
      await this.performPeriodicDiscovery();
    }, 300000); // Every 5 minutes
  }

  private async performPeriodicDiscovery(): Promise<void> {
    try {
      const services = Array.from(this.dependencyGraph.nodes.keys());
      
      for (const serviceId of services) {
        await this.discoverServiceDependencies(serviceId);
      }
    } catch (error) {
      this.logger.error('Periodic dependency discovery failed', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Public API methods
   */
  getDependencyGraph(): DependencyGraph {
    return {
      nodes: new Map(this.dependencyGraph.nodes),
      edges: new Map(this.dependencyGraph.edges),
      topology: { ...this.dependencyGraph.topology },
      health_propagation: { ...this.dependencyGraph.health_propagation }
    };
  }

  async addService(serviceNode: ServiceNode): Promise<void> {
    this.dependencyGraph.nodes.set(serviceNode.service_id, serviceNode);
    this.rebuildGraphTopology();
    
    // Start dependency discovery for new service
    await this.discoverServiceDependencies(serviceNode.service_id);
  }

  async removeService(serviceId: string): Promise<void> {
    this.dependencyGraph.nodes.delete(serviceId);
    
    // Remove all dependencies involving this service
    for (const [key, dependency] of this.dependencyGraph.edges) {
      if (dependency.from_service === serviceId || dependency.to_service === serviceId) {
        this.dependencyGraph.edges.delete(key);
      }
    }
    
    this.rebuildGraphTopology();
  }

  async updateServiceHealth(serviceId: string, healthData: any): Promise<void> {
    const node = this.dependencyGraph.nodes.get(serviceId);
    if (node) {
      node.current_health = {
        status: healthData.status,
        health_score: healthData.health_score,
        last_updated: new Date()
      };
    }
  }

  async shutdown(): Promise<void> {
    if (this.dependencyDiscoveryInterval) {
      clearInterval(this.dependencyDiscoveryInterval);
    }
    
    this.logger.info('Service Dependency Engine shutdown complete');
  }
}

/**
 * Factory function to create Service Dependency Engine
 */
export function createServiceDependencyEngine(
  oracleAgent: OracleAgent,
  sentinelAgent: SentinelAgent,
  logger: Logger,
  errorManager: ErrorManager,
  eventBus: EventBus
): ServiceDependencyEngine {
  return new ServiceDependencyEngine(
    oracleAgent,
    sentinelAgent,
    logger,
    errorManager,
    eventBus
  );
}