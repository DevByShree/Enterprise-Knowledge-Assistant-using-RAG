# LangChain core
from langchain_openai import ChatOpenAI
# PDF Loader
from langchain_community.document_loaders import PyPDFLoader
# Text Splitter
from langchain_text_splitters import RecursiveCharacterTextSplitter
# Chroma Vector Database
from langchain_chroma import Chroma
# Embeddings
from langchain_ollama import OllamaEmbeddings
# Text File Loader
from langchain_community.document_loaders import DirectoryLoader, TextLoader
import os
from langchain_ollama import OllamaEmbeddings

# Load Files
def load_documents(docs_path="docs"):
    print(f"Loading the documents from {docs_path}...")

    # Check if docs folder exists
    if not os.path.exists(docs_path):
        raise FileNotFoundError(
            f"The directory {docs_path} does not exist. Please create it and add your company files."
        )

    # Load all .txt files
    loader = DirectoryLoader(
        path=docs_path,
        glob="*.txt",
        loader_cls=TextLoader,
        loader_kwargs={'encoding':"utf-8"}
    )

    documents = loader.load()

    # Check if documents were loaded
    if len(documents) == 0:
        raise FileNotFoundError(
            f"No .txt files found in {docs_path}. Please add your company details."
        )

    # Preview first 2 documents
    for i, doc in enumerate(documents[:2]):
        print(f"\nDocument {i+1}:")
        print(f"  Source: {doc.metadata['source']}")
        print(f"  Content length: {len(doc.page_content)} characters")
        print(f"  Content preview: {doc.page_content[:100]}...")
        print(f"  Metadata: {doc.metadata}")

    return documents


def main():
    documents = load_documents()

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size =1000,
        chunk_overlap=200
    )
    chunks = text_splitter.split_documents(documents)
    with open("chunks.txt", "w", encoding="utf-8") as f:
        for i, chunk in enumerate(chunks):
            f.write(f"\n{'='*50}\n")
            f.write(f"CHUNK {i+1}\n")
            f.write(f"{'='*50}\n")
            f.write(chunk.page_content)
            f.write("\n")
    print(f"Total Chunks:{len(chunks)}")

    # Embeddings

    embeddings = OllamaEmbeddings(
        model="nomic-embed-text"    
        
    )
    print("Embeding is Done Bro ")

    # chromaDB it is a vector Database
    vector_store=Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory="chroma_db"
    )
    print("Vector DB created succesfully!")

if __name__ == "__main__":
    main()