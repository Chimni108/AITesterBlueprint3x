# Test Ananlyst Agent
# 
# a senior QA with 15 years (JIRA MD)
#  of experience. Based on the feature, 
# it will just analyze the requirement
# and suggest a 5-10 testcases(p0 testcases).

from crewai import Agent,Task,Crew
from crewai import LLM
from dotenv import load_dotenv
from pathlib import Path
import os
import sys

# Windows consoles default to cp1252, which cannot print the emoji and typographic
# characters CrewAI and the model emit. Force UTF-8 so output does not crash.
# The hasattr guard matters under pytest, whose captured streams are not real files.
for _stream in (sys.stdout, sys.stderr):
    if hasattr(_stream, "reconfigure"):
        _stream.reconfigure(encoding="utf-8", errors="replace")

# By Default crew AI actually the brain which
# OpenAI - GROQ API Key


# Step 0 - Set up the Brain
# Step 1. - Define the Agent (identity)
# Step 2. - Give the Task to the Agent
# Step 3. Add them to the Crew
# Step 4. Kick Off Agent.

# Prompt vs Skill vs AI Agent

# We need use the GROQ gpt-oss-120b model


# Step 0 - Set up the Brain (Groq LLM)
# Read GROQ_API_KEY / GROQ_MODEL / GROQ_BASE_URL from the .env sitting next to this file,
# so it works no matter which directory you run the script from.
load_dotenv(Path(__file__).parent / ".env")

api_key = os.getenv("GROQ_API_KEY")
if not api_key:
    raise RuntimeError("GROQ_API_KEY is missing. Add it to Chapter_12_CrewAI/.env")

# Groq has no native CrewAI provider, but it speaks the OpenAI API. So we use the
# "openai" provider and simply point base_url at Groq. That is why the model id
# carries two prefixes: "openai/" (the provider) + "openai/gpt-oss-120b" (Groq's model).
groq_llm = LLM(
    model=os.getenv("GROQ_MODEL", "openai/openai/gpt-oss-120b"),
    api_key=api_key,
    base_url=os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1"),
    temperature=0.7,
)

# Step 1. - Define the Agent (identity)
qa_agent = Agent(
    role="QA Engineer",
        goal="Analyse the feature or the requirements, and create 5-10 test cases out of it.",
        backstory="You are a senior QA engineer with 15 years of experience in test planning and testcases creation",
        llm = groq_llm,
        verbose=True
)

# Step 2. - Give the Task to the Agent
test_case_task = Task(
    description="Create 5-10 test cases",
    expected_output="A numbered list of 5-10 test cases with brief descriptions for a app.vwo.com Login page with the username, password and submit button with remember me functionality",
    agent=qa_agent
)

# Step 3. Add them to the Crew
crew = Crew(
    agents=[qa_agent],
    tasks=[test_case_task],
    verbose=True
)

# Step 4. kickOff
if __name__ == "__main__":
    result = crew.kickoff()
    print(result)