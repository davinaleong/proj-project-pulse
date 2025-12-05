/**
 * Azure AI Search Index and Data Management Service
 * 
 * This service programmatically creates and manages Azure AI Search indexes,
 * indexers, and data sources for the Project Pulse dataset.
 */

import { 
  SearchIndexClient,
  SearchClient,
  AzureKeyCredential,
  SearchIndex,
  SearchField,
  SearchFieldDataType,
  SimpleField,
  ComplexField,
  SearchIndexer,
  SearchIndexerDataSourceConnection,
  KnownAnalyzerNames,
  KnownSearchFieldDataType
} from '@azure/search-documents';

import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import { azureConfig } from '../config/environment';

export interface ProjectPulseDocument {
  // Core project identification
  id: string;
  project_id: string;
  project_name: string;
  uuid: string;
  
  // Project metadata
  stage: string;
  started_at: string;
  ended_at: string;
  duration_h: number;
  cost: number;
  remarks: string;
  
  // Technology stack
  tech_stack: string;
  frontend: string;
  backend: string;
  database: string;
  auth: string;
  cloud: string;
  tools: string;
  framework_versions: string;
  
  // Project details
  description: string;
  completed: boolean;
  notes: string;
  features: string;
  project_type: string;
  deployment_type: string;
  
  // Dependencies and tools
  dependencies_prod: string;
  dependencies_dev: string;
  testing_framework: string;
  bundler: string;
  styling_framework: string;
  content_management: string;
  
  // Technical characteristics
  performance_features: string;
  security_features: string;
  accessibility_features: string;
  development_experience: string;
  api_type: string;
  data_persistence: string;
  scaling_approach: string;
  
  // Project context
  target_audience: string;
  business_domain: string;
  technical_complexity: string;
  maintenance_status: string;
  documentation_quality: string;
  code_quality_tools: string;
  deployment_platforms: string;
  
  // Categorization and tagging
  keywords: string;
  primary_category: string;
  secondary_categories: string;
  technology_tags: string;
  skill_level_tags: string;
  use_case_tags: string;
  domain_tags: string;
  architecture_patterns: string;
  development_methodologies: string;
  
  // Vector embedding for semantic search
  embeddings?: number[];
  
  // Azure Search metadata
  '@search.score'?: number;
  '@search.reranker_score'?: number;
}

/**
 * Service for managing Azure AI Search indexes and data
 */
export class SearchIndexManager {
  private indexClient: SearchIndexClient;
  private searchClient: SearchClient<ProjectPulseDocument>;
  private blobServiceClient?: BlobServiceClient;
  
  constructor() {
    const credential = new AzureKeyCredential(azureConfig.search.apiKey);
    
    this.indexClient = new SearchIndexClient(
      azureConfig.search.endpoint,
      credential
    );
    
    this.searchClient = new SearchClient(
      azureConfig.search.endpoint,
      azureConfig.search.indexName,
      credential
    );
    
    // Initialize blob service client if storage connection string is available
    if (process.env.AZURE_STORAGE_CONNECTION_STRING) {
      this.blobServiceClient = BlobServiceClient.fromConnectionString(
        process.env.AZURE_STORAGE_CONNECTION_STRING
      );
    }
  }
  
  /**
   * Creates the search index schema for Project Pulse data
   */
  async createSearchIndex(): Promise<void> {
    console.log('Creating Project Pulse search index...');
    
    const fields: SearchField[] = [
      // Primary key and identifiers
      {
        name: "id",
        type: "Edm.String" as SearchFieldDataType,
        key: true,
        searchable: true,
        filterable: true,
        sortable: true,
        facetable: false
      },
      {
        name: "project_id",
        type: "Edm.String" as SearchFieldDataType,
        searchable: false,
        filterable: true,
        sortable: true,
        facetable: true
      },
      {
        name: "project_name",
        type: "Edm.String" as SearchFieldDataType,
        searchable: true,
        filterable: true,
        sortable: true,
        facetable: false,
        analyzerName: KnownAnalyzerNames.EnLucene
      },
      {
        name: "uuid",
        type: "Edm.String" as SearchFieldDataType,
        searchable: false,
        filterable: true,
        sortable: false,
        facetable: false
      },
      
      // Project metadata
      {
        name: "stage",
        type: "Edm.String" as SearchFieldDataType,
        searchable: true,
        filterable: true,
        sortable: false,
        facetable: true
      },
      {
        name: "started_at",
        type: "Edm.DateTimeOffset" as SearchFieldDataType,
        searchable: false,
        filterable: true,
        sortable: true,
        facetable: false
      },
      {
        name: "ended_at",
        type: "Edm.DateTimeOffset" as SearchFieldDataType,
        searchable: false,
        filterable: true,
        sortable: true,
        facetable: false
      },
      {
        name: "duration_h",
        type: "Edm.Double" as SearchFieldDataType,
        searchable: false,
        filterable: true,
        sortable: true,
        facetable: true
      },
      {
        name: "cost",
        type: "Edm.Double" as SearchFieldDataType,
        searchable: false,
        filterable: true,
        sortable: true,
        facetable: true
      },
      {
        name: "remarks",
        type: "Edm.String" as SearchFieldDataType,
        searchable: true,
        filterable: false,
        sortable: false,
        facetable: false,
        analyzerName: KnownAnalyzerNames.EnLucene
      },
      
      // Technology stack fields
      {
        name: "tech_stack",
        type: "Edm.String" as SearchFieldDataType,
        searchable: true,
        filterable: true,
        sortable: false,
        facetable: true,
        analyzerName: KnownAnalyzerNames.EnLucene
      },
      {
        name: "frontend",
        type: "Edm.String" as SearchFieldDataType,
        searchable: true,
        filterable: true,
        sortable: false,
        facetable: true
      },
      {
        name: "backend",
        type: "Edm.String" as SearchFieldDataType,
        searchable: true,
        filterable: true,
        sortable: false,
        facetable: true
      },
      {
        name: "database",
        type: "Edm.String" as SearchFieldDataType,
        searchable: true,
        filterable: true,
        sortable: false,
        facetable: true
      },
      {
        name: "cloud",
        type: "Edm.String" as SearchFieldDataType,
        searchable: true,
        filterable: true,
        sortable: false,
        facetable: true
      },
      
      // Project description and content
      {
        name: "description",
        type: "Edm.String" as SearchFieldDataType,
        searchable: true,
        filterable: false,
        sortable: false,
        facetable: false,
        analyzerName: KnownAnalyzerNames.EnLucene
      },
      {
        name: "features",
        type: "Edm.String" as SearchFieldDataType,
        searchable: true,
        filterable: false,
        sortable: false,
        facetable: false,
        analyzerName: KnownAnalyzerNames.EnLucene
      },
      {
        name: "notes",
        type: "Edm.String" as SearchFieldDataType,
        searchable: true,
        filterable: false,
        sortable: false,
        facetable: false,
        analyzerName: KnownAnalyzerNames.EnLucene
      },
      
      // Categorical fields
      {
        name: "project_type",
        type: "Edm.String" as SearchFieldDataType,
        searchable: true,
        filterable: true,
        sortable: false,
        facetable: true
      },
      {
        name: "deployment_type",
        type: "Edm.String" as SearchFieldDataType,
        searchable: true,
        filterable: true,
        sortable: false,
        facetable: true
      },
      {
        name: "business_domain",
        type: "Edm.String" as SearchFieldDataType,
        searchable: true,
        filterable: true,
        sortable: false,
        facetable: true
      },
      {
        name: "technical_complexity",
        type: "Edm.String" as SearchFieldDataType,
        searchable: false,
        filterable: true,
        sortable: true,
        facetable: true
      },
      
      // Status and quality indicators
      {
        name: "completed",
        type: "Edm.Boolean" as SearchFieldDataType,
        searchable: false,
        filterable: true,
        sortable: true,
        facetable: true
      },
      {
        name: "maintenance_status",
        type: "Edm.String" as SearchFieldDataType,
        searchable: true,
        filterable: true,
        sortable: false,
        facetable: true
      },
      
      // Tags and categories (searchable collections)
      {
        name: "keywords",
        type: "Edm.String" as SearchFieldDataType,
        searchable: true,
        filterable: true,
        sortable: false,
        facetable: true,
        analyzerName: KnownAnalyzerNames.Keyword
      },
      {
        name: "technology_tags",
        type: "Edm.String" as SearchFieldDataType,
        searchable: true,
        filterable: true,
        sortable: false,
        facetable: true,
        analyzerName: KnownAnalyzerNames.Keyword
      },
      {
        name: "primary_category",
        type: "Edm.String" as SearchFieldDataType,
        searchable: true,
        filterable: true,
        sortable: false,
        facetable: true
      },
      
      // Vector field for semantic search (if embeddings are available)
      {
        name: "embeddings",
        type: "Collection(Edm.Single)" as SearchFieldDataType,
        searchable: true,
        vectorSearchDimensions: 1536, // OpenAI ada-002 embedding dimensions
        vectorSearchProfileName: "default-vector-profile"
      }
    ];
    
    // Create the index
    const index: SearchIndex = {
      name: azureConfig.search.indexName,
      fields,
      semanticSearch: {
        configurations: [
          {
            name: azureConfig.search.semanticConfigName,
            prioritizedFields: {
              titleField: {
                name: "project_name"
              },
              contentFields: [
                { name: "description" },
                { name: "features" },
                { name: "notes" },
                { name: "tech_stack" }
              ],
              keywordsFields: [
                { name: "keywords" },
                { name: "technology_tags" },
                { name: "primary_category" }
              ]
            }
          }
        ]
      },
      vectorSearch: {
        profiles: [
          {
            name: "default-vector-profile",
            algorithmConfigurationName: "default-vector-algorithm"
          }
        ],
        algorithms: [
          {
            name: "default-vector-algorithm",
            kind: "hnsw",
            parameters: {
              metric: "cosine",
              m: 4,
              efConstruction: 400,
              efSearch: 500
            }
          }
        ]
      }
    };
    
    try {
      await this.indexClient.createIndex(index);
      console.log(`✅ Search index '${azureConfig.search.indexName}' created successfully`);
    } catch (error: any) {
      if (error.statusCode === 409) {
        console.log(`ℹ️  Search index '${azureConfig.search.indexName}' already exists`);
      } else {
        console.error('❌ Error creating search index:', error.message);
        throw error;
      }
    }
  }
  
  /**
   * Uploads the CSV dataset to Azure Blob Storage
   */
  async uploadDatasetToBlobStorage(csvFilePath: string, containerName: string = 'project-pulse-data'): Promise<string> {
    if (!this.blobServiceClient) {
      throw new Error('Azure Blob Storage client not initialized. Please set AZURE_STORAGE_CONNECTION_STRING');
    }
    
    console.log('Uploading dataset to Azure Blob Storage...');
    
    // Get container client and create container if it doesn't exist
    const containerClient: ContainerClient = this.blobServiceClient.getContainerClient(containerName);
    await containerClient.createIfNotExists({ access: 'blob' });
    
    // Upload the CSV file
    const blobName = 'project-pulse-extended-metadata.csv';
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    const csvContent = readFileSync(csvFilePath);
    await blockBlobClient.upload(csvContent, csvContent.length, {
      blobHTTPHeaders: {
        blobContentType: 'text/csv'
      }
    });
    
    const blobUrl = blockBlobClient.url;
    console.log(`✅ Dataset uploaded to: ${blobUrl}`);
    
    return blobUrl;
  }
  
  /**
   * Creates a data source connection for the blob storage
   */
  async createDataSource(containerName: string = 'project-pulse-data'): Promise<void> {
    if (!process.env.AZURE_STORAGE_CONNECTION_STRING) {
      throw new Error('AZURE_STORAGE_CONNECTION_STRING environment variable not set');
    }
    
    console.log('Creating data source connection...');
    
    const dataSource: SearchIndexerDataSourceConnection = {
      name: 'project-pulse-datasource',
      type: 'azureblob',
      connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
      container: {
        name: containerName,
        query: null
      },
      description: 'Project Pulse CSV data source'
    };
    
    // Note: Data source creation requires SearchIndexerClient
    throw new Error('Data source creation requires SearchIndexerClient. Please use the REST API or update SDK version.');
  }
  
  /**
   * Creates an indexer to automatically process the data
   */
  async createIndexer(): Promise<void> {
    console.log('Creating indexer...');
    
    const indexer: SearchIndexer = {
      name: 'project-pulse-indexer',
      description: 'Project Pulse CSV indexer',
      dataSourceName: 'project-pulse-datasource',
      targetIndexName: azureConfig.search.indexName,
      schedule: {
        interval: 'PT1H' // Run every hour
      },
      parameters: {
        batchSize: 100,
        maxFailedItems: 10,
        maxFailedItemsPerBatch: 5,
        configuration: {
          dataToExtract: 'contentAndMetadata',
          parsingMode: 'delimitedText',
          delimitedTextHeaders: 'stage,started_at,ended_at,duration_h,cost,remarks,uuid,project_id,project_name,tech_stack,frontend,backend,database,auth,cloud,tools,description,completed,notes,dependencies_prod,dependencies_dev,framework_versions,features,project_type,deployment_type,testing_framework,bundler,styling_framework,content_management,performance_features,security_features,accessibility_features,development_experience,api_type,data_persistence,scaling_approach,target_audience,business_domain,technical_complexity,maintenance_status,documentation_quality,code_quality_tools,deployment_platforms,keywords,primary_category,secondary_categories,technology_tags,skill_level_tags,use_case_tags,domain_tags,architecture_patterns,development_methodologies,embeddings',
          delimitedTextDelimiter: ',',
          firstLineContainsHeaders: true
        }
      },
      fieldMappings: [
        {
          sourceFieldName: 'metadata_storage_path',
          targetFieldName: 'id',
          mappingFunction: {
            name: 'base64Encode'
          }
        },
        {
          sourceFieldName: 'project_id',
          targetFieldName: 'project_id'
        },
        {
          sourceFieldName: 'project_name',
          targetFieldName: 'project_name'
        },
        {
          sourceFieldName: 'uuid',
          targetFieldName: 'uuid'
        },
        {
          sourceFieldName: 'stage',
          targetFieldName: 'stage'
        },
        {
          sourceFieldName: 'description',
          targetFieldName: 'description'
        },
        {
          sourceFieldName: 'tech_stack',
          targetFieldName: 'tech_stack'
        },
        {
          sourceFieldName: 'features',
          targetFieldName: 'features'
        },
        {
          sourceFieldName: 'project_type',
          targetFieldName: 'project_type'
        },
        {
          sourceFieldName: 'primary_category',
          targetFieldName: 'primary_category'
        },
        {
          sourceFieldName: 'keywords',
          targetFieldName: 'keywords'
        },
        {
          sourceFieldName: 'technology_tags',
          targetFieldName: 'technology_tags'
        }
      ]
    };
    
    // Note: Indexer creation requires SearchIndexerClient
    throw new Error('Indexer creation requires SearchIndexerClient. Please use the REST API or update SDK version.');
  }
  
  /**
   * Processes and uploads CSV data directly to the search index
   */
  async uploadCsvDataDirectly(csvFilePath: string): Promise<void> {
    console.log('Processing and uploading CSV data directly to search index...');
    
    try {
      // Read and parse CSV file
      const csvContent = readFileSync(csvFilePath, 'utf-8');
      const records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        cast: true,
        cast_date: false // We'll handle date conversion manually
      });
      
      console.log(`📊 Parsed ${records.length} records from CSV`);
      
      // Transform records to match search index schema
      const documents: ProjectPulseDocument[] = records.map((record: any, index: number) => {
        // Parse embeddings if present
        let embeddings: number[] | undefined;
        if (record.embeddings && typeof record.embeddings === 'string') {
          try {
            // Handle the array string format from the CSV
            const embeddingStr = record.embeddings.replace(/^\[|\]$/g, ''); // Remove brackets
            embeddings = embeddingStr.split(',').map((num: string) => parseFloat(num.trim()));
          } catch (e) {
            console.warn(`Warning: Could not parse embeddings for record ${index}:`, e);
            embeddings = undefined;
          }
        }
        
        // Parse dates
        const parseDate = (dateStr: string) => {
          if (!dateStr || dateStr === '') return undefined;
          try {
            return new Date(dateStr).toISOString();
          } catch (e) {
            console.warn(`Warning: Could not parse date "${dateStr}":`, e);
            return undefined;
          }
        };
        
        return {
          id: `${record.project_id}_${record.stage}_${index}`, // Unique ID
          project_id: String(record.project_id || ''),
          project_name: String(record.project_name || ''),
          uuid: String(record.uuid || ''),
          stage: String(record.stage || ''),
          started_at: parseDate(record.started_at) || new Date().toISOString(),
          ended_at: parseDate(record.ended_at) || new Date().toISOString(),
          duration_h: parseFloat(record.duration_h) || 0,
          cost: parseFloat(record.cost) || 0,
          remarks: String(record.remarks || ''),
          tech_stack: String(record.tech_stack || ''),
          frontend: String(record.frontend || ''),
          backend: String(record.backend || ''),
          database: String(record.database || ''),
          auth: String(record.auth || ''),
          cloud: String(record.cloud || ''),
          tools: String(record.tools || ''),
          framework_versions: String(record.framework_versions || ''),
          description: String(record.description || ''),
          completed: record.completed === '1' || record.completed === true || record.completed === 'true',
          notes: String(record.notes || ''),
          features: String(record.features || ''),
          project_type: String(record.project_type || ''),
          deployment_type: String(record.deployment_type || ''),
          dependencies_prod: String(record.dependencies_prod || ''),
          dependencies_dev: String(record.dependencies_dev || ''),
          testing_framework: String(record.testing_framework || ''),
          bundler: String(record.bundler || ''),
          styling_framework: String(record.styling_framework || ''),
          content_management: String(record.content_management || ''),
          performance_features: String(record.performance_features || ''),
          security_features: String(record.security_features || ''),
          accessibility_features: String(record.accessibility_features || ''),
          development_experience: String(record.development_experience || ''),
          api_type: String(record.api_type || ''),
          data_persistence: String(record.data_persistence || ''),
          scaling_approach: String(record.scaling_approach || ''),
          target_audience: String(record.target_audience || ''),
          business_domain: String(record.business_domain || ''),
          technical_complexity: String(record.technical_complexity || ''),
          maintenance_status: String(record.maintenance_status || ''),
          documentation_quality: String(record.documentation_quality || ''),
          code_quality_tools: String(record.code_quality_tools || ''),
          deployment_platforms: String(record.deployment_platforms || ''),
          keywords: String(record.keywords || ''),
          primary_category: String(record.primary_category || ''),
          secondary_categories: String(record.secondary_categories || ''),
          technology_tags: String(record.technology_tags || ''),
          skill_level_tags: String(record.skill_level_tags || ''),
          use_case_tags: String(record.use_case_tags || ''),
          domain_tags: String(record.domain_tags || ''),
          architecture_patterns: String(record.architecture_patterns || ''),
          development_methodologies: String(record.development_methodologies || ''),
          embeddings
        };
      });
      
      console.log(`🔄 Transformed ${documents.length} documents for upload`);
      
      // Upload documents in batches
      const batchSize = 50;
      for (let i = 0; i < documents.length; i += batchSize) {
        const batch = documents.slice(i, i + batchSize);
        
        try {
          const result = await this.searchClient.uploadDocuments(batch);
          const successful = result.results.filter(r => r.succeeded).length;
          const failed = result.results.filter(r => !r.succeeded).length;
          
          console.log(`📤 Batch ${Math.floor(i / batchSize) + 1}: ${successful} successful, ${failed} failed`);
          
          if (failed > 0) {
            const failures = result.results.filter(r => !r.succeeded);
            failures.forEach(failure => {
              console.error(`❌ Failed to upload document ${failure.key}:`, failure.errorMessage);
            });
          }
        } catch (error) {
          console.error(`❌ Error uploading batch ${Math.floor(i / batchSize) + 1}:`, error);
        }
      }
      
      console.log('✅ CSV data upload completed');
      
    } catch (error) {
      console.error('❌ Error processing CSV data:', error);
      throw error;
    }
  }
  
  /**
   * Runs the complete setup process: create index, upload data, and optionally set up indexer
   */
  async setupComplete(csvFilePath: string, useIndexer: boolean = false): Promise<void> {
    console.log('🚀 Starting complete Azure AI Search setup for Project Pulse...');
    
    try {
      // Step 1: Create the search index
      await this.createSearchIndex();
      
      if (useIndexer) {
        // Step 2a: Upload to blob storage and set up indexer
        await this.uploadDatasetToBlobStorage(csvFilePath);
        await this.createDataSource();
        await this.createIndexer();
        
        // Note: Running indexer requires SearchIndexerClient
        console.log('⚠️  Indexer setup completed but cannot run automatically. Use Azure portal or REST API to run the indexer.');
      } else {
        // Step 2b: Upload data directly to search index
        await this.uploadCsvDataDirectly(csvFilePath);
      }
      
      console.log('🎉 Setup completed successfully!');
      console.log(`📍 Search index: ${azureConfig.search.indexName}`);
      console.log(`🔍 Search endpoint: ${azureConfig.search.endpoint}`);
      
    } catch (error) {
      console.error('💥 Setup failed:', error);
      throw error;
    }
  }
  
  /**
   * Deletes the search index (cleanup method)
   */
  async deleteIndex(): Promise<void> {
    try {
      await this.indexClient.deleteIndex(azureConfig.search.indexName);
      console.log(`✅ Search index '${azureConfig.search.indexName}' deleted successfully`);
    } catch (error: any) {
      console.error('❌ Error deleting search index:', error.message);
      throw error;
    }
  }
}