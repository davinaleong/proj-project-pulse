"use client"

import Main from './../components/Main'
import ChatArea from "./../components/ChatArea"
import AiChatBubble from "./../components/AiChatBubble"
import MeChatBubble from "./../components/MeChatBubble"
import InteractiveTextarea from "./../components/InteractiveTextarea"
import Button from "./../components/Button"

export default function Chatbot() {
  const handleCButtonClick = () => console.log('Button clicked')

  return (
    <Main className="grid gap-4 grid-rows-[1fr_auto] grid-cols-[1fr_auto] items-start">
       <ChatArea>
        <AiChatBubble>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Assumenda, harum debitis nisi nobis porro, minima reprehenderit quo eaque iusto necessitatibus illo inventore exercitationem error. Minus voluptates tenetur eius sequi, corrupti temporibus a quod error, dolorem dignissimos, nesciunt laboriosam! Doloremque porro quas quam! Maxime quas eligendi ad libero, minus inventore vitae.</AiChatBubble>

        <MeChatBubble>Lorem, ipsum dolor sit amet consectetur adipisicing elit. Sed ipsam soluta fuga sapiente neque est, modi eos architecto necessitatibus quisquam unde impedit accusantium earum quae atque incidunt sequi accusamus eaque!</MeChatBubble>
       </ChatArea>
       
       <InteractiveTextarea
          label="Ask Project Pulse AI"
          placeholder="What would you like to know about your projects?"
          rows={1}
          maxLength={500}
        />
       
      <Button 
        textColor="text-white" 
        bgColor="bg-ppai-teal-500" 
        onClick={handleCButtonClick}
      >
        Send
      </Button>
    </Main>
  );
}
