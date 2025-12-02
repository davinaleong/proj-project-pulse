"use client"

import Main from './../components/Main'
import InteractiveTextarea from "./../components/InteractiveTextarea"

export default function Chatbot() {
  return (
    <Main>
       <InteractiveTextarea
        label="Notes about Project Pulse AI"
        placeholder="Write your thoughts here..."
        maxLength={300}
        onChangeText={(val: string) => {
          console.log("Current value:", val);
        }}
      />
    </Main>
  );
}
