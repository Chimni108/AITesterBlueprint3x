#from email.mime import message

from dotenv import load_dotenv
from langchain.agents import create_agent
import os

load_dotenv()

def main():
    print("Welcome to the first Gemini Agent! \n")
    agent = create_agent(model=os.getenv("LLM_GEMINI_MODEL"))
    query = input("Enter the question: ")
    result = agent.invoke({
        "messages": [
            {"role": "user", "content": query}
            ]
    })
  #  final_message = result["messages"][-1]
   # print("Agent Response:", final_message.content)
    print(result["messages"][-1].text)
if __name__ == "__main__":
    main()
