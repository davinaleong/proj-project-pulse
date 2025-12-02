import searchClient from "./searchClient";
import openAiClient from "./openAiClient";

export async function askQuestion(query: string) {
  // 1. Retrieve relevant chunks
  const results = await searchClient.search(query, {
    top: 5,
    queryType: "semantic",
    semanticConfiguration: "default"
  });

  const docs = [];
  for await (const r of results.results) docs.push(r.document);

  // 2. Feed into GPT with grounding
  const completion = await openAiClient.chat.completions.create({
    model: "gpt-4o-mini", // or your Azure model
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      {
        role: "user",
        content: `Use ONLY this dataset when answering:\n${JSON.stringify(
          docs,
          null,
          2
        )}\n\nUser question: ${query}`
      }
    ]
  });

  return completion.choices[0].message.content;
}
