"use client"

import Main from './../components/Main'
import InteractiveTextarea from "./../components/InteractiveTextarea"
import Button from "./../components/Button"

const handleSend = () => console.log("Send Clicked")

export default function Chatbot() {
  return (
    <Main className="grid gap-1 grid-rows-[1fr_auto] grid-cols-[1fr_auto] items-start">
       <div className="col-span-2">Chat Bubbles</div>
       <InteractiveTextarea
        label="Notes about Project Pulse AI"
        placeholder="Write your thoughts here..."
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
