import { logger } from './logger.js';

/**
 * Comprehensive input validation utilities for CLI commands
 */
export class Validators {
  /**
   * Validate server slug/identifier
   */
  static validateServerSlug(slug) {
    if (!slug || typeof slug !== 'string') {
      throw new Error('Server name is required');
    }

    if (slug.trim().length === 0) {
      throw new Error('Server name cannot be empty');
    }

    // Check for invalid characters
    const invalidChars = /[^a-zA-Z0-9\-_]/;
    if (invalidChars.test(slug)) {
      throw new Error('Server name can only contain letters, numbers, hyphens, and underscores');
    }

    if (slug.length > 100) {
      throw new Error('Server name must be less than 100 characters');
    }

    return slug.toLowerCase().trim();
  }

  /**
   * Validate category
   */
  static validateCategory(category) {
    const validCategories = [
      'memory', 'filesystem', 'database', 'api', 'search',
      'communication', 'monitoring', 'development', 'custom'
    ];

    if (category && !validCategories.includes(category)) {
      throw new Error(`Invalid category. Must be one of: ${validCategories.join(', ')}`);
    }

    return category;
  }

  /**
   * Validate tags array
   */
  static validateTags(tags) {
    if (!tags) return [];

    if (!Array.isArray(tags)) {
      tags = [tags];
    }

    // Validate each tag
    const validatedTags = tags.map(tag => {
      if (typeof tag !== 'string') {
        throw new Error('Tags must be strings');
      }

      const cleaned = tag.trim().toLowerCase();
      if (cleaned.length === 0) {
        throw new Error('Tags cannot be empty');
      }

      if (cleaned.length > 50) {
        throw new Error('Tags must be less than 50 characters');
      }

      if (!/^[a-z0-9\-_]+$/.test(cleaned)) {
        throw new Error('Tags can only contain letters, numbers, hyphens, and underscores');
      }

      return cleaned;
    });

    if (validatedTags.length > 10) {
      throw new Error('Maximum 10 tags allowed');
    }

    // Remove duplicates
    return [...new Set(validatedTags)];
  }

  /**
   * Validate limit parameter
   */
  static validateLimit(limit, max = 50) {
    if (!limit) return 10; // default

    const num = parseInt(limit, 10);
    
    if (isNaN(num)) {
      throw new Error('Limit must be a number');
    }

    if (num < 1) {
      throw new Error('Limit must be at least 1');
    }

    if (num > max) {
      throw new Error(`Limit cannot exceed ${max}`);
    }

    return num;
  }

  /**
   * Validate port number
   */
  static validatePort(port) {
    if (!port) return null;

    const num = parseInt(port, 10);
    
    if (isNaN(num)) {
      throw new Error('Port must be a number');
    }

    if (num < 1024) {
      throw new Error('Port must be 1024 or higher (avoiding system ports)');
    }

    if (num > 65535) {
      throw new Error('Port must be 65535 or lower');
    }

    return num;
  }

  /**
   * Validate file path
   */
  static validatePath(path) {
    if (!path || typeof path !== 'string') {
      throw new Error('Path is required and must be a string');
    }

    const cleaned = path.trim();
    if (cleaned.length === 0) {
      throw new Error('Path cannot be empty');
    }

    // Basic path validation - could be enhanced
    if (cleaned.includes('..')) {
      throw new Error('Path cannot contain ".." for security reasons');
    }

    return cleaned;
  }

  /**
   * Validate URL
   */
  static validateUrl(url) {
    if (!url) return null;

    try {
      const parsed = new URL(url);
      
      // Only allow http/https
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error('URL must use http or https protocol');
      }

      return url;
    } catch (error) {
      throw new Error(`Invalid URL: ${error.message}`);
    }
  }

  /**
   * Validate GitHub repository URL
   */
  static validateGitHubUrl(url) {
    const validatedUrl = this.validateUrl(url);
    
    if (!validatedUrl) {
      throw new Error('GitHub repository URL is required');
    }

    if (!validatedUrl.includes('github.com')) {
      throw new Error('Must be a GitHub repository URL');
    }

    const match = validatedUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
      throw new Error('Invalid GitHub repository URL format');
    }

    return {
      url: validatedUrl,
      owner: match[1],
      name: match[2].replace(/\.git$/, '')
    };
  }

  /**
   * Validate npm package name
   */
  static validateNpmPackage(packageName) {
    if (!packageName) return null;

    if (typeof packageName !== 'string') {
      throw new Error('Package name must be a string');
    }

    const cleaned = packageName.trim();
    
    // Basic npm package name validation
    if (!/^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(cleaned)) {
      throw new Error('Invalid npm package name format');
    }

    if (cleaned.length > 214) {
      throw new Error('Package name must be less than 214 characters');
    }

    return cleaned;
  }

  /**
   * Validate search query
   */
  static validateSearchQuery(query) {
    if (!query) return '';

    if (typeof query !== 'string') {
      throw new Error('Search query must be a string');
    }

    const cleaned = query.trim();
    
    if (cleaned.length > 200) {
      throw new Error('Search query must be less than 200 characters');
    }

    // Remove potentially harmful characters
    const sanitized = cleaned.replace(/[<>]/g, '');
    
    return sanitized;
  }

  /**
   * Validate server name
   */
  static validateServerName(name) {
    if (!name || typeof name !== 'string') {
      throw new Error('Server name is required');
    }

    const cleaned = name.trim();
    
    if (cleaned.length === 0) {
      throw new Error('Server name cannot be empty');
    }

    if (cleaned.length < 3) {
      throw new Error('Server name must be at least 3 characters');
    }

    if (cleaned.length > 100) {
      throw new Error('Server name must be less than 100 characters');
    }

    // Allow more flexible naming than slugs
    if (!/^[a-zA-Z0-9\s\-_\.]+$/.test(cleaned)) {
      throw new Error('Server name contains invalid characters');
    }

    return cleaned;
  }

  /**
   * Validate description
   */
  static validateDescription(description) {
    if (!description) return '';

    if (typeof description !== 'string') {
      throw new Error('Description must be a string');
    }

    const cleaned = description.trim();
    
    if (cleaned.length > 5000) {
      throw new Error('Description must be less than 5000 characters');
    }

    return cleaned;
  }

  /**
   * Validate environment variable name
   */
  static validateEnvVarName(name) {
    if (!name || typeof name !== 'string') {
      throw new Error('Environment variable name is required');
    }

    const cleaned = name.trim().toUpperCase();
    
    if (!/^[A-Z][A-Z0-9_]*$/.test(cleaned)) {
      throw new Error('Environment variable names must start with a letter and contain only uppercase letters, numbers, and underscores');
    }

    return cleaned;
  }

  /**
   * Validate command arguments
   */
  static validateCommandArgs(args) {
    if (!args) return [];

    if (!Array.isArray(args)) {
      throw new Error('Command arguments must be an array');
    }

    return args.map(arg => {
      if (typeof arg !== 'string') {
        throw new Error('Command arguments must be strings');
      }
      return arg.trim();
    }).filter(arg => arg.length > 0);
  }

  /**
   * Validate and sanitize JSON input
   */
  static validateJSON(jsonString, maxSize = 10000) {
    if (!jsonString) return null;

    if (typeof jsonString !== 'string') {
      throw new Error('JSON must be provided as a string');
    }

    if (jsonString.length > maxSize) {
      throw new Error(`JSON must be less than ${maxSize} characters`);
    }

    try {
      const parsed = JSON.parse(jsonString);
      
      // Basic security check - no functions or dangerous objects
      const stringified = JSON.stringify(parsed);
      if (stringified !== jsonString.replace(/\s+/g, '')) {
        logger.warn('JSON was sanitized during parsing');
      }

      return parsed;
    } catch (error) {
      throw new Error(`Invalid JSON: ${error.message}`);
    }
  }

  /**
   * Validate version string
   */
  static validateVersion(version) {
    if (!version) return null;

    if (typeof version !== 'string') {
      throw new Error('Version must be a string');
    }

    const cleaned = version.trim();
    
    // Basic semver validation
    if (!/^\d+\.\d+\.\d+(-[a-zA-Z0-9\-\.]+)?(\+[a-zA-Z0-9\-\.]+)?$/.test(cleaned)) {
      throw new Error('Version must follow semantic versioning (e.g., 1.0.0)');
    }

    return cleaned;
  }

  /**
   * Validate CLI command options
   */
  static validateCommandOptions(command, options) {
    const validatedOptions = {};

    switch (command) {
      case 'discover':
        validatedOptions.query = this.validateSearchQuery(options.query);
        validatedOptions.category = this.validateCategory(options.category);
        validatedOptions.tags = this.validateTags(options.tags);
        validatedOptions.limit = this.validateLimit(options.limit, 50);
        break;

      case 'install':
        validatedOptions.serverSlug = this.validateServerSlug(options.serverSlug);
        validatedOptions.config = options.config ? this.validatePath(options.config) : null;
        validatedOptions.port = this.validatePort(options.port);
        validatedOptions.force = Boolean(options.force);
        validatedOptions.yes = Boolean(options.yes);
        validatedOptions.dryRun = Boolean(options.dryRun);
        break;

      case 'remove':
        validatedOptions.serverSlug = this.validateServerSlug(options.serverSlug);
        validatedOptions.config = options.config ? this.validatePath(options.config) : null;
        validatedOptions.yes = Boolean(options.yes);
        break;

      case 'list':
        validatedOptions.config = options.config ? this.validatePath(options.config) : null;
        validatedOptions.format = this.validateFormat(options.format);
        break;

      case 'update':
        if (options.serverSlug) {
          validatedOptions.serverSlug = this.validateServerSlug(options.serverSlug);
        }
        validatedOptions.config = options.config ? this.validatePath(options.config) : null;
        break;

      default:
        // Pass through for unknown commands
        return options;
    }

    return validatedOptions;
  }

  /**
   * Validate output format
   */
  static validateFormat(format) {
    if (!format) return 'table';

    const validFormats = ['table', 'json', 'csv'];
    if (!validFormats.includes(format)) {
      throw new Error(`Invalid format. Must be one of: ${validFormats.join(', ')}`);
    }

    return format;
  }

  /**
   * Create validation middleware for CLI
   */
  static createValidationMiddleware(command) {
    return (options) => {
      try {
        return this.validateCommandOptions(command, options);
      } catch (error) {
        logger.error('Validation error:', error.message);
        logger.info('Use --help to see valid options for this command');
        process.exit(1);
      }
    };
  }
}

// Convenience validation functions
export function validateServerSlug(slug) {
  return Validators.validateServerSlug(slug);
}

export function validateCategory(category) {
  return Validators.validateCategory(category);
}

export function validateTags(tags) {
  return Validators.validateTags(tags);
}

export function validateLimit(limit, max) {
  return Validators.validateLimit(limit, max);
}

export function validatePort(port) {
  return Validators.validatePort(port);
}

export function validatePath(path) {
  return Validators.validatePath(path);
}

export function validateUrl(url) {
  return Validators.validateUrl(url);
}

export function validateGitHubUrl(url) {
  return Validators.validateGitHubUrl(url);
}

export function validateNpmPackage(packageName) {
  return Validators.validateNpmPackage(packageName);
}

export function validateSearchQuery(query) {
  return Validators.validateSearchQuery(query);
}

export function validateJSON(jsonString, maxSize) {
  return Validators.validateJSON(jsonString, maxSize);
}

export function validateVersion(version) {
  return Validators.validateVersion(version);
}

/**
 * Input sanitization utilities
 */
export class Sanitizers {
  /**
   * Sanitize user input for display
   */
  static sanitizeForDisplay(input) {
    if (typeof input !== 'string') {
      return input;
    }

    return input
      .replace(/[<>&"]/g, '') // Remove potentially dangerous HTML chars
      .trim()
      .substring(0, 1000); // Limit length
  }

  /**
   * Sanitize file path
   */
  static sanitizePath(path) {
    if (typeof path !== 'string') {
      return path;
    }

    return path
      .replace(/\.\./g, '') // Remove path traversal
      .replace(/[<>|:*?"]/g, '') // Remove invalid file chars
      .trim();
  }

  /**
   * Sanitize command arguments
   */
  static sanitizeArgs(args) {
    if (!Array.isArray(args)) {
      return [];
    }

    return args
      .filter(arg => typeof arg === 'string')
      .map(arg => arg.trim())
      .filter(arg => arg.length > 0)
      .slice(0, 20); // Limit number of args
  }
}

/**
 * Create a validation decorator for command functions
 */
export function withValidation(validationRules) {
  return function(target, propertyName, descriptor) {
    const method = descriptor.value;
    
    descriptor.value = async function(...args) {
      try {
        // Apply validation rules to arguments
        const validatedArgs = validationRules.map((rule, index) => {
          if (typeof rule === 'function') {
            return rule(args[index]);
          }
          return args[index];
        });

        // Call original method with validated arguments
        return await method.apply(this, validatedArgs);
      } catch (error) {
        if (error.message.includes('Validation')) {
          logger.error('Input validation failed:', error.message);
          process.exit(1);
        }
        throw error;
      }
    };

    return descriptor;
  };
}

// Export the main validator class
export default Validators;