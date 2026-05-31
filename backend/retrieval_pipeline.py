from langchain_chroma import Chroma
from langchain_ollama import OllamaEmbeddings

# Fetch embeddings 
embeddings = OllamaEmbeddings(
    model = "nomic-embed-text"
)

# Load existing ChromaDB

vector_store = Chroma(
    persist_directory="chroma_db",
    embedding_function=embeddings
)
retriever = vector_store.as_retriever(
    search_type="similarity",
    search_kwargs={"k": 1} #  search time top 5 results 
)

print("Starting Retrieval...")

query = input("Ask a Question:")
results = retriever.invoke(query)

print(f"Number of results: {len(results)}")


for i ,doc in enumerate(results):
    print(f"\nResult {i+1}")
    print("-" * 50)
    print(doc.page_content[:500])