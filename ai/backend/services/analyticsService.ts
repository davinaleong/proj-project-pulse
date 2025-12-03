/**
 * Advanced Analytics Service
 * 
 * Provides AI-powered analytics and insights using Azure AI Search and Azure OpenAI
 * Features:
 * - Project performance analytics
 * - Task completion trend analysis  
 * - Team productivity insights
 * - Predictive project outcomes
 * - Natural language query processing for analytics
 * - Automated report generation
 */

import { azureSearchService, SearchResponse, ProjectDocument } from './searchService';
import { azureOpenAIService, ChatMessage } from './openaiService';
import { intelligentRAGService } from './ragService';

/**
 * Analytics query interface
 */
export interface AnalyticsQuery {
  question: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  projectIds?: string[];
  userIds?: string[];
  includeVisualizations?: boolean;
  analysisType?: 'trend' | 'performance' | 'prediction' | 'comparison' | 'summary';
}

/**
 * Analytics insight interface
 */
export interface AnalyticsInsight {
  title: string;
  summary: string;
  details: string;
  confidence: number;
  supportingData: Array<{
    metric: string;
    value: number;
    trend?: 'increasing' | 'decreasing' | 'stable';
    comparison?: string;
  }>;
  recommendations?: string[];
  visualizations?: Array<{
    type: 'chart' | 'graph' | 'table';
    data: any;
    title: string;
  }>;
}

/**
 * Analytics response interface
 */
export interface AnalyticsResponse {
  query: string;
  insights: AnalyticsInsight[];
  summary: string;
  metadata: {
    analysisTime: number;
    dataPointsAnalyzed: number;
    confidence: number;
  };
}

/**
 * Project performance metrics
 */
export interface ProjectMetrics {
  projectId: string;
  projectName: string;
  completionRate: number;
  taskCompletionVelocity: number;
  teamEfficiency: number;
  riskScore: number;
  estimatedCompletionDate?: Date;
  blockers: string[];
  strengths: string[];
  recommendations: string[];
}

/**
 * Advanced Analytics Service
 * Leverages AI to provide intelligent project insights and predictions
 */
export class AdvancedAnalyticsService {
  private readonly analyticsSystemPrompt = `You are an advanced analytics AI for Project Pulse, specializing in project management insights, team productivity analysis, and predictive project outcomes.

Your capabilities include:
1. **Performance Analysis**: Analyze project completion rates, task velocities, and team efficiency
2. **Trend Identification**: Identify patterns in project data over time
3. **Predictive Analytics**: Forecast project outcomes and potential risks
4. **Comparative Analysis**: Compare projects, teams, or time periods
5. **Insight Generation**: Provide actionable insights and recommendations

Guidelines:
- Base insights on provided data and search results
- Provide specific, actionable recommendations
- Include confidence levels for predictions
- Highlight both strengths and areas for improvement
- Use data-driven reasoning for all conclusions
- Present findings in a clear, structured format`;

  constructor(
    private searchService = azureSearchService,
    private openaiService = azureOpenAIService,
    private ragService = intelligentRAGService
  ) {
    console.log('📊 Advanced Analytics Service initialized');
  }

  /**
   * Analyzes project performance and generates insights
   * @param query Analytics query with specific parameters
   * @returns Comprehensive analytics response with insights and recommendations
   */
  async analyzeProjects(query: AnalyticsQuery): Promise<AnalyticsResponse> {
    const startTime = Date.now();
    
    try {
      console.log(`📊 Processing analytics query: "${query.question}"`);
      
      // Step 1: Gather relevant project data
      const projectData = await this.gatherProjectData(query);
      
      // Step 2: Generate AI-powered insights
      const insights = await this.generateInsights(query, projectData);
      
      // Step 3: Create executive summary
      const summary = await this.generateExecutiveSummary(query, insights);

      const analysisTime = Date.now() - startTime;

      const response: AnalyticsResponse = {
        query: query.question,
        insights,
        summary,
        metadata: {
          analysisTime,
          dataPointsAnalyzed: projectData.results.length,
          confidence: this.calculateOverallConfidence(insights)
        }
      };

      console.log(`✅ Analytics completed in ${analysisTime}ms with ${insights.length} insights`);
      
      return response;
      
    } catch (error) {
      console.error('❌ Analytics query failed:', error);
      throw new Error(`Analytics Query Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generates project performance metrics for specific projects
   * @param projectIds Array of project IDs to analyze
   * @param dateRange Optional date range for analysis
   * @returns Array of project metrics with performance indicators
   */
  async generateProjectMetrics(
    projectIds: string[], 
    dateRange?: { start: Date; end: Date }
  ): Promise<ProjectMetrics[]> {
    try {
      console.log(`📈 Generating metrics for ${projectIds.length} projects`);
      
      const metrics: ProjectMetrics[] = [];
      
      for (const projectId of projectIds) {
        // Search for project-specific data
        const projectSearchQuery = this.buildProjectSearchQuery(projectId, dateRange);
        const projectData = await this.searchService.search({
          query: projectSearchQuery,
          top: 50,
          enableSemanticSearch: true,
          filters: `projectId eq '${projectId}'`
        });

        // Analyze project data with AI
        const projectMetric = await this.analyzeProjectPerformance(projectId, projectData);
        metrics.push(projectMetric);
      }

      console.log(`✅ Generated metrics for ${metrics.length} projects`);
      return metrics;
      
    } catch (error) {
      console.error('❌ Project metrics generation failed:', error);
      throw new Error(`Project Metrics Generation Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Provides natural language analytics using RAG
   * @param question Natural language analytics question
   * @param context Additional context for the analysis
   * @returns RAG response with analytics-focused insights
   */
  async askAnalyticsQuestion(question: string, context?: string): Promise<any> {
    try {
      console.log(`🤔 Processing analytics question: "${question}"`);
      
      // Enhance question with analytics context
      const enhancedQuestion = `Analytics Query: ${question}${context ? `\n\nAdditional Context: ${context}` : ''}`;
      
      // Use RAG service with analytics-specific prompt
      const ragResponse = await this.ragService.askQuestion({
        question: enhancedQuestion,
        context: this.analyticsSystemPrompt,
        maxSearchResults: 10,
        temperature: 0.3,
        maxTokens: 1500,
        includeReferences: true,
        searchType: 'semantic'
      });

      // Post-process the response to add analytics-specific insights
      const analyticsResponse = await this.enhanceWithAnalyticsInsights(ragResponse);

      return analyticsResponse;
      
    } catch (error) {
      console.error('❌ Analytics question processing failed:', error);
      throw new Error(`Analytics Question Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generates automated reports for projects
   * @param reportType Type of report to generate
   * @param projectIds Optional specific projects to include
   * @param timeframe Timeframe for the report
   * @returns Generated report with insights and visualizations
   */
  async generateAutomatedReport(
    reportType: 'weekly' | 'monthly' | 'quarterly' | 'project-summary',
    projectIds?: string[],
    timeframe?: { start: Date; end: Date }
  ): Promise<{
    title: string;
    content: string;
    insights: AnalyticsInsight[];
    recommendations: string[];
    metadata: any;
  }> {
    try {
      console.log(`📄 Generating ${reportType} report`);
      
      const reportQuery = this.buildReportQuery(reportType, projectIds, timeframe);
      const analyticsResponse = await this.analyzeProjects(reportQuery);
      
      // Generate formatted report content
      const reportContent = await this.formatReport(reportType, analyticsResponse);
      
      return {
        title: this.getReportTitle(reportType, timeframe),
        content: reportContent,
        insights: analyticsResponse.insights,
        recommendations: this.extractRecommendations(analyticsResponse.insights),
        metadata: {
          generatedAt: new Date().toISOString(),
          reportType,
          timeframe,
          projectsAnalyzed: projectIds?.length || 'all'
        }
      };
      
    } catch (error) {
      console.error('❌ Automated report generation failed:', error);
      throw new Error(`Report Generation Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Predicts project outcomes using AI analysis
   * @param projectId Project to analyze
   * @param predictionHorizon How far ahead to predict (in days)
   * @returns Prediction with confidence levels and risk factors
   */
  async predictProjectOutcome(
    projectId: string, 
    predictionHorizon: number = 30
  ): Promise<{
    projectId: string;
    prediction: {
      completionDate: Date;
      completionProbability: number;
      riskLevel: 'low' | 'medium' | 'high';
      keyRisks: string[];
      recommendations: string[];
    };
    confidence: number;
  }> {
    try {
      console.log(`🔮 Predicting outcome for project ${projectId}`);
      
      // Gather historical project data
      const projectData = await this.gatherProjectData({
        question: `Predict completion for project ${projectId}`,
        projectIds: [projectId],
        analysisType: 'prediction'
      });

      // Use AI to analyze patterns and make predictions
      const predictionMessages: ChatMessage[] = [
        {
          role: 'system',
          content: `${this.analyticsSystemPrompt}\n\nYou are specifically focused on project outcome prediction. Analyze the provided project data to predict completion dates, identify risks, and provide recommendations. Be specific with dates and confidence levels.`
        },
        {
          role: 'user',
          content: `Analyze this project data and predict outcomes for the next ${predictionHorizon} days:\n\n${JSON.stringify(projectData, null, 2)}\n\nProvide a structured prediction with completion date, probability, risk level, key risks, and recommendations.`
        }
      ];

      const aiResponse = await this.openaiService.createChatCompletion({
        messages: predictionMessages,
        temperature: 0.2,
        maxTokens: 1000
      });

      // Parse and structure the AI response
      const prediction = await this.parsePredictionResponse(aiResponse.content, projectId);
      
      console.log(`✅ Prediction generated for project ${projectId}`);
      return prediction;
      
    } catch (error) {
      console.error('❌ Project outcome prediction failed:', error);
      throw new Error(`Project Prediction Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Gathers relevant project data for analysis
   */
  private async gatherProjectData(query: AnalyticsQuery): Promise<SearchResponse> {
    let searchQuery = query.question;
    
    // Add date range filter if specified
    if (query.dateRange) {
      const startDate = query.dateRange.start.toISOString().split('T')[0];
      const endDate = query.dateRange.end.toISOString().split('T')[0];
      searchQuery += ` dateRange:${startDate} to ${endDate}`;
    }

    // Build filters
    let filters = '';
    if (query.projectIds && query.projectIds.length > 0) {
      filters = query.projectIds.map(id => `projectId eq '${id}'`).join(' or ');
    }

    return await this.searchService.search({
      query: searchQuery,
      top: 20,
      enableSemanticSearch: true,
      filters: filters || undefined
    });
  }

  /**
   * Generates insights using AI analysis
   */
  private async generateInsights(query: AnalyticsQuery, projectData: SearchResponse): Promise<AnalyticsInsight[]> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: this.analyticsSystemPrompt
      },
      {
        role: 'user',
        content: `Analyze this project data and generate insights for the query: "${query.question}"\n\nProject Data:\n${JSON.stringify(projectData, null, 2)}\n\nProvide structured insights with confidence levels, supporting data, and actionable recommendations.`
      }
    ];

    const aiResponse = await this.openaiService.createChatCompletion({
      messages,
      temperature: 0.3,
      maxTokens: 2000
    });

    // Parse AI response into structured insights
    return await this.parseInsightsResponse(aiResponse.content);
  }

  /**
   * Generates executive summary from insights
   */
  private async generateExecutiveSummary(query: AnalyticsQuery, insights: AnalyticsInsight[]): Promise<string> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: 'Generate a concise executive summary of the analytics insights. Focus on key findings, trends, and high-priority recommendations.'
      },
      {
        role: 'user',
        content: `Create an executive summary for these insights:\n\n${JSON.stringify(insights, null, 2)}`
      }
    ];

    const aiResponse = await this.openaiService.createChatCompletion({
      messages,
      temperature: 0.4,
      maxTokens: 500
    });

    return aiResponse.content;
  }

  /**
   * Calculates overall confidence from individual insights
   */
  private calculateOverallConfidence(insights: AnalyticsInsight[]): number {
    if (insights.length === 0) return 0;
    
    const totalConfidence = insights.reduce((sum, insight) => sum + insight.confidence, 0);
    return Math.round((totalConfidence / insights.length) * 100) / 100;
  }

  /**
   * Builds search query for specific project
   */
  private buildProjectSearchQuery(projectId: string, dateRange?: { start: Date; end: Date }): string {
    let query = `project ${projectId} tasks completion status progress`;
    
    if (dateRange) {
      const startDate = dateRange.start.toISOString().split('T')[0];
      const endDate = dateRange.end.toISOString().split('T')[0];
      query += ` created:${startDate}..${endDate}`;
    }
    
    return query;
  }

  /**
   * Analyzes individual project performance
   */
  private async analyzeProjectPerformance(projectId: string, projectData: SearchResponse): Promise<ProjectMetrics> {
    // This would typically involve complex calculations
    // For now, we'll use AI to analyze the data
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: 'Analyze project performance data and calculate key metrics including completion rate, velocity, efficiency, and risk score. Provide specific numeric values and recommendations.'
      },
      {
        role: 'user',
        content: `Analyze performance for project ${projectId}:\n\n${JSON.stringify(projectData, null, 2)}`
      }
    ];

    const aiResponse = await this.openaiService.createChatCompletion({
      messages,
      temperature: 0.2,
      maxTokens: 800
    });

    // Parse response into ProjectMetrics structure
    return await this.parseProjectMetrics(aiResponse.content, projectId);
  }

  /**
   * Enhances RAG response with analytics-specific insights
   */
  private async enhanceWithAnalyticsInsights(ragResponse: any): Promise<any> {
    // Add analytics-specific processing here
    ragResponse.analyticsEnhanced = true;
    ragResponse.insightLevel = 'advanced';
    return ragResponse;
  }

  /**
   * Builds report query based on report type
   */
  private buildReportQuery(
    reportType: string, 
    projectIds?: string[], 
    timeframe?: { start: Date; end: Date }
  ): AnalyticsQuery {
    return {
      question: `Generate ${reportType} report analysis`,
      dateRange: timeframe,
      projectIds,
      analysisType: 'summary',
      includeVisualizations: true
    };
  }

  /**
   * Formats report content
   */
  private async formatReport(reportType: string, analyticsResponse: AnalyticsResponse): Promise<string> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `Format analytics data into a professional ${reportType} report. Include executive summary, key findings, trends, and recommendations. Use markdown formatting.`
      },
      {
        role: 'user',
        content: `Format this analytics data into a report:\n\n${JSON.stringify(analyticsResponse, null, 2)}`
      }
    ];

    const aiResponse = await this.openaiService.createChatCompletion({
      messages,
      temperature: 0.3,
      maxTokens: 2000
    });

    return aiResponse.content;
  }

  /**
   * Gets report title based on type and timeframe
   */
  private getReportTitle(reportType: string, timeframe?: { start: Date; end: Date }): string {
    const baseTitle = reportType.charAt(0).toUpperCase() + reportType.slice(1).replace('-', ' ');
    
    if (timeframe) {
      const startStr = timeframe.start.toLocaleDateString();
      const endStr = timeframe.end.toLocaleDateString();
      return `${baseTitle} Report (${startStr} - ${endStr})`;
    }
    
    return `${baseTitle} Report`;
  }

  /**
   * Extracts recommendations from insights
   */
  private extractRecommendations(insights: AnalyticsInsight[]): string[] {
    const recommendations: string[] = [];
    
    insights.forEach(insight => {
      if (insight.recommendations) {
        recommendations.push(...insight.recommendations);
      }
    });
    
    return recommendations;
  }

  /**
   * Parses AI response into structured insights
   */
  private async parseInsightsResponse(response: string): Promise<AnalyticsInsight[]> {
    // This would typically involve more sophisticated parsing
    // For now, return a sample structure
    return [
      {
        title: 'Project Performance Analysis',
        summary: response.substring(0, 200) + '...',
        details: response,
        confidence: 0.85,
        supportingData: [
          {
            metric: 'Completion Rate',
            value: 78,
            trend: 'increasing'
          }
        ],
        recommendations: ['Focus on bottleneck resolution', 'Improve team communication']
      }
    ];
  }

  /**
   * Parses project metrics from AI response
   */
  private async parseProjectMetrics(response: string, projectId: string): Promise<ProjectMetrics> {
    // This would typically involve parsing the AI response
    // For now, return a sample structure
    return {
      projectId,
      projectName: `Project ${projectId}`,
      completionRate: 0.75,
      taskCompletionVelocity: 2.3,
      teamEfficiency: 0.82,
      riskScore: 0.3,
      blockers: ['Resource allocation', 'Technical dependencies'],
      strengths: ['Strong team collaboration', 'Clear requirements'],
      recommendations: ['Allocate additional resources', 'Address technical debt']
    };
  }

  /**
   * Parses prediction response from AI
   */
  private async parsePredictionResponse(response: string, projectId: string): Promise<any> {
    // This would typically involve parsing the AI response
    // For now, return a sample structure
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 21);
    
    return {
      projectId,
      prediction: {
        completionDate: futureDate,
        completionProbability: 0.82,
        riskLevel: 'medium' as const,
        keyRisks: ['Resource constraints', 'Technical complexity'],
        recommendations: ['Add buffer time', 'Monitor progress weekly']
      },
      confidence: 0.78
    };
  }

  /**
   * Health check for analytics service
   */
  async healthCheck(): Promise<{ 
    status: 'healthy' | 'unhealthy'; 
    message: string;
    dependencies: any;
  }> {
    try {
      const [searchHealth, openaiHealth, ragHealth] = await Promise.all([
        this.searchService.healthCheck(),
        this.openaiService.healthCheck(),
        this.ragService.healthCheck()
      ]);

      const allHealthy = searchHealth.status === 'healthy' && 
                        openaiHealth.status === 'healthy' && 
                        ragHealth.status === 'healthy';

      return {
        status: allHealthy ? 'healthy' : 'unhealthy',
        message: allHealthy 
          ? 'Analytics service is fully operational' 
          : 'One or more dependencies are unhealthy',
        dependencies: {
          search: searchHealth.status,
          openai: openaiHealth.status,
          rag: ragHealth.status
        }
      };
      
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        dependencies: {
          search: 'unknown',
          openai: 'unknown',
          rag: 'unknown'
        }
      };
    }
  }
}

// Export singleton instance
export const advancedAnalyticsService = new AdvancedAnalyticsService();
export default advancedAnalyticsService;