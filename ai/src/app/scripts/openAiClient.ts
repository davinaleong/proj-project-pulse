import OpenAI from "openai";
import env from "./env";

const openAiClient = new OpenAI({
  baseURL: env.AZURE_OPENAI_ENDPOINT,
  apiKey: env.AZURE_OPENAI_API_KEY
});

export default openAiClient;