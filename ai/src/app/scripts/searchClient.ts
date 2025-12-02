import { SearchClient, AzureKeyCredential } from "@azure/search-documents";
import env from "./env";

const searchClient = new SearchClient(
  env.AZURE_SEARCH_ENDPOINT,
  env.AZURE_SEARCH_INDEX_NAME,
  new AzureKeyCredential(env.AZURE_SEARCH_API_KEY)
);

export default searchClient