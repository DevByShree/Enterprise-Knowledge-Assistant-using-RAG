from langchain_chroma import Chroma
from langchain_ollama import OllamaEmbeddings
from langchain_ollama import ChatOllama


#Load Embedding Model
embeddings = OllamaEmbeddings(
    model="nomic-embed-text"
)
#Load ChromaDB
vector_store = Chroma(
    persist_directory="chroma_db",
    embedding_function=embeddings
)
#Create Retriever
retriever = vector_store.as_retriever(
    search_type="similarity",
    search_kwargs={"k": 3}
)
#Load Llama 3.2
llm = ChatOllama(
    model="llama3.2:1b"
)

#  This is for only terminal 
# # Take input
# query = input("Ask a question: ")

# #Retrieve Relevant Chunks
# results = retriever.invoke(query)

# context = "\n\n".join(
#     [doc.page_content for doc in results]
# )

# prompt = f"""
# You are a helpful AI assistant.

# Answer the user's question only using the provided context.

# Context:
# {context}

# Question:
# {query}

# Answer:
# """

# response = llm.invoke(prompt)

# print("\nAnswer:")
# print(response.content)



def ask_rag(query):

    print("Question:", query)

    results = retriever.invoke(query)

    print("Retrieved docs:", len(results))

    context = "\n\n".join(
        [doc.page_content for doc in results]
    )
    prompt = f"""
    You are a helpful AI assistant.

    Answer the user's question only using the provided context.

    Context:
    {context}

    Question:
    {query}

    Answer:
    """

    response = llm.invoke(prompt)
    
    return response.content
if __name__ == "__main__":
            
    query = input("Ask a question: ")
    answer = ask_rag(query)

    print(answer)