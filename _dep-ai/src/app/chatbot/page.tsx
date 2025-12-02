"use client"

import { useState } from 'react';
import Main from './../components/Main'
import ChatArea from "./../components/ChatArea"
import AiChatBubble from "./../components/AiChatBubble"
import MeChatBubble from "./../components/MeChatBubble"
import InteractiveTextarea from "./../components/InteractiveTextarea"
import Button from "./../components/Button"
import { ChatbotService, type ChatMessage } from '../services/chatbot';

const chatbotService = ChatbotService.getInstance();

export default function Chatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    chatbotService.createMessage(
      "Hello! I'm your Project Pulse AI assistant. I can help you understand your projects, tech stacks, and development processes. What would you like to know?",
      'assistant'
    )
  ]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!currentMessage.trim() || isLoading) return;

    const userMessage = chatbotService.createMessage(currentMessage, 'user');
    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsLoading(true);

    try {
      const response = await chatbotService.sendMessage(currentMessage);
      const assistantMessage = chatbotService.createMessage(response, 'assistant');
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage = chatbotService.createMessage(
        'Sorry, I encountered an error processing your request. Please try again.',
        'assistant'
      );
      setMessages(prev => [...prev, errorMessage]);
      console.error('Chat error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Main className="grid gap-4 grid-rows-[1fr_auto] grid-cols-[1fr_auto] items-start">
       <ChatArea>
        {messages.map((message) => (
          message.sender === 'assistant' ? (
            <AiChatBubble key={message.id}>{message.text}</AiChatBubble>
          ) : (
            <MeChatBubble key={message.id}>{message.text}</MeChatBubble>
          )
        ))}
        
        {isLoading && (
          <AiChatBubble>
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-ppai-teal-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-ppai-teal-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-ppai-teal-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
              <span className="text-ppai-slate-600">Thinking...</span>
            </div>
          </AiChatBubble>
        )}
       </ChatArea>
       
       <InteractiveTextarea
          label="Ask Project Pulse AI"
          placeholder="What would you like to know about your projects?"
          rows={1}
          maxLength={500}
          value={currentMessage}
          onChangeText={(val) => setCurrentMessage(val)}
          onKeyPress={handleKeyPress}
        />
       
      <Button 
        textColor="text-white" 
        bgColor="bg-ppai-teal-500" 
        onClick={handleSend}
        disabled={!currentMessage.trim() || isLoading}
      >
        {isLoading ? 'Sending...' : 'Send'}
      </Button>
    </Main>
  );
}
