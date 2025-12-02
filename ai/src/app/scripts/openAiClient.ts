import OpenAI from "openai";
import env from "./env";

// Follow Microsoft Foundry pattern with proper baseURL format
const endpoint = `${env.AZURE_OPENAI_ENDPOINT}/openai/v1`;
const deployment_name = env.AZURE_OPENAI_MODEL;
const api_key = env.AZURE_OPENAI_API_KEY;

const openAiClient = new OpenAI({
  baseURL: endpoint,
  apiKey: api_key
});

export { openAiClient, deployment_name };
export default openAiClient;