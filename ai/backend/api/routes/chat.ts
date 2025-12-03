/**
 * Chat API Routes
 * Handles chat completions using Azure OpenAI
 */

import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { aiServiceOrchestrator } from '../../orchestrator/aiOrchestrator';
import { APIResponse, ChatRequest, ChatResponse } from '../types/api';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// Validation rules
const chatValidation = [
  body('messages')
    .isArray({ min: 1, max: 50 })
    .withMessage('Messages must be an array with 1-50 items'),
  
  body('messages.*.role')
    .isIn(['system', 'user', 'assistant'])
    .withMessage('Each message role must be system, user, or assistant'),
  
  body('messages.*.content')
    .isString()
    .isLength({ min: 1, max: 4000 })
    .withMessage('Each message content must be a string between 1 and 4000 characters'),
  
  body('temperature')
    .optional()
    .isFloat({ min: 0, max: 2 })
    .withMessage('Temperature must be between 0 and 2'),
  
  body('maxTokens')
    .optional()
    .isInt({ min: 1, max: 4000 })
    .withMessage('Max tokens must be between 1 and 4000'),
  
  body('stream')
    .optional()
    .isBoolean()
    .withMessage('Stream must be a boolean'),

  body('model')
    .optional()
    .isString()
    .isLength({ min: 1, max: 50 })
    .withMessage('Model must be a string between 1 and 50 characters')
];

const completionValidation = [
  body('prompt')
    .isString()
    .isLength({ min: 1, max: 4000 })
    .withMessage('Prompt must be a string between 1 and 4000 characters'),
  
  body('temperature')
    .optional()
    .isFloat({ min: 0, max: 2 })
    .withMessage('Temperature must be between 0 and 2'),
  
  body('maxTokens')
    .optional()
    .isInt({ min: 1, max: 4000 })
    .withMessage('Max tokens must be between 1 and 4000')
];

/**
 * POST /api/v1/chat/completions
 * Chat completions endpoint
 */
router.post('/completions', chatValidation, asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    } as APIResponse<null>);
  }

  const {
    messages,
    temperature = 0.7,
    maxTokens = 1000,
    stream = false,
    model
  } = req.body as ChatRequest;

  const response = await aiServiceOrchestrator.createChatCompletion(
    messages,
    {
      temperature,
      maxTokens,
      stream,
      model
    }
  );

  if (!response.success) {
    return res.status(500).json({
      success: false,
      error: 'Chat completion failed',
      message: response.error,
      requestId: response.metadata.requestId
    } as APIResponse<null>);
  }

  const chatResponse: ChatResponse = {
    message: {
      role: 'assistant',
      content: response.data?.content || ''
    },
    usage: response.data?.usage,
    model: response.data?.model,
    finishReason: response.data?.finishReason
  };

  res.json({
    success: true,
    data: chatResponse,
    metadata: {
      processingTime: response.metadata.processingTime,
      timestamp: new Date().toISOString(),
      requestId: response.metadata.requestId
    }
  } as APIResponse<ChatResponse>);
}));

/**
 * POST /api/v1/chat/simple
 * Simple chat completion with just a prompt
 */
router.post('/simple', completionValidation, asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    } as APIResponse<null>);
  }

  const { prompt, temperature = 0.7, maxTokens = 1000 } = req.body;

  const messages = [
    {
      role: 'user' as const,
      content: prompt
    }
  ];

  const response = await aiServiceOrchestrator.createChatCompletion(
    messages,
    {
      temperature,
      maxTokens
    }
  );

  if (!response.success) {
    return res.status(500).json({
      success: false,
      error: 'Simple chat completion failed',
      message: response.error,
      requestId: response.metadata.requestId
    } as APIResponse<null>);
  }

  res.json({
    success: true,
    data: {
      response: response.data?.content || '',
      usage: response.data?.usage,
      model: response.data?.model
    },
    metadata: {
      processingTime: response.metadata.processingTime,
      timestamp: new Date().toISOString(),
      requestId: response.metadata.requestId
    }
  } as APIResponse<any>);
}));

/**
 * POST /api/v1/chat/stream
 * Streaming chat completions
 */
router.post('/stream', chatValidation, asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    } as APIResponse<null>);
  }

  const {
    messages,
    temperature = 0.7,
    maxTokens = 1000,
    model
  } = req.body as ChatRequest;

  // Set headers for streaming
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const response = await aiServiceOrchestrator.createChatCompletion(
      messages,
      {
        temperature,
        maxTokens,
        stream: true,
        model
      }
    );

    if (!response.success) {
      res.write(`data: ${JSON.stringify({
        error: response.error,
        requestId: response.metadata.requestId
      })}\n\n`);
      res.end();
      return;
    }

    // In a real streaming implementation, this would stream tokens
    // For now, we'll simulate streaming by sending the complete response
    const chunks = (response.data?.content || '').split(' ');
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = {
        delta: {
          content: i === 0 ? chunks[i] : ` ${chunks[i]}`
        },
        index: 0,
        finish_reason: i === chunks.length - 1 ? 'stop' : null
      };

      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      
      // Simulate streaming delay
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    res.write('data: [DONE]\n\n');
    res.end();

  } catch (error) {
    res.write(`data: ${JSON.stringify({
      error: error instanceof Error ? error.message : 'Stream failed'
    })}\n\n`);
    res.end();
  }
}));

/**
 * POST /api/v1/chat/analyze
 * Analyze chat conversation for insights
 */
router.post('/analyze', [
  body('messages')
    .isArray({ min: 2, max: 50 })
    .withMessage('Messages must be an array with 2-50 items for analysis'),
  
  body('messages.*.role')
    .isIn(['system', 'user', 'assistant'])
    .withMessage('Each message role must be system, user, or assistant'),
  
  body('messages.*.content')
    .isString()
    .isLength({ min: 1, max: 4000 })
    .withMessage('Each message content must be a string between 1 and 4000 characters'),

  body('analysisType')
    .optional()
    .isIn(['sentiment', 'topics', 'summary', 'all'])
    .withMessage('Analysis type must be sentiment, topics, summary, or all')
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    } as APIResponse<null>);
  }

  const { messages, analysisType = 'summary' } = req.body;

  // Create analysis prompt
  const analysisPrompt = `Analyze the following conversation and provide insights about ${analysisType}:\n\n${
    messages.map((msg: any) => `${msg.role}: ${msg.content}`).join('\n')
  }\n\nProvide a structured analysis.`;

  const analysisMessages = [
    {
      role: 'system' as const,
      content: 'You are an expert conversation analyst. Provide clear, structured insights about conversations.'
    },
    {
      role: 'user' as const,
      content: analysisPrompt
    }
  ];

  const response = await aiServiceOrchestrator.createChatCompletion(
    analysisMessages,
    {
      temperature: 0.3,
      maxTokens: 1000
    }
  );

  if (!response.success) {
    return res.status(500).json({
      success: false,
      error: 'Chat analysis failed',
      message: response.error,
      requestId: response.metadata.requestId
    } as APIResponse<null>);
  }

  res.json({
    success: true,
    data: {
      analysis: response.data?.content || '',
      analysisType,
      messageCount: messages.length,
      usage: response.data?.usage
    },
    metadata: {
      processingTime: response.metadata.processingTime,
      timestamp: new Date().toISOString(),
      requestId: response.metadata.requestId
    }
  } as APIResponse<any>);
}));

export { router as chatRouter };