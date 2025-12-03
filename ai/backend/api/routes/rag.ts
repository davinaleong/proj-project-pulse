/**
 * RAG API Routes
 * Handles Retrieval Augmented Generation (RAG) operations
 */

import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { aiServiceOrchestrator } from '../../orchestrator/aiOrchestrator';
import { APIResponse, RAGRequest, RAGResponse } from '../types/api';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// Validation rules
const ragValidation = [
  body('question')
    .isString()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Question must be a string between 1 and 1000 characters'),
  
  body('context')
    .optional()
    .isString()
    .isLength({ max: 2000 })
    .withMessage('Context must be a string with max 2000 characters'),
  
  body('maxSearchResults')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Max search results must be between 1 and 20'),
  
  body('temperature')
    .optional()
    .isFloat({ min: 0, max: 2 })
    .withMessage('Temperature must be between 0 and 2'),
  
  body('maxTokens')
    .optional()
    .isInt({ min: 100, max: 4000 })
    .withMessage('Max tokens must be between 100 and 4000'),
  
  body('includeReferences')
    .optional()
    .isBoolean()
    .withMessage('Include references must be a boolean'),
  
  body('searchType')
    .optional()
    .isIn(['semantic', 'vector', 'hybrid'])
    .withMessage('Search type must be semantic, vector, or hybrid'),

  body('chatHistory')
    .optional()
    .isArray()
    .withMessage('Chat history must be an array'),

  body('chatHistory.*.role')
    .optional()
    .isIn(['system', 'user', 'assistant'])
    .withMessage('Each message role must be system, user, or assistant'),

  body('chatHistory.*.content')
    .optional()
    .isString()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Each message content must be a string between 1 and 2000 characters')
];

const conversationalValidation = [
  body('question')
    .isString()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Question must be a string between 1 and 1000 characters'),
  
  body('chatHistory')
    .isArray()
    .withMessage('Chat history must be an array'),

  body('chatHistory.*.role')
    .isIn(['system', 'user', 'assistant'])
    .withMessage('Each message role must be system, user, or assistant'),

  body('chatHistory.*.content')
    .isString()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Each message content must be a string between 1 and 2000 characters'),

  body('options')
    .optional()
    .isObject()
    .withMessage('Options must be an object')
];

/**
 * POST /api/v1/rag/ask
 * Standard RAG question answering
 */
router.post('/ask', ragValidation, asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    } as APIResponse<null>);
  }

  const {
    question,
    context,
    maxSearchResults = 5,
    temperature = 0.7,
    maxTokens = 1000,
    includeReferences = true,
    searchType = 'semantic',
    chatHistory = []
  } = req.body as RAGRequest;

  let response;

  if (chatHistory && chatHistory.length > 0) {
    // Use conversational RAG
    response = await aiServiceOrchestrator.askConversationalQuestion(
      question,
      chatHistory,
      {
        // @ts-ignore
        maxSearchResults,
        temperature,
        maxTokens,
        includeReferences,
        searchType
      }
    );
  } else {
    // Use standard RAG
    response = await aiServiceOrchestrator.askQuestion({
      question,
      context,
      maxSearchResults,
      temperature,
      maxTokens,
      includeReferences,
      searchType
    });
  }

  if (!response.success) {
    // @ts-ignore
    return res.status(500).json({
      success: false,
      error: 'RAG operation failed',
      message: response.error,
      requestId: response.metadata.requestId
    } as APIResponse<null>);
  }

  const ragResponse: RAGResponse = {
    answer: response.data?.answer || '',
    sources: response.data?.sources || [],
    confidence: (response.data?.metadata as any)?.confidence || 0,
    searchResultsUsed: response.data?.metadata?.searchResultsCount || 0,
    tokensUsed: response.data?.metadata?.tokensUsed,
    searchResults: includeReferences ? response.data?.searchResults : undefined
  };

  res.json({
    success: true,
    data: ragResponse,
    metadata: {
      processingTime: response.metadata.processingTime,
      searchTime: response.data?.metadata?.searchTime,
      generationTime: response.data?.metadata?.generationTime,
      timestamp: new Date().toISOString(),
      requestId: response.metadata.requestId
    }
  } as APIResponse<RAGResponse>);
}));

/**
 * POST /api/v1/rag/conversational
 * Conversational RAG with chat history
 */
router.post('/conversational', conversationalValidation, asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    } as APIResponse<null>);
  }

  const { question, chatHistory, options = {} } = req.body;

  const response = await aiServiceOrchestrator.askConversationalQuestion(
    question,
    chatHistory,
    options
  );

  if (!response.success) {
    // @ts-ignore
    return res.status(500).json({
      success: false,
      error: 'Conversational RAG failed',
      message: response.error,
      requestId: response.metadata.requestId
    } as APIResponse<null>);
  }

  const ragResponse: RAGResponse = {
    answer: response.data?.answer || '',
    sources: response.data?.sources || [],
    confidence: (response.data?.metadata as any)?.confidence || 0,
    searchResultsUsed: response.data?.metadata?.searchResultsCount || 0,
    tokensUsed: response.data?.metadata?.tokensUsed,
    conversational: true
  };

  res.json({
    success: true,
    data: ragResponse,
    metadata: {
      processingTime: response.metadata.processingTime,
      searchTime: response.data?.metadata?.searchTime,
      generationTime: response.data?.metadata?.generationTime,
      timestamp: new Date().toISOString(),
      requestId: response.metadata.requestId
    }
  } as APIResponse<RAGResponse>);
}));

/**
 * POST /api/v1/rag/batch
 * Batch RAG processing for multiple questions
 */
router.post('/batch', [
  body('questions')
    .isArray({ min: 1, max: 10 })
    .withMessage('Questions must be an array with 1-10 items'),
  
  body('questions.*')
    .isString()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Each question must be a string between 1 and 1000 characters'),

  body('options')
    .optional()
    .isObject()
    .withMessage('Options must be an object')
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    } as APIResponse<null>);
  }

  const { questions, options = {} } = req.body;
  
  const batchResults = await Promise.allSettled(
    questions.map((question: string) =>
      aiServiceOrchestrator.askQuestion({
        question,
        maxSearchResults: options.maxSearchResults || 5,
        temperature: options.temperature || 0.7,
        maxTokens: options.maxTokens || 1000,
        includeReferences: options.includeReferences || false,
        searchType: options.searchType || 'semantic'
      })
    )
  );

  const results = batchResults.map((result, index) => {
    if (result.status === 'fulfilled' && result.value.success) {
      return {
        question: questions[index],
        success: true,
        answer: result.value.data?.answer || '',
        sources: result.value.data?.sources || [],
        metadata: result.value.metadata
      };
    } else {
      return {
        question: questions[index],
        success: false,
        error: result.status === 'fulfilled' ? result.value.error : 'Processing failed'
      };
    }
  });

  const successCount = results.filter(r => r.success).length;
  
  res.json({
    success: true,
    data: {
      results,
      summary: {
        total: questions.length,
        successful: successCount,
        failed: questions.length - successCount
      }
    },
    metadata: {
      timestamp: new Date().toISOString(),
      batchSize: questions.length
    }
  } as APIResponse<any>);
}));

export { router as ragRouter };