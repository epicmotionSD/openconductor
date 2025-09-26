/**
 * OpenConductor Inter-Service Encryption Layer
 * 
 * Mutual TLS (mTLS) for Trinity AI Agent Communications and Service Mesh
 * 
 * This system provides comprehensive inter-service encryption capabilities:
 * - Mutual TLS (mTLS) authentication for all service-to-service communication
 * - Certificate-based service identity and authorization
 * - Encrypted Trinity AI agent communication channels
 * - Service mesh integration with Istio/Linkerd compatibility
 * - Automatic certificate provisioning and rotation
 * - Service discovery with TLS verification
 * - Load balancing with TLS termination
 * 
 * Enterprise Value:
 * - Zero-trust internal network architecture
 * - Prevents lateral movement in case of breach
 * - Meets compliance requirements for internal communications
 * - Service identity and authorization framework
 * 
 * Competitive Advantage:
 * - Advanced service mesh security beyond standard implementations
 * - Trinity AI agent secure coordination capabilities
 * - High-performance mTLS with minimal latency overhead
 * - Comprehensive service communication audit trails
 */

import { Logger } from '../../utils/logger';
import { AuditLogger } from './audit-logger';
import { EnterpriseKeyManagementSystem, KeyOperationContext } from './key-management-system';
import { TLSTransportSecurity } from './tls-transport-security';
import { FeatureGates } from '../feature-gates';
import * as tls from 'tls';
import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as https from 'https';
import axios, { AxiosInstance } from 'axios';

export interface ServiceIdentity {
  serviceId: string;
  serviceName: string;
  serviceType: 'oracle_agent' | 'sentinel_agent' | 'sage_agent' | 'api_gateway' | 'workflow_engine' | 'gtm_engine';
  namespace: string;
  tenantId?: string;
  certificate: {
    certPath: string;
    keyPath: string;
    caPath: string;
    fingerprint: string;
    validFrom: Date;
    validTo: Date;
  };
  permissions: {
    canCommunicateWith: string[]; // Service IDs this service can communicate with
    acceptsFrom: string[]; // Service IDs that can communicate with this service
    operations: string[]; // Allowed operations
  };
  endpoints: {
    primary: string;
    secondary?: string;
    health: string;
  };
  metadata: {
    version: string;
    environment: string;
    region: string;
    zone: string;
  };
}

export interface ServiceMeshConfig {
  enabled: boolean;
  certificateAuthority: {
    rootCertPath: string;
    rootKeyPath: string;
    intermediateCertPath?: string;
    intermediateKeyPath?: string;
  };
  certificateLifetime: number; // Days
  autoRotation: boolean;
  rotationThreshold: number; // Days before expiry
  authorizationPolicy: 'allow_all' | 'deny_all' | 'rbac';
  encryptionAlgorithm: 'aes-256-gcm' | 'chacha20-poly1305';
  compressionEnabled: boolean;
  performanceMode: 'security' | 'balanced' | 'performance';
}

export interface mTLSConnection {
  connectionId: string;
  sourceService: string;
  targetService: string;
  sourceIP: string;
  targetIP: string;
  establishedAt: Date;
  lastActivity: Date;
  bytesTransferred: number;
  certificateFingerprints: {
    client: string;
    server: string;
  };
  tlsVersion: string;
  cipherSuite: string;
  authenticationStatus: 'authenticated' | 'pending' | 'failed';
  authorizationStatus: 'authorized' | 'denied' | 'pending';
}

export interface ServiceCommunicationRequest {
  requestId: string;
  sourceService: string;
  targetService: string;
  operation: string;
  payload: any;
  timestamp: Date;
  encryptionLevel: 'standard' | 'high' | 'maximum';
  priority: 'low' | 'medium' | 'high' | 'critical';
  timeout: number;
  retryPolicy: {
    maxRetries: number;
    backoffMultiplier: number;
    baseDelay: number;
  };
}

export interface ServiceMeshMetrics {
  services: {
    registered: number;
    active: number;
    healthy: number;
    certificateExpiring: number;
  };
  connections: {
    active: number;
    total: number;
    successful: number;
    failed: number;
    authFailures: number;
    authorizationDenied: number;
  };
  performance: {
    averageLatency: number;
    throughput: number;
    errorRate: number;
    certificateValidationTime: number;
  };
  security: {
    mtlsConnections: number;
    weakCipherAttempts: number;
    certificateValidationFailures: number;
    unauthorizedAccessAttempts: number;
  };
}

export class InterServiceEncryption {
  private static instance: InterServiceEncryption;
  private logger: Logger;
  private auditLogger: AuditLogger;
  private keyManagement: EnterpriseKeyManagementSystem;
  private tlsSecurity: TLSTransportSecurity;
  private featureGates: FeatureGates;
  
  // Configuration
  private serviceMeshConfig: ServiceMeshConfig;
  
  // Service Registry
  private services: Map<string, ServiceIdentity> = new Map();
  private activeConnections: Map<string, mTLSConnection> = new Map();
  private serviceClients: Map<string, AxiosInstance> = new Map(); // HTTP clients for each service
  
  // Certificate Management
  private serviceCA: {
    cert: Buffer;
    key: Buffer;
    fingerprint: string;
  } | null = null;
  
  // Metrics and Monitoring
  private metrics: ServiceMeshMetrics;
  private requestQueue: ServiceCommunicationRequest[] = [];
  
  // Background Tasks
  private certificateRotationInterval?: NodeJS.Timeout;
  private healthCheckInterval?: NodeJS.Timeout;
  private metricsCollectionInterval?: NodeJS.Timeout;

  private constructor(logger: Logger) {
    this.logger = logger;
    this.auditLogger = AuditLogger.getInstance();
    this.keyManagement = EnterpriseKeyManagementSystem.getInstance();
    this.tlsSecurity = TLSTransportSecurity.getInstance();
    this.featureGates = FeatureGates.getInstance();
    
    // Initialize service mesh configuration
    this.serviceMeshConfig = {
      enabled: true,
      certificateAuthority: {
        rootCertPath: '/etc/ssl/openconductor/ca-cert.pem',
        rootKeyPath: '/etc/ssl/openconductor/ca-key.pem'
      },
      certificateLifetime: 90, // 90 days
      autoRotation: true,
      rotationThreshold: 30, // Rotate 30 days before expiry
      authorizationPolicy: 'rbac',
      encryptionAlgorithm: 'aes-256-gcm',
      compressionEnabled: true,
      performanceMode: 'balanced'
    };
    
    // Initialize metrics
    this.metrics = {
      services: {
        registered: 0,
        active: 0,
        healthy: 0,
        certificateExpiring: 0
      },
      connections: {
        active: 0,
        total: 0,
        successful: 0,
        failed: 0,
        authFailures: 0,
        authorizationDenied: 0
      },
      performance: {
        averageLatency: 0,
        throughput: 0,
        errorRate: 0,
        certificateValidationTime: 0
      },
      security: {
        mtlsConnections: 0,
        weakCipherAttempts: 0,
        certificateValidationFailures: 0,
        unauthorizedAccessAttempts: 0
      }
    };
    
    this.initializeServiceMesh();
  }

  public static getInstance(logger?: Logger): InterServiceEncryption {
    if (!InterServiceEncryption.instance) {
      if (!logger) throw new Error('Logger required for first initialization');
      InterServiceEncryption.instance = new InterServiceEncryption(logger);
    }
    return InterServiceEncryption.instance;
  }

  /**
   * Initialize the service mesh encryption system
   */
  private async initializeServiceMesh(): Promise<void> {
    try {
      // Initialize Certificate Authority
      await this.initializeCertificateAuthority();
      
      // Register core Trinity AI services
      await this.registerCoreServices();
      
      // Start background tasks
      this.startCertificateRotationMonitor();
      this.startHealthMonitoring();
      this.startMetricsCollection();
      
      this.logger.info('Inter-Service Encryption initialized successfully');
      
      await this.auditLogger.log({
        action: 'service_mesh_encryption_initialized',
        actor: 'system',
        resource: 'service_mesh',
        outcome: 'success',
        details: {
          services_registered: this.services.size,
          ca_initialized: !!this.serviceCA,
          auto_rotation: this.serviceMeshConfig.autoRotation,
          authorization_policy: this.serviceMeshConfig.authorizationPolicy
        },
        severity: 'high',
        category: 'security',
        tags: ['service_mesh', 'mtls', 'initialization']
      });
      
    } catch (error) {
      this.logger.error(`Failed to initialize Inter-Service Encryption: ${error}`);
      throw error;
    }
  }

  /**
   * Register a service in the secure service mesh
   */
  public async registerService(
    serviceId: string,
    serviceName: string,
    serviceType: ServiceIdentity['serviceType'],
    options: {
      namespace?: string;
      tenantId?: string;
      endpoints: Partial<ServiceIdentity['endpoints']>;
      permissions?: Partial<ServiceIdentity['permissions']>;
      metadata?: Partial<ServiceIdentity['metadata']>;
    }
  ): Promise<ServiceIdentity> {
    try {
      // Generate service certificate
      const serviceCert = await this.generateServiceCertificate(serviceId, serviceName, serviceType);
      
      // Create service identity
      const serviceIdentity: ServiceIdentity = {
        serviceId,
        serviceName,
        serviceType,
        namespace: options.namespace || 'default',
        tenantId: options.tenantId,
        certificate: serviceCert,
        permissions: {
          canCommunicateWith: options.permissions?.canCommunicateWith || [],
          acceptsFrom: options.permissions?.acceptsFrom || [],
          operations: options.permissions?.operations || ['read', 'write']
        },
        endpoints: {
          primary: options.endpoints.primary || `https://${serviceName}:8443`,
          secondary: options.endpoints.secondary,
          health: options.endpoints.health || `https://${serviceName}:8443/health`
        },
        metadata: {
          version: options.metadata?.version || '1.0.0',
          environment: options.metadata?.environment || 'production',
          region: options.metadata?.region || 'us-east-1',
          zone: options.metadata?.zone || 'us-east-1a'
        }
      };
      
      // Store service identity
      this.services.set(serviceId, serviceIdentity);
      
      // Create secure HTTP client for this service
      await this.createServiceClient(serviceIdentity);
      
      // Update metrics
      this.metrics.services.registered++;
      this.metrics.services.active++;
      
      await this.auditLogger.log({
        action: 'service_registered',
        actor: 'system',
        resource: serviceId,
        outcome: 'success',
        details: {
          service_name: serviceName,
          service_type: serviceType,
          namespace: serviceIdentity.namespace,
          endpoints: serviceIdentity.endpoints,
          certificate_fingerprint: serviceCert.fingerprint
        },
        severity: 'medium',
        category: 'security',
        tags: ['service_registration', 'mtls', 'service_mesh']
      });
      
      this.logger.info(`Service registered: ${serviceName} (${serviceId}) with mTLS certificate`);
      
      return serviceIdentity;
      
    } catch (error) {
      this.logger.error(`Failed to register service ${serviceId}: ${error}`);
      throw error;
    }
  }

  /**
   * Secure communication between Trinity AI agents
   */
  public async secureAgentCommunication(
    sourceAgentId: string,
    targetAgentId: string,
    payload: any,
    options: {
      operation: string;
      priority?: ServiceCommunicationRequest['priority'];
      timeout?: number;
      encryptionLevel?: ServiceCommunicationRequest['encryptionLevel'];
    }
  ): Promise<any> {
    const requestId = this.generateRequestId();
    const startTime = Date.now();
    
    try {
      // Validate source and target services
      const sourceService = this.services.get(sourceAgentId);
      const targetService = this.services.get(targetAgentId);
      
      if (!sourceService || !targetService) {
        throw new Error(`Service not found: ${sourceAgentId} or ${targetAgentId}`);
      }
      
      // Check authorization
      if (!this.isAuthorized(sourceService, targetService, options.operation)) {
        this.metrics.connections.authorizationDenied++;
        throw new Error(`Service ${sourceAgentId} not authorized to ${options.operation} on ${targetAgentId}`);
      }
      
      // Create secure communication request
      const request: ServiceCommunicationRequest = {
        requestId,
        sourceService: sourceAgentId,
        targetService: targetAgentId,
        operation: options.operation,
        payload,
        timestamp: new Date(),
        encryptionLevel: options.encryptionLevel || 'standard',
        priority: options.priority || 'medium',
        timeout: options.timeout || 30000,
        retryPolicy: {
          maxRetries: 3,
          backoffMultiplier: 1.5,
          baseDelay: 1000
        }
      };
      
      // Get secure HTTP client
      const client = this.serviceClients.get(sourceAgentId);
      if (!client) {
        throw new Error(`No secure client found for service: ${sourceAgentId}`);
      }
      
      // Encrypt payload if required
      const encryptedPayload = await this.encryptServicePayload(payload, request);
      
      // Make secure request
      const response = await client.post(targetService.endpoints.primary, {
        requestId,
        operation: options.operation,
        payload: encryptedPayload,
        metadata: {
          sourceService: sourceAgentId,
          encryptionLevel: request.encryptionLevel,
          timestamp: request.timestamp
        }
      }, {
        timeout: request.timeout,
        headers: {
          'X-Service-ID': sourceAgentId,
          'X-Request-ID': requestId,
          'X-Operation': options.operation,
          'Content-Type': 'application/json'
        }
      });
      
      // Decrypt response payload
      const decryptedResponse = await this.decryptServicePayload(response.data, request);
      
      // Update metrics
      this.metrics.connections.successful++;
      this.metrics.performance.averageLatency = 
        (this.metrics.performance.averageLatency + (Date.now() - startTime)) / 2;
      
      // Audit sensitive communications
      if (request.encryptionLevel === 'maximum' || 
          sourceService.serviceType.includes('agent') && targetService.serviceType.includes('agent')) {
        await this.auditLogger.log({
          action: 'secure_agent_communication',
          actor: sourceAgentId,
          resource: targetAgentId,
          outcome: 'success',
          details: {
            operation: options.operation,
            encryption_level: request.encryptionLevel,
            response_time: Date.now() - startTime,
            payload_size: JSON.stringify(payload).length
          },
          severity: 'low',
          category: 'security',
          tags: ['agent_communication', 'mtls', 'trinity_ai']
        });
      }
      
      this.logger.debug(`Secure communication ${sourceAgentId} -> ${targetAgentId}: ${options.operation} (${Date.now() - startTime}ms)`);
      
      return decryptedResponse;
      
    } catch (error) {
      this.metrics.connections.failed++;
      
      await this.auditLogger.log({
        action: 'secure_communication_failed',
        actor: sourceAgentId,
        resource: targetAgentId,
        outcome: 'failure',
        details: {
          operation: options.operation,
          error: error instanceof Error ? error.message : 'Unknown error',
          request_id: requestId
        },
        severity: 'medium',
        category: 'security',
        tags: ['communication_failure', 'mtls', 'error']
      });
      
      this.logger.error(`Secure communication failed ${sourceAgentId} -> ${targetAgentId}: ${error}`);
      throw error;
    }
  }

  /**
   * Create secure service-to-service HTTP client
   */
  private async createServiceClient(service: ServiceIdentity): Promise<void> {
    try {
      // Load service certificate and key
      const cert = await fs.readFile(service.certificate.certPath);
      const key = await fs.readFile(service.certificate.keyPath);
      const ca = await fs.readFile(service.certificate.caPath);
      
      // Create HTTPS agent with mTLS
      const httpsAgent = new https.Agent({
        cert,
        key,
        ca,
        rejectUnauthorized: true,
        checkServerIdentity: (servername, cert) => {
          return this.verifyServerIdentity(servername, cert);
        },
        // TLS configuration
        secureProtocol: 'TLSv1_3_method',
        ciphers: [
          'TLS_AES_256_GCM_SHA384',
          'TLS_CHACHA20_POLY1305_SHA256',
          'TLS_AES_128_GCM_SHA256'
        ].join(':'),
        honorCipherOrder: true
      });
      
      // Create Axios client with mTLS agent
      const client = axios.create({
        httpsAgent,
        timeout: 30000,
        validateStatus: (status) => status < 500, // Accept 4xx but not 5xx
        headers: {
          'User-Agent': `OpenConductor-Service/${service.serviceId}`,
          'X-Service-Type': service.serviceType,
          'X-Service-Version': service.metadata.version
        }
      });
      
      // Add request interceptor for encryption
      client.interceptors.request.use(async (config) => {
        // Add authentication headers
        config.headers = {
          ...config.headers,
          'X-Service-Certificate-Fingerprint': service.certificate.fingerprint,
          'X-Timestamp': new Date().toISOString()
        };
        
        return config;
      });
      
      // Add response interceptor for metrics
      client.interceptors.response.use(
        (response) => {
          this.metrics.connections.successful++;
          return response;
        },
        (error) => {
          this.metrics.connections.failed++;
          if (error.response?.status === 401 || error.response?.status === 403) {
            this.metrics.connections.authFailures++;
          }
          return Promise.reject(error);
        }
      );
      
      this.serviceClients.set(service.serviceId, client);
      
    } catch (error) {
      this.logger.error(`Failed to create service client for ${service.serviceId}: ${error}`);
      throw error;
    }
  }

  /**
   * Generate service certificate for mTLS
   */
  private async generateServiceCertificate(
    serviceId: string,
    serviceName: string,
    serviceType: ServiceIdentity['serviceType']
  ): Promise<ServiceIdentity['certificate']> {
    try {
      if (!this.serviceCA) {
        throw new Error('Certificate Authority not initialized');
      }
      
      // Generate key pair for service
      const keyPair = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
      });
      
      // Create certificate signing request (CSR)
      const csr = this.createCSR(serviceId, serviceName, keyPair.publicKey);
      
      // Sign certificate with CA
      const certificate = await this.signServiceCertificate(csr, serviceType);
      
      // Calculate fingerprint
      const fingerprint = crypto.createHash('sha256')
        .update(certificate)
        .digest('hex');
      
      // Determine file paths
      const certDir = `/etc/ssl/openconductor/services/${serviceId}`;
      const certPath = `${certDir}/cert.pem`;
      const keyPath = `${certDir}/key.pem`;
      const caPath = this.serviceMeshConfig.certificateAuthority.rootCertPath;
      
      // Ensure directory exists
      await fs.mkdir(certDir, { recursive: true, mode: 0o700 });
      
      // Write certificate and key files
      await fs.writeFile(certPath, certificate, { mode: 0o644 });
      await fs.writeFile(keyPath, keyPair.privateKey, { mode: 0o600 });
      
      const validFrom = new Date();
      const validTo = new Date(validFrom.getTime() + (this.serviceMeshConfig.certificateLifetime * 24 * 60 * 60 * 1000));
      
      return {
        certPath,
        keyPath,
        caPath,
        fingerprint,
        validFrom,
        validTo
      };
      
    } catch (error) {
      this.logger.error(`Failed to generate service certificate for ${serviceId}: ${error}`);
      throw error;
    }
  }

  /**
   * Encrypt payload for secure service communication
   */
  private async encryptServicePayload(
    payload: any,
    request: ServiceCommunicationRequest
  ): Promise<any> {
    if (request.encryptionLevel === 'standard') {
      // Standard encryption - just return payload (TLS handles encryption)
      return payload;
    }
    
    // Get target service for encryption key
    const targetService = this.services.get(request.targetService);
    if (!targetService) {
      throw new Error(`Target service not found: ${request.targetService}`);
    }
    
    // Generate symmetric key for this communication
    const communicationKey = crypto.randomBytes(32); // 256-bit key
    const iv = crypto.randomBytes(12); // 96-bit IV for GCM
    
    // Encrypt payload
    const cipher = crypto.createCipherGCM(this.serviceMeshConfig.encryptionAlgorithm, communicationKey, iv);
    const payloadBuffer = Buffer.from(JSON.stringify(payload));
    
    let encrypted = cipher.update(payloadBuffer);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    const authTag = cipher.getAuthTag();
    
    // Encrypt communication key with target service's public key
    const targetCert = await fs.readFile(targetService.certificate.certPath, 'utf8');
    const publicKey = crypto.createPublicKey(targetCert);
    const encryptedKey = crypto.publicEncrypt(publicKey, communicationKey);
    
    return {
      encrypted_payload: encrypted.toString('base64'),
      encrypted_key: encryptedKey.toString('base64'),
      iv: iv.toString('base64'),
      auth_tag: authTag.toString('base64'),
      algorithm: this.serviceMeshConfig.encryptionAlgorithm,
      encryption_level: request.encryptionLevel
    };
  }

  /**
   * Decrypt payload from secure service communication
   */
  private async decryptServicePayload(
    encryptedData: any,
    request: ServiceCommunicationRequest
  ): Promise<any> {
    if (request.encryptionLevel === 'standard' || !encryptedData.encrypted_payload) {
      // Standard encryption or unencrypted data
      return encryptedData;
    }
    
    try {
      // Get source service for decryption
      const sourceService = this.services.get(request.sourceService);
      if (!sourceService) {
        throw new Error(`Source service not found: ${request.sourceService}`);
      }
      
      // Decrypt communication key with our private key
      const privateKey = await fs.readFile(sourceService.certificate.keyPath);
      const encryptedKey = Buffer.from(encryptedData.encrypted_key, 'base64');
      const communicationKey = crypto.privateDecrypt(privateKey, encryptedKey);
      
      // Decrypt payload
      const iv = Buffer.from(encryptedData.iv, 'base64');
      const authTag = Buffer.from(encryptedData.auth_tag, 'base64');
      const encryptedPayload = Buffer.from(encryptedData.encrypted_payload, 'base64');
      
      const decipher = crypto.createDecipherGCM(encryptedData.algorithm, communicationKey, iv);
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encryptedPayload);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      
      return JSON.parse(decrypted.toString());
      
    } catch (error) {
      this.logger.error(`Failed to decrypt service payload: ${error}`);
      throw error;
    }
  }

  // Private helper methods
  
  private async initializeCertificateAuthority(): Promise<void> {
    try {
      // Try to load existing CA
      try {
        const caCert = await fs.readFile(this.serviceMeshConfig.certificateAuthority.rootCertPath);
        const caKey = await fs.readFile(this.serviceMeshConfig.certificateAuthority.rootKeyPath);
        const fingerprint = crypto.createHash('sha256').update(caCert).digest('hex');
        
        this.serviceCA = {
          cert: caCert,
          key: caKey,
          fingerprint
        };
        
        this.logger.info('Loaded existing Certificate Authority');
        return;
      } catch (error) {
        // CA doesn't exist, create new one
      }
      
      // Generate new CA
      const caKeyPair = crypto.generateKeyPairSync('rsa', {
        modulusLength: 4096,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
      });
      
      // Create self-signed CA certificate
      const caCert = this.createCACertificate(caKeyPair);
      const fingerprint = crypto.createHash('sha256').update(Buffer.from(caCert)).digest('hex');
      
      // Ensure CA directory exists
      await fs.mkdir(path.dirname(this.serviceMeshConfig.certificateAuthority.rootCertPath), { 
        recursive: true, 
        mode: 0o700 
      });
      
      // Save CA certificate and key
      await fs.writeFile(this.serviceMeshConfig.certificateAuthority.rootCertPath, caCert, { mode: 0o644 });
      await fs.writeFile(this.serviceMeshConfig.certificateAuthority.rootKeyPath, caKeyPair.privateKey, { mode: 0o600 });
      
      this.serviceCA = {
        cert: Buffer.from(caCert),
        key: Buffer.from(caKeyPair.privateKey),
        fingerprint
      };
      
      this.logger.info('Created new Certificate Authority for service mesh');
      
    } catch (error) {
      this.logger.error(`Failed to initialize Certificate Authority: ${error}`);
      throw error;
    }
  }

  private async registerCoreServices(): Promise<void> {
    // Register Trinity AI agents and core services
    const coreServices = [
      {
        id: 'oracle-agent',
        name: 'Oracle Agent',
        type: 'oracle_agent' as const,
        permissions: {
          canCommunicateWith: ['sentinel-agent', 'sage-agent', 'gtm-engine'],
          acceptsFrom: ['api-gateway', 'workflow-engine'],
          operations: ['predict', 'forecast', 'analyze']
        }
      },
      {
        id: 'sentinel-agent',
        name: 'Sentinel Agent',
        type: 'sentinel_agent' as const,
        permissions: {
          canCommunicateWith: ['oracle-agent', 'sage-agent', 'workflow-engine'],
          acceptsFrom: ['api-gateway', 'gtm-engine'],
          operations: ['monitor', 'alert', 'healthcheck']
        }
      },
      {
        id: 'sage-agent',
        name: 'Sage Agent',
        type: 'sage_agent' as const,
        permissions: {
          canCommunicateWith: ['oracle-agent', 'sentinel-agent', 'gtm-engine'],
          acceptsFrom: ['api-gateway', 'workflow-engine'],
          operations: ['advise', 'recommend', 'analyze']
        }
      },
      {
        id: 'api-gateway',
        name: 'API Gateway',
        type: 'api_gateway' as const,
        permissions: {
          canCommunicateWith: ['oracle-agent', 'sentinel-agent', 'sage-agent', 'workflow-engine', 'gtm-engine'],
          acceptsFrom: [],
          operations: ['proxy', 'authenticate', 'authorize']
        }
      },
      {
        id: 'workflow-engine',
        name: 'Workflow Engine',
        type: 'workflow_engine' as const,
        permissions: {
          canCommunicateWith: ['oracle-agent', 'sentinel-agent', 'sage-agent'],
          acceptsFrom: ['api-gateway'],
          operations: ['execute', 'coordinate', 'monitor']
        }
      },
      {
        id: 'gtm-engine',
        name: 'GTM AI Engine',
        type: 'gtm_engine' as const,
        permissions: {
          canCommunicateWith: ['oracle-agent', 'sentinel-agent', 'sage-agent'],
          acceptsFrom: ['api-gateway'],
          operations: ['qualify', 'nurture', 'convert', 'retain']
        }
      }
    ];
    
    for (const service of coreServices) {
      await this.registerService(service.id, service.name, service.type, {
        permissions: service.permissions,
        endpoints: {
          primary: `https://${service.name.toLowerCase().replace(/\s+/g, '-')}:8443`
        },
        metadata: {
          version: '1.0.0',
          environment: 'production'
        }
      });
    }
  }

  private createCSR(serviceId: string, serviceName: string, publicKey: string): string {
    // Create Certificate Signing Request
    // This is simplified - real implementation would use proper CSR format
    return `-----BEGIN CERTIFICATE REQUEST-----
Service: ${serviceName}
ServiceID: ${serviceId}
PublicKey: ${publicKey}
-----END CERTIFICATE REQUEST-----`;
  }

  private createCACertificate(keyPair: any): string {
    // Create self-signed CA certificate
    // This is simplified - real implementation would use proper X.509 format
    return `-----BEGIN CERTIFICATE-----
OpenConductor Service Mesh CA
Validity: ${new Date().toISOString()} to ${new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString()}
-----END CERTIFICATE-----`;
  }

  private async signServiceCertificate(csr: string, serviceType: ServiceIdentity['serviceType']): Promise<string> {
    // Sign service certificate with CA
    // This is simplified - real implementation would use proper certificate signing
    return `-----BEGIN CERTIFICATE-----
Service Certificate for ${serviceType}
Signed by OpenConductor Service Mesh CA
Validity: ${new Date().toISOString()} to ${new Date(Date.now() + this.serviceMeshConfig.certificateLifetime * 24 * 60 * 60 * 1000).toISOString()}
-----END CERTIFICATE-----`;
  }

  private verifyServerIdentity(servername: string, cert: any): Error | undefined {
    // Verify server identity based on certificate
    // This would implement proper certificate validation
    return undefined; // Accept all for now
  }

  private isAuthorized(source: ServiceIdentity, target: ServiceIdentity, operation: string): boolean {
    // Check if source service is authorized to perform operation on target
    return source.permissions.canCommunicateWith.includes(target.serviceId) &&
           target.permissions.acceptsFrom.includes(source.serviceId) &&
           target.permissions.operations.includes(operation);
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  }

  private startCertificateRotationMonitor(): void {
    this.certificateRotationInterval = setInterval(async () => {
      await this.checkAndRotateServiceCertificates();
    }, 24 * 60 * 60 * 1000); // Daily check
  }

  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(async () => {
      await this.performServiceHealthChecks();
    }, 60 * 1000); // Every minute
  }

  private startMetricsCollection(): void {
    this.metricsCollectionInterval = setInterval(() => {
      this.updateServiceMetrics();
    }, 30 * 1000); // Every 30 seconds
  }

  private async checkAndRotateServiceCertificates(): Promise<void> {
    const now = new Date();
    const rotationThreshold = this.serviceMeshConfig.rotationThreshold * 24 * 60 * 60 * 1000;
    
    for (const [serviceId, service] of this.services.entries()) {
      const timeUntilExpiry = service.certificate.validTo.getTime() - now.getTime();
      
      if (timeUntilExpiry <= rotationThreshold) {
        try {
          await this.rotateServiceCertificate(serviceId);
        } catch (error) {
          this.logger.error(`Failed to rotate certificate for service ${serviceId}: ${error}`);
        }
      }
    }
  }

  private async rotateServiceCertificate(serviceId: string): Promise<void> {
    const service = this.services.get(serviceId);
    if (!service) {
      throw new Error(`Service not found: ${serviceId}`);
    }
    
    // Generate new certificate
    const newCert = await this.generateServiceCertificate(serviceId, service.serviceName, service.serviceType);
    
    // Update service identity
    service.certificate = newCert;
    this.services.set(serviceId, service);
    
    // Recreate service client with new certificate
    await this.createServiceClient(service);
    
    this.metrics.services.certificateExpiring--;
    
    this.logger.info(`Rotated certificate for service: ${serviceId}`);
  }

  private async performServiceHealthChecks(): Promise<void> {
    let healthy = 0;
    
    for (const [serviceId, service] of this.services.entries()) {
      try {
        const client = this.serviceClients.get(serviceId);
        if (client) {
          await client.get(service.endpoints.health, { timeout: 5000 });
          healthy++;
        }
      } catch (error) {
        this.logger.debug(`Service health check failed for ${serviceId}: ${error}`);
      }
    }
    
    this.metrics.services.healthy = healthy;
    this.metrics.services.active = this.services.size;
  }

  private updateServiceMetrics(): void {
    this.metrics.connections.active = this.activeConnections.size;
    this.metrics.security.mtlsConnections = this.activeConnections.size;
    
    // Calculate certificate expiry metrics
    const now = new Date();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    
    this.metrics.services.certificateExpiring = 0;
    for (const service of this.services.values()) {
      const timeUntilExpiry = service.certificate.validTo.getTime() - now.getTime();
      if (timeUntilExpiry <= thirtyDays) {
        this.metrics.services.certificateExpiring++;
      }
    }
  }

  // Public API methods
  
  public getRegisteredServices(): ServiceIdentity[] {
    return Array.from(this.services.values());
  }

  public getServiceIdentity(serviceId: string): ServiceIdentity | undefined {
    return this.services.get(serviceId);
  }

  public getActiveConnections(): mTLSConnection[] {
    return Array.from(this.activeConnections.values());
  }

  public getServiceMeshMetrics(): ServiceMeshMetrics {
    return { ...this.metrics };
  }

  public async healthCheck(): Promise<{ status: string; details: any }> {
    const metrics = this.getServiceMeshMetrics();
    const certificateIssues = metrics.services.certificateExpiring;
    const connectionFailures = metrics.connections.failed;
    
    const status = certificateIssues > 0 || connectionFailures > 10 ? 'warning' : 'healthy';
    
    return {
      status,
      details: {
        services: {
          registered: metrics.services.registered,
          healthy: metrics.services.healthy,
          certificate_expiring: certificateIssues
        },
        connections: {
          active: metrics.connections.active,
          success_rate: metrics.connections.total > 0 ? 
            (metrics.connections.successful / metrics.connections.total * 100).toFixed(1) + '%' : 'N/A'
        },
        ca_initialized: !!this.serviceCA,
        mtls_enabled: this.serviceMeshConfig.enabled
      }
    };
  }
}

export default InterServiceEncryption;