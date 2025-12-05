# Azure AI Search Index Management

This directory contains tools and services for programmatically creating and managing Azure AI Search indexes for the Project Pulse dataset.

## 📋 Overview

The index management system provides:
- **Automated index creation** with optimal field configurations
- **Data ingestion** from CSV files into Azure AI Search
- **Semantic search configuration** for enhanced search capabilities
- **Vector search support** for embeddings-based similarity search
- **Flexible deployment options** (direct upload or Azure indexers)

## 🏗️ Architecture

```
ai/backend/services/
├── indexManager.ts          # Main index management service
├── searchService.ts         # Search client and operations
└── ...

ai/backend/scripts/
├── setupIndex.ts           # CLI setup script (TypeScript)
├── setupIndex.js           # CLI runner (JavaScript)
└── ...

ai/backend/data/
└── project-pulse-extended-metadata.csv  # Sample dataset
```

## 🚀 Quick Start

### Prerequisites

1. **Azure AI Search Service** - Create an Azure AI Search service in your Azure subscription
2. **Environment Variables** - Configure the following in your `.env` file:

```env
# Required for all operations
AZURE_SEARCH_ENDPOINT=https://your-search-service.search.windows.net
AZURE_SEARCH_API_KEY=your-admin-api-key
AZURE_SEARCH_INDEX_NAME=project-pulse-index

# Optional configuration
AZURE_SEARCH_API_VERSION=2024-07-01
AZURE_SEMANTIC_CONFIG_NAME=default

# Required only if using Azure indexers
AZURE_STORAGE_CONNECTION_STRING=your-storage-connection-string
```

3. **Dependencies** - Install the required packages:

```bash
npm install
```

### Basic Setup (Recommended)

The easiest way to set up the search index is using direct upload:

```bash
# Setup with default settings
npm run setup-index

# Setup with custom CSV path
npm run setup-index -- --csv-path ./path/to/your/data.csv

# Get help
npm run setup-index -- --help
```

### Advanced Setup Options

```bash
# Delete existing index before creating new one
npm run setup-index -- --delete-index

# Use Azure indexer (requires blob storage)
npm run setup-index -- --use-indexer

# Enable verbose logging
npm run setup-index -- --verbose
```

## 📊 Dataset Schema

The Project Pulse dataset includes the following fields:

### Core Project Information
- `id` - Unique identifier (generated)
- `project_id` - Project identifier
- `project_name` - Project name
- `uuid` - Universal unique identifier
- `stage` - Development stage (Analysis, Design, Implementation, etc.)

### Project Metadata
- `started_at` / `ended_at` - Project timeline
- `duration_h` - Duration in hours
- `cost` - Project cost
- `completed` - Completion status
- `remarks` / `notes` - Additional information

### Technology Stack
- `tech_stack` - Overall technology description
- `frontend` / `backend` / `database` - Technology choices
- `framework_versions` - Version information
- `dependencies_prod` / `dependencies_dev` - Dependencies

### Project Characteristics
- `features` - Key project features
- `project_type` - Type classification
- `deployment_type` - Deployment approach
- `technical_complexity` - Complexity rating
- `business_domain` - Domain classification

### Categorization & Search
- `keywords` - Search keywords
- `technology_tags` - Technology tags
- `primary_category` / `secondary_categories` - Categories
- `embeddings` - Vector embeddings for semantic search

## 🔧 Programmatic Usage

### Using the SearchIndexManager Service

```typescript
import { SearchIndexManager } from './services/indexManager';

const indexManager = new SearchIndexManager();

// Create index and upload data directly
await indexManager.setupComplete('./data/project-pulse-extended-metadata.csv');

// Or use Azure indexer approach
await indexManager.setupComplete('./data/project-pulse-extended-metadata.csv', true);
```

### Individual Operations

```typescript
// Create just the index schema
await indexManager.createSearchIndex();

// Upload CSV data directly
await indexManager.uploadCsvDataDirectly('./path/to/data.csv');

// Set up Azure indexer (requires blob storage)
await indexManager.uploadDatasetToBlobStorage('./path/to/data.csv');
await indexManager.createDataSource();
await indexManager.createIndexer();
```

## 🔍 Search Index Features

### Field Configuration
- **Searchable fields**: Project names, descriptions, technology stacks, features
- **Filterable fields**: Categories, complexity, completion status, dates
- **Facetable fields**: Technology tags, project types, business domains
- **Sortable fields**: Dates, duration, cost, complexity

### Search Capabilities
- **Full-text search** with Azure's linguistic analyzers
- **Semantic search** with prioritized title, content, and keyword fields
- **Vector search** for similarity matching using embeddings
- **Faceted search** for category-based filtering
- **Geographic search** (if location data is added)

### Analyzers Used
- **English Lucene** - For natural language content (descriptions, features)
- **Keyword** - For exact matching (tags, technology names)
- **Standard** - For general text fields

## 📈 Performance Considerations

### Index Design
- **Selective field configuration** - Only necessary fields are searchable/filterable
- **Optimized analyzers** - Appropriate analyzers for each field type
- **Vector dimensions** - 1536 dimensions for OpenAI embeddings compatibility

### Data Upload Options

#### Direct Upload (Recommended)
- ✅ Faster setup
- ✅ No additional Azure resources required
- ✅ Better for development and testing
- ❌ Manual process for updates

#### Azure Indexer
- ✅ Automated updates
- ✅ Scheduled processing
- ✅ Better for production
- ❌ Requires Azure Blob Storage
- ❌ More complex setup

### Batch Processing
- Documents are uploaded in batches of 50
- Failed uploads are logged with detailed error information
- Progress is reported during large dataset uploads

## 🛠️ Troubleshooting

### Common Issues

#### Authentication Errors
```
❌ Authentication failed
```
**Solution**: Check your `AZURE_SEARCH_API_KEY` and ensure it's an admin key, not a query key.

#### Index Already Exists
```
ℹ️ Search index already exists
```
**Solution**: Use `--delete-index` flag to recreate the index or choose a different index name.

#### CSV File Not Found
```
❌ CSV file not found
```
**Solution**: Verify the file path or use `--csv-path` to specify the correct location.

#### Storage Connection Issues
```
❌ Storage connection failed
```
**Solution**: When using `--use-indexer`, ensure `AZURE_STORAGE_CONNECTION_STRING` is properly configured.

### Environment Variable Validation

The setup script automatically validates required environment variables:

```
Environment Variables Check:
  ✅ AZURE_SEARCH_ENDPOINT: Set
  ✅ AZURE_SEARCH_API_KEY: Set
  ✅ AZURE_SEARCH_INDEX_NAME: Set
  ℹ️  AZURE_STORAGE_CONNECTION_STRING: Not set
```

### Debugging Options

Enable verbose logging for detailed error information:
```bash
npm run setup-index -- --verbose
```

## 📚 API Integration

Once the index is created, you can search it using the existing search service:

```typescript
import { searchService } from './services/searchService';

// Basic search
const results = await searchService.search({
  query: 'React TypeScript',
  top: 10
});

// Advanced search with filters and facets
const results = await searchService.search({
  query: 'web application',
  filters: "project_type eq 'Web Application'",
  facets: ['technology_tags', 'business_domain'],
  enableSemanticSearch: true
});
```

## 🔄 Data Updates

### Incremental Updates
For production use, consider implementing incremental updates:

1. **Track changes** in your source data
2. **Update specific documents** using document keys
3. **Use merge operations** for partial updates

```typescript
// Update specific documents
await searchClient.mergeOrUploadDocuments([
  {
    id: 'project-1',
    description: 'Updated description',
    // Only include fields to update
  }
]);
```

### Bulk Operations
For large datasets, use the batch upload functionality:

```typescript
// Upload in optimized batches
await indexManager.uploadCsvDataDirectly('./updated-data.csv');
```

## 📋 Monitoring & Maintenance

### Index Statistics
Monitor index size and document count through the Azure portal or API:

```typescript
const stats = await indexClient.getIndexStatistics(indexName);
console.log(`Documents: ${stats.documentCount}`);
console.log(`Storage: ${stats.storageSize} bytes`);
```

### Search Analytics
Enable search analytics in Azure Portal to monitor:
- Query patterns
- Search performance
- Popular search terms
- Click-through rates

### Index Optimization
Consider periodic index optimization for production use:
- **Rebuild indexes** for schema changes
- **Optimize storage** by removing unused fields
- **Update analyzers** based on search patterns

## 🔐 Security Best Practices

### API Key Management
- Use **admin keys** only for index management operations
- Use **query keys** for search operations in production
- Store keys securely in Azure Key Vault for production deployments

### Access Control
- Limit API key permissions to necessary operations
- Use Azure Active Directory authentication when possible
- Implement IP restrictions in Azure portal

### Data Privacy
- Review data fields for sensitive information
- Consider field-level security for restricted data
- Implement proper data retention policies

## 🌟 Next Steps

After setting up the index, consider:

1. **Testing search functionality** with various queries
2. **Configuring semantic search** for better relevance
3. **Implementing vector search** with embeddings
4. **Setting up monitoring** and alerting
5. **Planning for production deployment** with proper security
6. **Optimizing index schema** based on actual usage patterns

## 📞 Support

If you encounter issues:

1. Check the [troubleshooting section](#🛠️-troubleshooting) above
2. Run with `--verbose` flag for detailed logging
3. Verify all environment variables are correctly set
4. Check Azure portal for service status and logs