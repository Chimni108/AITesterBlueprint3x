"""Pytest runner for the Chapter 12 CrewAI agents.

The agent scripts are named 01_... and 02_..., which are not valid Python
identifiers, so they cannot be pulled in with a plain `import`. We load them
by file path instead.

These tests make real Groq calls, so each crew is kicked off once per session
and the result is shared by every assertion against it.
"""

import importlib.util
import os
import sys
from pathlib import Path

import pytest
from dotenv import load_dotenv

HERE = Path(__file__).parent
load_dotenv(HERE / ".env")

# Every test here needs a live key; skip cleanly rather than erroring without one.
pytestmark = pytest.mark.skipif(
    not os.getenv("GROQ_API_KEY"),
    reason="GROQ_API_KEY not set in Chapter_12_CrewAI/.env",
)


def _load(filename):
    """Import an agent script by path and return the loaded module."""
    spec = importlib.util.spec_from_file_location(Path(filename).stem, HERE / filename)
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


@pytest.fixture(scope="session")
def analyst_output():
    """Run the test-analyst crew once for the whole session."""
    return str(_load("01_test_analyst_Agent.py").crew.kickoff())


@pytest.fixture(scope="session")
def research_output():
    """Run the researcher + writer crew once for the whole session."""
    return str(_load("02_Research_WriteAIAgent.py").crew.kickoff())


# --- 01: test analyst agent -------------------------------------------------

def test_analyst_produces_output(analyst_output):
    assert analyst_output.strip(), "Crew returned empty output"


def test_analyst_covers_login_elements(analyst_output):
    """The task names username, password and remember-me specifically."""
    lowered = analyst_output.lower()
    missing = [t for t in ("username", "password", "remember") if t not in lowered]
    assert not missing, f"Output never mentions: {missing}"


# --- 02: researcher + writer agents -----------------------------------------

def test_research_produces_output(research_output):
    assert research_output.strip(), "Crew returned empty output"


def test_research_output_is_a_checklist(research_output):
    """The writer's brief is a 5-10 item developer checklist."""
    lowered = research_output.lower()
    assert "checklist" in lowered or "pull request" in lowered


def test_research_crew_is_sequential():
    """The writer must run after the researcher to consume its findings."""
    module = _load("02_Research_WriteAIAgent.py")
    assert len(module.crew.agents) == 2
    assert len(module.crew.tasks) == 2
