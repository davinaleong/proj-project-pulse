export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

// Frontend-only chatbot service with mock responses
export class ChatbotService {
  private static instance: ChatbotService;
  private responses: string[] = [
    "That's an interesting question about Project Pulse AI! This is a demo response since we're running in frontend-only mode.",
    "Project Pulse AI is designed to help you understand your development projects and tech stacks. This is a simulated response.",
    "I can help you analyze project structures, dependencies, and development workflows. Currently running in demo mode.",
    "Great question! In a full implementation, I would search through your project documentation using Azure AI Search.",
    "This chatbot demonstrates the UI capabilities of Project Pulse AI. The backend integration would provide real project insights.",
    "I'd love to help you with that! This is a sample response showing how the chat interface works.",
    "Project Pulse AI can analyze code patterns, tech stack decisions, and development timelines. This is a demo response.",
    "That's a good point about project management! In production, I'd access real project data to give you specific insights."
  ];

  private constructor() {}

  static getInstance(): ChatbotService {
    if (!ChatbotService.instance) {
      ChatbotService.instance = new ChatbotService();
    }
    return ChatbotService.instance;
  }

  async sendMessage(message: string): Promise<string> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    try {
      // Generate contextual mock responses based on user input
      let response = this.getContextualResponse(message);
      
      // Add some randomness if no specific match
      if (!response) {
        const randomIndex = Math.floor(Math.random() * this.responses.length);
        response = this.responses[randomIndex];
      }
      
      return response;
    } catch (error) {
      console.error('Chatbot error:', error);
      return "I encountered an error processing your request. This is running in demo mode.";
    }
  }

  private getContextualResponse(message: string): string | null {
    const lowercaseMessage = message.toLowerCase();
    
    if (lowercaseMessage.includes('tech stack') || lowercaseMessage.includes('technology')) {
      return "Based on your project structure, I can see you're using Next.js, TypeScript, Tailwind CSS, and various other modern technologies. This analysis would be more detailed with full backend integration.";
    }
    
    if (lowercaseMessage.includes('project') && lowercaseMessage.includes('structure')) {
      return "Your project follows a clean architecture with separate API and UI layers. The API uses Express with TypeScript, while the frontend is built with Next.js. This is a demo analysis.";
    }
    
    if (lowercaseMessage.includes('database') || lowercaseMessage.includes('data')) {
      return "I can see you're using Prisma ORM for database management, which is great for type-safe database operations. This insight comes from analyzing your project structure.";
    }
    
    if (lowercaseMessage.includes('test') || lowercaseMessage.includes('testing')) {
      return "Your project has a comprehensive testing setup with Jest and various test suites. Testing is crucial for maintaining code quality. This is a demo response.";
    }
    
    if (lowercaseMessage.includes('deployment') || lowercaseMessage.includes('deploy')) {
      return "For deployment, you could consider platforms like Vercel for the frontend and Azure App Service for the API. This recommendation is based on your current tech stack.";
    }
    
    return null;
  }

  // Helper method to create message objects
  createMessage(text: string, sender: 'user' | 'assistant'): ChatMessage {
    return {
      id: crypto.randomUUID(),
      text,
      sender,
      timestamp: new Date()
    };
  }
}