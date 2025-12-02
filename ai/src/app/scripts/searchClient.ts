import { SearchClient, AzureKeyCredential } from "@azure/search-documents"

const searchClient = new SearchClient(
  process.env.AZURE_SEARCH_ENDPOINT!,
  "index-project-pulse",
  new AzureKeyCredential(process.env.AZURE_SEARCH_API_KEY!)
);

export default searchClient