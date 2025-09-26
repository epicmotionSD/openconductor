/**
 * OpenConductor Enterprise RBAC (Role-Based Access Control)
 * 
 * Provides fine-grained permissions management for enterprise users:
 * - Hierarchical role system
 * - Resource-based permissions
 * - Dynamic policy evaluation
 * - Integration with SSO providers
 * - Audit trail for all access decisions
 */

import { FeatureGates, requiresEnterprise } from '../feature-gates';
import { Logger } from '../../utils/logger';
import { AuditLogger } from './audit-logger';

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
  conditions?: PermissionCondition[];
}

export interface PermissionCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'in' | 'not_in' | 'greater_than' | 'less_than';
  value: any;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[]; // Permission IDs
  parent?: string; // Parent role ID for inheritance
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface User {
  id: string;
  email: string;
  roles: string[]; // Role IDs
  directPermissions: string[]; // Direct permission assignments
  groups: string[];
  attributes: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
  lastLogin?: Date;
}

export interface AccessContext {
  userId: string;
  resource: string;
  action: string;
  resourceAttributes?: Record<string, any>;
  userAttributes?: Record<string, any>;
  environment?: Record<string, any>;
  timestamp?: Date;
}

export interface AccessDecision {
  allowed: boolean;
  reason: string;
  matchedRoles: string[];
  matchedPermissions: string[];
  evaluatedConditions: Array<{
    condition: PermissionCondition;
    result: boolean;
  }>;
  evaluationTime: number;
}

export interface PolicyRule {
  id: string;
  name: string;
  description: string;
  effect: 'allow' | 'deny';
  conditions: Array<{
    field: string;
    operator: string;
    value: any;
  }>;
  priority: number;
  enabled: boolean;
}

@requiresEnterprise('rbac')
export class RBACManager {
  private static instance: RBACManager;
  private featureGates: FeatureGates;
  private logger: Logger;
  private auditLogger: AuditLogger;
  private permissions: Map<string, Permission> = new Map();
  private roles: Map<string, Role> = new Map();
  private users: Map<string, User> = new Map();
  private policies: Map<string, PolicyRule> = new Map();
  private roleHierarchy: Map<string, string[]> = new Map(); // role -> child roles

  private constructor(logger: Logger) {
    this.featureGates = FeatureGates.getInstance();
    this.logger = logger;
    this.auditLogger = AuditLogger.getInstance();
    this.initializeDefaultRolesAndPermissions();
  }

  public static getInstance(logger?: Logger): RBACManager {
    if (!RBACManager.instance) {
      if (!logger) throw new Error('Logger required for first initialization');
      RBACManager.instance = new RBACManager(logger);
    }
    return RBACManager.instance;
  }

  /**
   * Check if user has permission to perform action on resource
   */
  public async checkAccess(context: AccessContext): Promise<AccessDecision> {
    const startTime = Date.now();
    
    if (!this.featureGates.canUseRBAC()) {
      // Community edition - basic access check
      return {
        allowed: true,
        reason: 'Community edition - basic access granted',
        matchedRoles: [],
        matchedPermissions: [],
        evaluatedConditions: [],
        evaluationTime: Date.now() - startTime
      };
    }

    const user = this.users.get(context.userId);
    if (!user) {
      await this.auditLogger.log({
        action: 'access_denied',
        actor: context.userId,
        resource: context.resource,
        details: { reason: 'User not found', action: context.action }
      });

      return {
        allowed: false,
        reason: 'User not found',
        matchedRoles: [],
        matchedPermissions: [],
        evaluatedConditions: [],
        evaluationTime: Date.now() - startTime
      };
    }

    if (!user.isActive) {
      await this.auditLogger.log({
        action: 'access_denied',
        actor: context.userId,
        resource: context.resource,
        details: { reason: 'User inactive', action: context.action }
      });

      return {
        allowed: false,
        reason: 'User account is inactive',
        matchedRoles: [],
        matchedPermissions: [],
        evaluatedConditions: [],
        evaluationTime: Date.now() - startTime
      };
    }

    // Evaluate policies (deny rules first)
    const policyDecision = await this.evaluatePolicies(context, user);
    if (policyDecision.effect === 'deny') {
      await this.auditLogger.log({
        action: 'access_denied',
        actor: context.userId,
        resource: context.resource,
        details: { 
          reason: 'Denied by policy', 
          action: context.action,
          policy: policyDecision.policyId 
        }
      });

      return {
        allowed: false,
        reason: `Denied by policy: ${policyDecision.policyName}`,
        matchedRoles: [],
        matchedPermissions: [],
        evaluatedConditions: [],
        evaluationTime: Date.now() - startTime
      };
    }

    // Get all user permissions (from roles + direct assignments)
    const userPermissions = await this.getUserPermissions(user);
    const matchedRoles: string[] = [];
    const matchedPermissions: string[] = [];
    const evaluatedConditions: Array<{
      condition: PermissionCondition;
      result: boolean;
    }> = [];

    // Check each permission
    for (const permissionId of userPermissions) {
      const permission = this.permissions.get(permissionId);
      if (!permission) continue;

      // Check if permission matches resource and action
      if (this.matchesResourceAction(permission, context.resource, context.action)) {
        matchedPermissions.push(permissionId);

        // Evaluate conditions if any
        if (permission.conditions && permission.conditions.length > 0) {
          let allConditionsMet = true;
          
          for (const condition of permission.conditions) {
            const result = this.evaluateCondition(condition, context);
            evaluatedConditions.push({ condition, result });
            
            if (!result) {
              allConditionsMet = false;
            }
          }

          if (allConditionsMet) {
            // Find which roles granted this permission
            const grantingRoles = user.roles.filter(roleId => {
              const role = this.roles.get(roleId);
              return role?.permissions.includes(permissionId);
            });
            matchedRoles.push(...grantingRoles);

            await this.auditLogger.log({
              action: 'access_granted',
              actor: context.userId,
              resource: context.resource,
              details: {
                action: context.action,
                permission: permissionId,
                roles: grantingRoles
              }
            });

            return {
              allowed: true,
              reason: `Permission granted: ${permission.name}`,
              matchedRoles: [...new Set(matchedRoles)],
              matchedPermissions,
              evaluatedConditions,
              evaluationTime: Date.now() - startTime
            };
          }
        } else {
          // No conditions - permission granted
          const grantingRoles = user.roles.filter(roleId => {
            const role = this.roles.get(roleId);
            return role?.permissions.includes(permissionId);
          });
          matchedRoles.push(...grantingRoles);

          await this.auditLogger.log({
            action: 'access_granted',
            actor: context.userId,
            resource: context.resource,
            details: {
              action: context.action,
              permission: permissionId,
              roles: grantingRoles
            }
          });

          return {
            allowed: true,
            reason: `Permission granted: ${permission.name}`,
            matchedRoles: [...new Set(matchedRoles)],
            matchedPermissions,
            evaluatedConditions,
            evaluationTime: Date.now() - startTime
          };
        }
      }
    }

    // No matching permissions found
    await this.auditLogger.log({
      action: 'access_denied',
      actor: context.userId,
      resource: context.resource,
      details: {
        reason: 'No matching permissions',
        action: context.action,
        userRoles: user.roles
      }
    });

    return {
      allowed: false,
      reason: 'No matching permissions found',
      matchedRoles,
      matchedPermissions,
      evaluatedConditions,
      evaluationTime: Date.now() - startTime
    };
  }

  /**
   * Create new role
   */
  public async createRole(role: Omit<Role, 'createdAt' | 'updatedAt'>): Promise<Role> {
    if (!this.featureGates.canUseRBAC()) {
      throw new Error('RBAC requires Enterprise Edition');
    }

    const newRole: Role = {
      ...role,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Validate permissions exist
    for (const permissionId of role.permissions) {
      if (!this.permissions.has(permissionId)) {
        throw new Error(`Permission not found: ${permissionId}`);
      }
    }

    // Validate parent role exists
    if (role.parent && !this.roles.has(role.parent)) {
      throw new Error(`Parent role not found: ${role.parent}`);
    }

    this.roles.set(role.id, newRole);
    this.updateRoleHierarchy();

    await this.auditLogger.log({
      action: 'role_created',
      actor: role.createdBy,
      resource: `role:${role.id}`,
      details: {
        roleName: role.name,
        permissions: role.permissions,
        parent: role.parent
      }
    });

    this.logger.info(`Role created: ${role.name} (${role.id})`);
    return newRole;
  }

  /**
   * Assign role to user
   */
  public async assignRole(userId: string, roleId: string, assignedBy: string): Promise<void> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    const role = this.roles.get(roleId);
    if (!role) {
      throw new Error(`Role not found: ${roleId}`);
    }

    if (!user.roles.includes(roleId)) {
      user.roles.push(roleId);

      await this.auditLogger.log({
        action: 'role_assigned',
        actor: assignedBy,
        resource: `user:${userId}`,
        details: {
          roleId,
          roleName: role.name,
          userEmail: user.email
        }
      });

      this.logger.info(`Role ${role.name} assigned to user ${user.email}`);
    }
  }

  /**
   * Remove role from user
   */
  public async removeRole(userId: string, roleId: string, removedBy: string): Promise<void> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    const roleIndex = user.roles.indexOf(roleId);
    if (roleIndex > -1) {
      user.roles.splice(roleIndex, 1);
      const role = this.roles.get(roleId);

      await this.auditLogger.log({
        action: 'role_removed',
        actor: removedBy,
        resource: `user:${userId}`,
        details: {
          roleId,
          roleName: role?.name,
          userEmail: user.email
        }
      });

      this.logger.info(`Role ${role?.name} removed from user ${user.email}`);
    }
  }

  /**
   * Create user
   */
  public async createUser(userData: Omit<User, 'createdAt'>): Promise<User> {
    const user: User = {
      ...userData,
      createdAt: new Date()
    };

    this.users.set(user.id, user);

    await this.auditLogger.log({
      action: 'user_created',
      actor: 'system',
      resource: `user:${user.id}`,
      details: {
        userEmail: user.email,
        roles: user.roles
      }
    });

    this.logger.info(`User created: ${user.email}`);
    return user;
  }

  /**
   * Get user permissions including inherited from roles
   */
  private async getUserPermissions(user: User): Promise<string[]> {
    const allPermissions = new Set<string>();

    // Add direct permissions
    user.directPermissions.forEach(p => allPermissions.add(p));

    // Add permissions from roles (including inherited)
    for (const roleId of user.roles) {
      const rolePermissions = await this.getRolePermissions(roleId);
      rolePermissions.forEach(p => allPermissions.add(p));
    }

    return Array.from(allPermissions);
  }

  /**
   * Get all permissions for a role including inherited from parent roles
   */
  private async getRolePermissions(roleId: string): Promise<string[]> {
    const allPermissions = new Set<string>();
    const visited = new Set<string>();

    const collectPermissions = (currentRoleId: string) => {
      if (visited.has(currentRoleId)) return;
      visited.add(currentRoleId);

      const role = this.roles.get(currentRoleId);
      if (!role) return;

      // Add role's direct permissions
      role.permissions.forEach(p => allPermissions.add(p));

      // Recursively add parent role permissions
      if (role.parent) {
        collectPermissions(role.parent);
      }
    };

    collectPermissions(roleId);
    return Array.from(allPermissions);
  }

  /**
   * Check if permission matches resource and action
   */
  private matchesResourceAction(permission: Permission, resource: string, action: string): boolean {
    // Support wildcards
    const resourceMatches = permission.resource === '*' || 
                           permission.resource === resource ||
                           this.matchesPattern(permission.resource, resource);
    
    const actionMatches = permission.action === '*' ||
                         permission.action === action ||
                         this.matchesPattern(permission.action, action);

    return resourceMatches && actionMatches;
  }

  /**
   * Simple pattern matching with wildcards
   */
  private matchesPattern(pattern: string, value: string): boolean {
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(value);
    }
    return pattern === value;
  }

  /**
   * Evaluate permission condition
   */
  private evaluateCondition(condition: PermissionCondition, context: AccessContext): boolean {
    const contextValue = this.getContextValue(condition.field, context);
    
    switch (condition.operator) {
      case 'equals':
        return contextValue === condition.value;
      case 'not_equals':
        return contextValue !== condition.value;
      case 'contains':
        return String(contextValue).includes(condition.value);
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(contextValue);
      case 'not_in':
        return Array.isArray(condition.value) && !condition.value.includes(contextValue);
      case 'greater_than':
        return Number(contextValue) > Number(condition.value);
      case 'less_than':
        return Number(contextValue) < Number(condition.value);
      default:
        return false;
    }
  }

  /**
   * Get value from context using dot notation
   */
  private getContextValue(field: string, context: AccessContext): any {
    const path = field.split('.');
    let value: any = {
      user: context.userAttributes,
      resource: context.resourceAttributes,
      environment: context.environment,
      userId: context.userId,
      action: context.action,
      resourceName: context.resource
    };

    for (const key of path) {
      value = value?.[key];
    }

    return value;
  }

  /**
   * Evaluate policy rules
   */
  private async evaluatePolicies(context: AccessContext, user: User): Promise<{
    effect: 'allow' | 'deny' | 'neutral';
    policyId?: string;
    policyName?: string;
  }> {
    const applicablePolicies = Array.from(this.policies.values())
      .filter(policy => policy.enabled)
      .sort((a, b) => b.priority - a.priority); // Higher priority first

    for (const policy of applicablePolicies) {
      const matches = policy.conditions.every(condition => 
        this.evaluateCondition(condition, context)
      );

      if (matches) {
        return {
          effect: policy.effect,
          policyId: policy.id,
          policyName: policy.name
        };
      }
    }

    return { effect: 'neutral' };
  }

  /**
   * Update role hierarchy cache
   */
  private updateRoleHierarchy(): void {
    this.roleHierarchy.clear();
    
    for (const role of this.roles.values()) {
      if (role.parent) {
        if (!this.roleHierarchy.has(role.parent)) {
          this.roleHierarchy.set(role.parent, []);
        }
        this.roleHierarchy.get(role.parent)!.push(role.id);
      }
    }
  }

  /**
   * Initialize default roles and permissions
   */
  private initializeDefaultRolesAndPermissions(): void {
    if (!this.featureGates.canUseRBAC()) {
      return;
    }

    // Default permissions
    const defaultPermissions: Permission[] = [
      {
        id: 'agents.read',
        name: 'Read Agents',
        description: 'View agent information and status',
        resource: 'agents',
        action: 'read'
      },
      {
        id: 'agents.write',
        name: 'Manage Agents',
        description: 'Create, update, and delete agents',
        resource: 'agents',
        action: 'write'
      },
      {
        id: 'alerts.read',
        name: 'Read Alerts',
        description: 'View alerts and notifications',
        resource: 'alerts',
        action: 'read'
      },
      {
        id: 'alerts.manage',
        name: 'Manage Alerts',
        description: 'Acknowledge, resolve, and configure alerts',
        resource: 'alerts',
        action: 'manage'
      },
      {
        id: 'dashboards.read',
        name: 'Read Dashboards',
        description: 'View dashboards and reports',
        resource: 'dashboards',
        action: 'read'
      },
      {
        id: 'dashboards.write',
        name: 'Manage Dashboards',
        description: 'Create and modify dashboards',
        resource: 'dashboards',
        action: 'write'
      },
      {
        id: 'admin.users',
        name: 'User Administration',
        description: 'Manage users and their access',
        resource: 'users',
        action: '*'
      },
      {
        id: 'admin.system',
        name: 'System Administration',
        description: 'Full system administration access',
        resource: '*',
        action: '*'
      }
    ];

    defaultPermissions.forEach(permission => {
      this.permissions.set(permission.id, permission);
    });

    // Default roles
    const defaultRoles: Omit<Role, 'createdAt' | 'updatedAt'>[] = [
      {
        id: 'viewer',
        name: 'Viewer',
        description: 'Read-only access to basic resources',
        permissions: ['agents.read', 'alerts.read', 'dashboards.read'],
        metadata: {},
        createdBy: 'system'
      },
      {
        id: 'operator',
        name: 'Operator',
        description: 'Can manage alerts and view system status',
        permissions: ['agents.read', 'alerts.read', 'alerts.manage', 'dashboards.read'],
        parent: 'viewer',
        metadata: {},
        createdBy: 'system'
      },
      {
        id: 'engineer',
        name: 'Engineer',
        description: 'Can manage agents and create dashboards',
        permissions: ['agents.write', 'dashboards.write'],
        parent: 'operator',
        metadata: {},
        createdBy: 'system'
      },
      {
        id: 'admin',
        name: 'Administrator',
        description: 'Full system access',
        permissions: ['admin.users', 'admin.system'],
        parent: 'engineer',
        metadata: {},
        createdBy: 'system'
      }
    ];

    defaultRoles.forEach(roleData => {
      const role: Role = {
        ...roleData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.roles.set(role.id, role);
    });

    this.updateRoleHierarchy();
    this.logger.info('Default RBAC roles and permissions initialized');
  }

  // Public API methods
  public getUser(userId: string): User | undefined {
    return this.users.get(userId);
  }

  public getRole(roleId: string): Role | undefined {
    return this.roles.get(roleId);
  }

  public getPermission(permissionId: string): Permission | undefined {
    return this.permissions.get(permissionId);
  }

  public getAllRoles(): Role[] {
    return Array.from(this.roles.values());
  }

  public getAllPermissions(): Permission[] {
    return Array.from(this.permissions.values());
  }

  public getAllUsers(): User[] {
    return Array.from(this.users.values());
  }
}