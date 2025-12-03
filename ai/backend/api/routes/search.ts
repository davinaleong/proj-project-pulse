/**
 * Search API Routes
 * Handles intelligent search operations using Azure AI Search
 */

import { Router, Request, Response, NextFunction } from 'express';
import { body, query, validationResult } from 'express-validator';
import { aiServiceOrchestrator } from '../../orchestrator/aiOrchestrator';
import { APIResponse, SearchRequest, SearchResponse, SearchResult } from '../types/api';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// Validation rules
const searchValidation = [
  body('query')
    .isString()
    .isLength({ min: 1, max: 500 })
    .withMessage('Query must be a string between 1 and 500 characters'),
  
  body('maxResults')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Max results must be between 1 and 100'),
  
  body('searchType')
    .optional()
    .isIn(['semantic', 'basic', 'hybrid'])
    .withMessage('Search type must be semantic, basic, or hybrid'),

  body('filters')
    .optional()
    .isString()
    .isLength({ max: 200 })
    .withMessage('Filters must be a string with max 200 characters')
];

const searchQueryValidation = [
  query('q')
    .isString()
    .isLength({ min: 1, max: 500 })
    .withMessage('Query parameter q must be a string between 1 and 500 characters'),
  
  query('max')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Max parameter must be between 1 and 100'),
  
  query('type')
    .optional()
    .isIn(['semantic', 'basic', 'hybrid'])
    .withMessage('Type parameter must be semantic, basic, or hybrid')
];

/**
 * POST /api/v1/search
 * Performs intelligent search with full options
 */
router.post('/', searchValidation, asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    } as APIResponse<null>);
  }

  const { query, maxResults = 10, searchType = 'semantic', filters } = req.body as SearchRequest;

  let response;
  
  switch (searchType) {
    case 'semantic':
      response = await aiServiceOrchestrator.semanticSearch(query, maxResults);
      break;
    case 'hybrid':
      response = await aiServiceOrchestrator.search({
        query,
        top: maxResults,
        ...(filters && { filters }),
        enableSemanticSearch: true
      });
      break;
    case 'basic':
    default:
      response = await aiServiceOrchestrator.search({
        query,
        top: maxResults,
        ...(filters && { filters })
      });
      break;
  }

  if (!response.success) {
    return res.status(500).json({
      success: false,
      error: 'Search operation failed',
      message: response.error,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: response.metadata.requestId
      }
    } as APIResponse<null>);
  }

  // Map Azure search results to our API format (based on actual schema)
  const mappedResults: SearchResult[] = (response.data?.results || []).map((result: any) => ({
    id: result.document?.id || result.id || Math.random().toString(36),
    title: result.document?.title || result.title || 'Untitled',
    content: result.document?.content || result.content || '',
    score: result.score || result['@search.score'] || 0
  }));

  const searchResponse: SearchResponse = {
    results: mappedResults,
    totalCount: mappedResults.length,
    facets: response.data?.facets || {},
    searchId: response.metadata.requestId
  };

  return res.json({
    success: true,
    data: searchResponse,
    metadata: {
      processingTime: response.metadata.processingTime,
      timestamp: new Date().toISOString(),
      requestId: response.metadata.requestId
    }
  } as APIResponse<SearchResponse>);
}));

/**
 * GET /api/v1/search
 * Simple search via query parameters
 */
router.get('/', searchQueryValidation, asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    } as APIResponse<null>);
  }

  const query = req.query.q as string;
  const maxResults = parseInt(req.query.max as string || '10');
  const searchType = (req.query.type as string || 'semantic') as 'semantic' | 'basic' | 'hybrid';

  // Delegate to POST handler
  req.body = { query, maxResults, searchType };
  
  // Remove query params to avoid validation conflicts
  req.query = {};
  
  // Call the POST handler by recreating the request
  try {
    // Find the POST route handler
    const postRoute = (router as any).stack.find((layer: any) => 
      layer.route && layer.route.path === '/' && layer.route.methods.post
    );
    
    if (postRoute && postRoute.route.stack[1]) {
      return postRoute.route.stack[1].handle(req, res, () => {});
    }
  } catch (error) {
    // Fallback to direct handling
  }
  
  return res.status(500).json({
    success: false,
    error: 'Internal routing error',
    metadata: {
      timestamp: new Date().toISOString(),
      requestId: (req as any).context?.requestId
    }
  } as APIResponse<null>);
}));

/**
 * POST /api/v1/search/semantic
 * Dedicated semantic search endpoint
 */
router.post('/semantic', [
  body('query').isString().isLength({ min: 1, max: 500 }),
  body('maxResults').optional().isInt({ min: 1, max: 100 })
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    } as APIResponse<null>);
  }

  const { query, maxResults = 5 } = req.body;

  const response = await aiServiceOrchestrator.semanticSearch(query, maxResults);

  if (!response.success) {
    return res.status(500).json({
      success: false,
      error: 'Semantic search failed',
      message: response.error,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: response.metadata?.requestId
      }
    } as APIResponse<null>);
  }

  // Map Azure search results to our API format (based on actual schema)
  const mappedResults: SearchResult[] = (response.data?.results || []).map((result: any) => ({
    id: result.document?.id || result.id || Math.random().toString(36),
    title: result.document?.title || result.title || 'Untitled',
    content: result.document?.content || result.content || '',
    score: result.score || result['@search.score'] || 0
  }));

  return res.json({
    success: true,
    data: {
      results: mappedResults,
      totalCount: mappedResults.length,
      searchId: response.metadata.requestId
    },
    metadata: {
      processingTime: response.metadata.processingTime,
      timestamp: new Date().toISOString(),
      requestId: response.metadata.requestId
    }
  } as APIResponse<SearchResponse>);
}));

/**
 * GET /api/v1/search/suggestions
 * Search suggestions endpoint
 */
router.get('/suggestions', [
  query('q').optional().isString().isLength({ max: 100 })
], asyncHandler(async (req: Request, res: Response) => {
  const query = req.query.q as string || '';
  
  // For now, return static suggestions
  // In production, this would use Azure Search's suggest/autocomplete API
  const suggestions = [
    'project management best practices',
    'team productivity metrics',
    'task completion tracking',
    'project risk assessment',
    'collaboration tools comparison'
  ].filter(suggestion => 
    !query || suggestion.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5);

  res.json({
    success: true,
    data: {
      suggestions,
      query
    },
    metadata: {
      timestamp: new Date().toISOString()
    }
  } as APIResponse<{ suggestions: string[]; query: string }>);
}));

export { router as searchRouter };