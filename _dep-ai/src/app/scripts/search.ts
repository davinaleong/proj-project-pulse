// Frontend-only search with mock responses
import config from "./env";

// Mock project knowledge base
const mockKnowledgeBase = {
  "tech stack": "This project uses Next.js 16 with React 19, TypeScript, and Tailwind CSS for a modern development experience.",
  "database": "The full-stack version includes Prisma ORM with PostgreSQL for robust data management.",
  "deployment": "This frontend-only version can be deployed to Vercel, Netlify, GitHub Pages, or any static hosting service.",
  "testing": "The project includes Jest for unit testing and comprehensive test suites for API endpoints.",
  "components": "We have a custom component library including Button, Flex, InteractiveTextarea, and ChatArea components.",
  "architecture": "Built with Next.js App Router, TypeScript interfaces, and a modular component architecture.",
  "styling": "Uses Tailwind CSS with custom primary (teal) and secondary (slate) color palettes."
};

export async function askQuestion(query: string): Promise<string> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, config.RESPONSE_DELAY_MS));
  
  // Simple keyword matching for mock responses
  const lowercaseQuery = query.toLowerCase();
  
  // Check for specific topics
  for (const [keyword, response] of Object.entries(mockKnowledgeBase)) {
    if (lowercaseQuery.includes(keyword)) {
      return `📋 **${keyword.charAt(0).toUpperCase() + keyword.slice(1)} Info:** ${response}`;
    }
  }
  
  // Default responses for common patterns
  if (lowercaseQuery.includes('hello') || lowercaseQuery.includes('hi')) {
    return "👋 Hello! I'm Project Pulse AI. I can help you learn about this project's tech stack, components, deployment options, and more. What would you like to know?";
  }
  
  if (lowercaseQuery.includes('help')) {
    return "🤖 I can help you with:\n\n• **Tech Stack** - Next.js, React, TypeScript\n• **Components** - Custom UI library\n• **Deployment** - Static hosting options\n• **Architecture** - Project structure\n\nJust ask me anything about the project!";
  }
  
  // Generic helpful response
  return `💭 I understand you're asking about "${query}". This is a demo version with mock responses. In the full version, I would search our knowledge base and provide detailed, contextual answers about the Project Pulse system.`;
}
