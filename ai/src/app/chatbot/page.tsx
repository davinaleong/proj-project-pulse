"use client"

import Main from './../components/Main'
import ChatArea from "./../components/ChatArea"
import AiChatBubble from "./../components/AiChatBubble"
import MeChatBubble from "./../components/MeChatBubble"
import InteractiveTextarea from "./../components/InteractiveTextarea"
import Button from "./../components/Button"

const handleSend = () => console.log("Send Clicked")

export default function Chatbot() {
  return (
    <Main className="grid gap-4 grid-rows-[1fr_auto] grid-cols-[1fr_auto] items-start">
       <ChatArea>
        <AiChatBubble>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Officia, voluptates? Dolores, cumque! Cupiditate beatae, nemo necessitatibus cumque earum quasi aliquam!</AiChatBubble>

        <MeChatBubble>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse vulputate, nibh quis feugiat varius, augue libero pellentesque justo, non tempor lorem lacus vel risus. Curabitur viverra lacus vel tincidunt posuere. Integer ut ultricies neque, non hendrerit tortor.
        </MeChatBubble>
       </ChatArea>
       <InteractiveTextarea
        label="Notes about Project Pulse AI"
        placeholder="What would you like to know about your projects?"
        rows={1}
        maxLength={300}
        onChangeText={(val) => {
          console.log("Current value:", val);
        }}
      />
      <Button textColor="text-white" bgColor="bg-ppai-teal-500" className="align-self-start" onClick={handleSend}>Send</Button>
    </Main>
  );
}
