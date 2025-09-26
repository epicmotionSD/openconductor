"use strict";
/**
 * OpenConductor Plugin Management API Routes
 *
 * REST endpoints for managing plugins - install, activate, configure
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPluginRoutes = createPluginRoutes;
const express_1 = require("express");
const error_handler_1 = require("../middleware/error-handler");
/**
 * Create plugin management routes
 */
function createPluginRoutes(conductor, logger, errorManager) {
    const router = (0, express_1.Router)();
    /**
     * GET /plugins - List all plugins
     */
    router.get('/', (0, error_handler_1.asyncHandler)(async (req, res) => {
        const { page = 1, limit = 20, sort = 'name', order = 'asc', search, filter } = req.query;
        logger.debug('Listing plugins', {
            page, limit, sort, order, search, filter,
            userId: req.user?.id
        });
        try {
            // Get all plugins from plugin manager
            const allPlugins = await conductor.plugins.getAllPlugins();
            // Apply search filter
            let plugins = allPlugins;
            if (search) {
                const searchTerm = search.toLowerCase();
                plugins = allPlugins.filter(plugin => plugin.name.toLowerCase().includes(searchTerm) ||
                    plugin.description.toLowerCase().includes(searchTerm) ||
                    plugin.author.toLowerCase().includes(searchTerm));
            }
            // Apply additional filters
            if (filter) {
                try {
                    const filterObj = JSON.parse(filter);
                    plugins = plugins.filter(plugin => {
                        return Object.entries(filterObj).every(([key, value]) => {
                            if (key === 'status')
                                return plugin.status === value;
                            if (key === 'category')
                                return plugin.category === value;
                            if (key === 'active')
                                return plugin.active === value;
                            return true;
                        });
                    });
                }
                catch (error) {
                    logger.warn('Invalid filter JSON:', filter);
                }
            }
            // Apply sorting
            plugins.sort((a, b) => {
                let aValue = a[sort];
                let bValue = b[sort];
                if (order === 'asc') {
                    return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
                }
                else {
                    return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
                }
            });
            // Apply pagination
            const pageNum = parseInt(page);
            const limitNum = parseInt(limit);
            const offset = (pageNum - 1) * limitNum;
            const paginatedPlugins = plugins.slice(offset, offset + limitNum);
            const total = plugins.length;
            const totalPages = Math.ceil(total / limitNum);
            const response = {
                success: true,
                data: paginatedPlugins,
                metadata: {
                    timestamp: new Date(),
                    version: 'v1',
                    requestId: req.requestId
                },
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    totalPages,
                    hasNext: pageNum < totalPages,
                    hasPrevious: pageNum > 1
                }
            };
            logger.info('Plugins listed successfully', {
                count: paginatedPlugins.length,
                total,
                userId: req.user?.id
            });
            res.json(response);
        }
        catch (error) {
            logger.error('Failed to list plugins:', error);
            throw error;
        }
    }));
    /**
     * GET /plugins/:id - Get specific plugin
     */
    router.get('/:id', (0, error_handler_1.asyncHandler)(async (req, res) => {
        const { id } = req.params;
        logger.debug('Getting plugin', { pluginId: id, userId: req.user?.id });
        try {
            const plugin = await conductor.plugins.getPlugin(id);
            if (!plugin) {
                throw new error_handler_1.NotFoundError('Plugin', id);
            }
            const response = {
                success: true,
                data: plugin,
                metadata: {
                    timestamp: new Date(),
                    version: 'v1',
                    requestId: req.requestId
                }
            };
            logger.info('Plugin retrieved successfully', {
                pluginId: id,
                pluginName: plugin.name,
                userId: req.user?.id
            });
            res.json(response);
        }
        catch (error) {
            logger.error('Failed to get plugin:', error);
            throw error;
        }
    }));
    /**
     * POST /plugins - Install new plugin
     */
    router.post('/', (0, error_handler_1.asyncHandler)(async (req, res) => {
        const { source } = req.body;
        logger.debug('Installing plugin', {
            source,
            userId: req.user?.id
        });
        try {
            // Install plugin from source
            const plugin = await conductor.installPlugin(source);
            const response = {
                success: true,
                data: plugin,
                metadata: {
                    timestamp: new Date(),
                    version: 'v1',
                    requestId: req.requestId
                }
            };
            logger.info('Plugin installed successfully', {
                pluginId: plugin.id,
                pluginName: plugin.name,
                version: plugin.version,
                userId: req.user?.id
            });
            res.status(201).json(response);
        }
        catch (error) {
            logger.error('Failed to install plugin:', error);
            if (error.message?.includes('already installed')) {
                throw new error_handler_1.ConflictError('Plugin is already installed');
            }
            throw new error_handler_1.PluginError(error.message, { originalError: error.message });
        }
    }));
    /**
     * PUT /plugins/:id - Update plugin
     */
    router.put('/:id', (0, error_handler_1.asyncHandler)(async (req, res) => {
        const { id } = req.params;
        const { version } = req.body;
        logger.debug('Updating plugin', { pluginId: id, version, userId: req.user?.id });
        try {
            const plugin = await conductor.plugins.getPlugin(id);
            if (!plugin) {
                throw new error_handler_1.NotFoundError('Plugin', id);
            }
            // Update plugin to specified version
            const updatedPlugin = await conductor.plugins.updatePlugin(id, version);
            const response = {
                success: true,
                data: updatedPlugin,
                metadata: {
                    timestamp: new Date(),
                    version: 'v1',
                    requestId: req.requestId
                }
            };
            logger.info('Plugin updated successfully', {
                pluginId: id,
                pluginName: updatedPlugin.name,
                oldVersion: plugin.version,
                newVersion: updatedPlugin.version,
                userId: req.user?.id
            });
            res.json(response);
        }
        catch (error) {
            logger.error('Failed to update plugin:', error);
            throw new error_handler_1.PluginError(error.message, { originalError: error.message });
        }
    }));
    /**
     * DELETE /plugins/:id - Remove plugin
     */
    router.delete('/:id', (0, error_handler_1.asyncHandler)(async (req, res) => {
        const { id } = req.params;
        logger.debug('Removing plugin', { pluginId: id, userId: req.user?.id });
        try {
            const plugin = await conductor.plugins.getPlugin(id);
            if (!plugin) {
                throw new error_handler_1.NotFoundError('Plugin', id);
            }
            // Remove plugin
            await conductor.plugins.removePlugin(id);
            const response = {
                success: true,
                metadata: {
                    timestamp: new Date(),
                    version: 'v1',
                    requestId: req.requestId
                }
            };
            logger.info('Plugin removed successfully', {
                pluginId: id,
                pluginName: plugin.name,
                userId: req.user?.id
            });
            res.json(response);
        }
        catch (error) {
            logger.error('Failed to remove plugin:', error);
            throw new error_handler_1.PluginError(error.message, { originalError: error.message });
        }
    }));
    /**
     * POST /plugins/:id/activate - Activate plugin
     */
    router.post('/:id/activate', (0, error_handler_1.asyncHandler)(async (req, res) => {
        const { id } = req.params;
        logger.debug('Activating plugin', { pluginId: id, userId: req.user?.id });
        try {
            const plugin = await conductor.plugins.getPlugin(id);
            if (!plugin) {
                throw new error_handler_1.NotFoundError('Plugin', id);
            }
            if (plugin.active) {
                throw new error_handler_1.ConflictError('Plugin is already active');
            }
            // Activate plugin
            await conductor.plugins.activatePlugin(id);
            // Get updated plugin info
            const activatedPlugin = await conductor.plugins.getPlugin(id);
            const response = {
                success: true,
                data: activatedPlugin,
                metadata: {
                    timestamp: new Date(),
                    version: 'v1',
                    requestId: req.requestId
                }
            };
            logger.info('Plugin activated successfully', {
                pluginId: id,
                pluginName: plugin.name,
                userId: req.user?.id
            });
            res.json(response);
        }
        catch (error) {
            logger.error('Failed to activate plugin:', error);
            throw new error_handler_1.PluginError(error.message, { originalError: error.message });
        }
    }));
    /**
     * POST /plugins/:id/deactivate - Deactivate plugin
     */
    router.post('/:id/deactivate', (0, error_handler_1.asyncHandler)(async (req, res) => {
        const { id } = req.params;
        logger.debug('Deactivating plugin', { pluginId: id, userId: req.user?.id });
        try {
            const plugin = await conductor.plugins.getPlugin(id);
            if (!plugin) {
                throw new error_handler_1.NotFoundError('Plugin', id);
            }
            if (!plugin.active) {
                throw new error_handler_1.ConflictError('Plugin is already inactive');
            }
            // Deactivate plugin
            await conductor.plugins.deactivatePlugin(id);
            // Get updated plugin info
            const deactivatedPlugin = await conductor.plugins.getPlugin(id);
            const response = {
                success: true,
                data: deactivatedPlugin,
                metadata: {
                    timestamp: new Date(),
                    version: 'v1',
                    requestId: req.requestId
                }
            };
            logger.info('Plugin deactivated successfully', {
                pluginId: id,
                pluginName: plugin.name,
                userId: req.user?.id
            });
            res.json(response);
        }
        catch (error) {
            logger.error('Failed to deactivate plugin:', error);
            throw new error_handler_1.PluginError(error.message, { originalError: error.message });
        }
    }));
    /**
     * GET /plugins/:id/health - Get plugin health status
     */
    router.get('/:id/health', (0, error_handler_1.asyncHandler)(async (req, res) => {
        const { id } = req.params;
        logger.debug('Getting plugin health', { pluginId: id, userId: req.user?.id });
        try {
            const plugin = await conductor.plugins.getPlugin(id);
            if (!plugin) {
                throw new error_handler_1.NotFoundError('Plugin', id);
            }
            // Get plugin health status
            const healthStatus = await conductor.plugins.getHealthStatus(id);
            const response = {
                success: true,
                data: healthStatus,
                metadata: {
                    timestamp: new Date(),
                    version: 'v1',
                    requestId: req.requestId
                }
            };
            logger.info('Plugin health checked successfully', {
                pluginId: id,
                pluginName: plugin.name,
                status: healthStatus.status,
                userId: req.user?.id
            });
            res.json(response);
        }
        catch (error) {
            logger.error('Failed to get plugin health:', error);
            throw error;
        }
    }));
    /**
     * GET /plugins/:id/config - Get plugin configuration
     */
    router.get('/:id/config', (0, error_handler_1.asyncHandler)(async (req, res) => {
        const { id } = req.params;
        logger.debug('Getting plugin configuration', { pluginId: id, userId: req.user?.id });
        try {
            const plugin = await conductor.plugins.getPlugin(id);
            if (!plugin) {
                throw new error_handler_1.NotFoundError('Plugin', id);
            }
            // Get plugin configuration (sanitized)
            const config = await conductor.plugins.getPluginConfig(id);
            const response = {
                success: true,
                data: config,
                metadata: {
                    timestamp: new Date(),
                    version: 'v1',
                    requestId: req.requestId
                }
            };
            logger.info('Plugin configuration retrieved successfully', {
                pluginId: id,
                pluginName: plugin.name,
                userId: req.user?.id
            });
            res.json(response);
        }
        catch (error) {
            logger.error('Failed to get plugin configuration:', error);
            throw error;
        }
    }));
    /**
     * PUT /plugins/:id/config - Update plugin configuration
     */
    router.put('/:id/config', (0, error_handler_1.asyncHandler)(async (req, res) => {
        const { id } = req.params;
        const configUpdates = req.body;
        logger.debug('Updating plugin configuration', {
            pluginId: id,
            configUpdates,
            userId: req.user?.id
        });
        try {
            const plugin = await conductor.plugins.getPlugin(id);
            if (!plugin) {
                throw new error_handler_1.NotFoundError('Plugin', id);
            }
            // Update plugin configuration
            const updatedConfig = await conductor.plugins.updatePluginConfig(id, configUpdates);
            const response = {
                success: true,
                data: updatedConfig,
                metadata: {
                    timestamp: new Date(),
                    version: 'v1',
                    requestId: req.requestId
                }
            };
            logger.info('Plugin configuration updated successfully', {
                pluginId: id,
                pluginName: plugin.name,
                userId: req.user?.id
            });
            res.json(response);
        }
        catch (error) {
            logger.error('Failed to update plugin configuration:', error);
            throw new error_handler_1.PluginError(error.message, { originalError: error.message });
        }
    }));
    /**
     * GET /plugins/registry/search - Search plugin registry
     */
    router.get('/registry/search', (0, error_handler_1.asyncHandler)(async (req, res) => {
        const { q, type, tags, limit = 20 } = req.query;
        logger.debug('Searching plugin registry', { q, type, tags, limit, userId: req.user?.id });
        try {
            // Search plugin registry
            const searchQuery = {
                q: q,
                type: type,
                tags: tags ? tags.split(',') : undefined,
                limit: parseInt(limit)
            };
            const results = await conductor.plugins.searchRegistry(searchQuery);
            const response = {
                success: true,
                data: results,
                metadata: {
                    timestamp: new Date(),
                    version: 'v1',
                    requestId: req.requestId
                }
            };
            logger.info('Plugin registry search completed successfully', {
                query: q,
                resultsCount: results.length,
                userId: req.user?.id
            });
            res.json(response);
        }
        catch (error) {
            logger.error('Failed to search plugin registry:', error);
            throw error;
        }
    }));
    /**
     * GET /plugins/stats - Get plugin statistics
     */
    router.get('/stats', (0, error_handler_1.asyncHandler)(async (req, res) => {
        logger.debug('Getting plugin statistics', { userId: req.user?.id });
        try {
            const allPlugins = await conductor.plugins.getAllPlugins();
            const stats = {
                total: allPlugins.length,
                active: allPlugins.filter(p => p.active).length,
                inactive: allPlugins.filter(p => !p.active).length,
                byCategory: getPluginsByCategory(allPlugins),
                byStatus: getPluginsByStatus(allPlugins),
                totalDownloads: allPlugins.reduce((sum, p) => sum + (p.downloads || 0), 0),
                averageRating: calculateAverageRating(allPlugins),
                recentlyInstalled: allPlugins
                    .filter(p => p.installedAt && p.installedAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
                    .length,
                memoryUsage: calculateTotalMemoryUsage(allPlugins)
            };
            const response = {
                success: true,
                data: stats,
                metadata: {
                    timestamp: new Date(),
                    version: 'v1',
                    requestId: req.requestId
                }
            };
            logger.info('Plugin statistics retrieved successfully', {
                totalPlugins: stats.total,
                activePlugins: stats.active,
                userId: req.user?.id
            });
            res.json(response);
        }
        catch (error) {
            logger.error('Failed to get plugin statistics:', error);
            throw error;
        }
    }));
    return router;
}
/**
 * Group plugins by category
 */
function getPluginsByCategory(plugins) {
    const result = {};
    plugins.forEach(plugin => {
        const category = plugin.category || 'uncategorized';
        result[category] = (result[category] || 0) + 1;
    });
    return result;
}
/**
 * Group plugins by status
 */
function getPluginsByStatus(plugins) {
    const result = {};
    plugins.forEach(plugin => {
        const status = plugin.status || 'unknown';
        result[status] = (result[status] || 0) + 1;
    });
    return result;
}
/**
 * Calculate average rating
 */
function calculateAverageRating(plugins) {
    const ratingsSum = plugins.reduce((sum, p) => sum + (p.rating || 0), 0);
    const ratingsCount = plugins.filter(p => p.rating).length;
    return ratingsCount > 0 ? ratingsSum / ratingsCount : 0;
}
/**
 * Calculate total memory usage
 */
function calculateTotalMemoryUsage(plugins) {
    return plugins.reduce((sum, p) => sum + (p.memoryUsage || 0), 0);
}
//# sourceMappingURL=plugins.js.map