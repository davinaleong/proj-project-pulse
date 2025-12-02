import searchClient from "./searchClient";
import openAiClient, { deployment_name } from "./openAiClient";
import env from "./env";

export async function askQuestion(query: string) {
  // 1. Retrieve relevant chunks from Azure AI Search
  const results = await searchClient.search(query, {
    top: 5,
    queryType: "semantic",
    semanticSearchOptions: {
      configurationName: env.AZURE_SEMANTIC_CONFIG_NAME
    },
  });

  const docs = [];
  for await (const r of results.results) docs.push(r.document);

  // 2. Feed into GPT with grounding - following Microsoft Foundry pattern
  const completion = await openAiClient.chat.completions.create({
    messages: [
      { role: "system", content: "You are a helpful Project Pulse AI assistant. Use the provided context to answer questions about projects, tech stacks, and development processes." },
      {
        role: "user",
        content: `Use ONLY this dataset when answering:\n${JSON.stringify(
          docs,
          null,
          2
        )}\n\nUser question: ${query}`
      }
    ],
    model: deployment_name,
  });

  return completion.choices[0].message?.content || "I couldn't generate a response. Please try again.";
}
