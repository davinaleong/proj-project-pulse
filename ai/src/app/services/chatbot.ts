export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

export class ChatbotService {
  private static instance: ChatbotService;

  private constructor() {}

  static getInstance(): ChatbotService {
    if (!ChatbotService.instance) {
      ChatbotService.instance = new ChatbotService();
    }
    return ChatbotService.instance;
  }

  async sendMessage(message: string): Promise<string> {
    try {
      // Call the API route which handles Azure AI Search server-side
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('Chatbot error:', error);
      throw new Error('Failed to get response from AI assistant');
    }
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