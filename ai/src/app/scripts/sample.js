import OpenAI from "openai";

const endpoint = "https://aoai-project-pulse.openai.azure.com/openai/v1";
const deployment_name = "gpt-4.1-mini";
const api_key = "<your-api-key>";

const client = new OpenAI({
    baseURL: endpoint,
    apiKey: api_key
});

async function main() {
  const completion = await client.chat.completions.create({
    messages: [
      { role: "developer", content: "You talk like a pirate." },
      { role: "user", content: "Can you help me?" }
    ],
    model: deployment_name,
  });

  console.log(completion.choices[0]);
}

main();