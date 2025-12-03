# Simple AI Backend Setup for Next.js Integration

## 🎯 Overview
This AI backend has been simplified for small projects and seamless Next.js integration. **No database required!**

## 🔧 Authentication Methods

### 1. **Shared Secret (Recommended for Next.js)**
- **Use Case**: Same-repo Next.js frontend calling AI backend
- **Security**: Simple shared secret between services
- **Header**: `X-Shared-Secret: your-secret-here`
- **No JWT tokens needed**

### 2. **JWT Tokens (Optional for External Clients)**
- **Use Case**: External applications or testing
- **Security**: Standard JWT with expiration
- **Header**: `Authorization: Bearer jwt-token-here`
- **Get tokens via**: `POST /api/v1/auth/token`

## 🚀 Quick Setup

### 1. Environment Variables
```bash
# Copy and fill .env.example
cp .env.example .env

# Required variables:
SHARED_SECRET=your-24-character-shared-secret-here
JWT_SECRET=your-32-character-jwt-secret-here
AZURE_SEARCH_ENDPOINT=your-search-endpoint
AZURE_SEARCH_API_KEY=your-search-key
AZURE_OPENAI_ENDPOINT=your-openai-endpoint
AZURE_OPENAI_API_KEY=your-openai-key
```

### 2. Next.js Integration
Add to your Next.js `.env.local`:
```bash
AI_BACKEND_SHARED_SECRET=same-as-ai-backend-shared-secret
NEXT_PUBLIC_AI_API_URL=http://localhost:3001/api/v1
```

### 3. Start Services
```bash
# Start AI Backend
npm run dev

# Start Next.js (in separate terminal)
cd ../ui  # or your Next.js directory
npm run dev
```

## 📝 Next.js Usage Examples

### Simple API Client (utils/ai-client.js)
```javascript
const AI_API_BASE = process.env.NEXT_PUBLIC_AI_API_URL;
const SHARED_SECRET = process.env.AI_BACKEND_SHARED_SECRET;

export async function searchWithAI(query) {
  const response = await fetch(`${AI_API_BASE}/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shared-Secret': SHARED_SECRET
    },
    body: JSON.stringify({
      query,
      maxResults: 5,
      searchType: 'semantic'
    })
  });
  
  return response.json();
}

export async function askAI(question) {
  const response = await fetch(`${AI_API_BASE}/rag/ask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shared-Secret': SHARED_SECRET
    },
    body: JSON.stringify({
      question,
      maxSearchResults: 3,
      temperature: 0.7
    })
  });
  
  return response.json();
}
```

### Next.js API Route (pages/api/ai/search.js)
```javascript
import { searchWithAI } from '../../../utils/ai-client';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query } = req.body;
    const results = await searchWithAI(query);
    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ error: 'Search failed' });
  }
}
```

### React Component
```jsx
import { useState } from 'react';

export default function AISearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      const data = await response.json();
      setResults(data.data?.results || []);
    } catch (error) {
      console.error('Search failed:', error);
    }
    setLoading(false);
  };

  return (
    <div>
      <input 
        value={query} 
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search with AI..."
      />
      <button onClick={handleSearch} disabled={loading}>
        {loading ? 'Searching...' : 'Search'}
      </button>
      
      {results.map((result, i) => (
        <div key={i}>
          <h3>{result.title}</h3>
          <p>{result.content}</p>
        </div>
      ))}
    </div>
  );
}
```

## 🔐 Security Features

✅ **Shared Secret Authentication** - Simple and secure for same-repo communication  
✅ **JWT Tokens** - Standard tokens for external clients  
✅ **CORS Protection** - Configurable origins  
✅ **Rate Limiting** - Prevents abuse  
✅ **Request Validation** - Input sanitization  
✅ **Error Handling** - Secure error responses  

## 📊 Available Endpoints

### Authentication (No Auth Required)
- `GET /api/v1/auth/info` - Auth information
- `POST /api/v1/auth/token` - Get JWT token (optional)
- `GET /api/v1/auth/shared-secret` - Get shared secret (dev only)

### AI Services (Shared Secret or JWT Required)
- `POST /api/v1/search` - AI-powered search
- `POST /api/v1/rag/ask` - Question answering
- `POST /api/v1/chat/completions` - Chat completions

### Health (No Auth Required)
- `GET /api/v1/health` - Service health

## 🧪 Testing

### Test Shared Secret Auth
```bash
curl -X POST http://localhost:3001/api/v1/search \
  -H "Content-Type: application/json" \
  -H "X-Shared-Secret: your-shared-secret" \
  -d '{"query": "test search"}'
```

### Get Development Info
```bash
# Get shared secret (dev mode only)
curl http://localhost:3001/api/v1/auth/shared-secret

# Get auth info
curl http://localhost:3001/api/v1/auth/info
```

## 🔧 Development vs Production

### Development
- Shared secret visible via `/auth/shared-secret` endpoint
- More verbose logging
- CORS allows localhost origins

### Production
- Remove development endpoints
- Use strong secrets (24+ characters)
- Configure proper CORS origins
- Enable HTTPS

## 🤝 Benefits of This Approach

✅ **No Database Required** - Stateless authentication  
✅ **Simple Integration** - Just one header for Next.js  
✅ **Secure** - Shared secrets for internal, JWT for external  
✅ **Fast** - No database lookups  
✅ **Scalable** - Stateless design  
✅ **Flexible** - Supports multiple auth methods  

---

**Perfect for small to medium projects where simplicity and security matter!** 🚀