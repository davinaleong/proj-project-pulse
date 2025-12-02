import searchClient from "./searchClient";
import openAiClient from "./openAiClient";
import env from "./env";

export async function askQuestion(query: string) {
  // 1. Retrieve relevant chunks
  const results = await searchClient.search(query, {
    top: 5,
    queryType: "semantic",
    semanticSearchOptions: {
      configurationName: env.AZURE_SEMANTIC_CONFIG_NAME
    },
  });

  const docs = [];
  for await (const r of results.results) docs.push(r.document);

  // 2. Feed into GPT with grounding
  const completion = await openAiClient.chat.completions.create({
    model: env.AZURE_OPENAI_MODEL,
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
