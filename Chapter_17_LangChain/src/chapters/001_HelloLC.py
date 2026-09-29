from dotenv import load_dotenv
from langchain_groq import ChatGroq
import os

load_dotenv()

def main():
    llm = ChatGroq(model=os.getenv("LLM_MODEL"),temperature=1, api_key=os.getenv("GROG_API_KEY"))
    query = input("Enter the question: ")
    response = llm.invoke(query)
    print("Response:", response.content)

if __name__ == "__main__":
    main()