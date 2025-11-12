import express from 'express';
import { APIResponse } from '@openconductor/shared';
import { registryService } from '../services/RegistryService';
import { asyncHandler } from '../middleware/errorHandler';

export const categoriesRouter = express.Router();

function createAPIResponse<T>(data: T): APIResponse<T> {
  return {
    success: true,
    data,
    meta: {
      requestId: Math.random().toString(36).substring(7),
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }
  };
}

/**
 * GET /categories
 * List all categories with server counts
 */
categoriesRouter.get('/', asyncHandler(async (req, res) => {
  const categories = await registryService.getCategories();
  
  res.json(createAPIResponse(categories));
}));