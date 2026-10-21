# backend/tests/conftest.py
"""Pytest fixtures for Track B ERP Navigator Backend QA testing."""
import pytest
from fastapi.testclient import TestClient
from apps.ml.src.main import app as ml_app


@pytest.fixture
def test_client():
    """Provides a TestClient for FastAPI endpoints."""
    return TestClient(ml_app)


@pytest.fixture
def mock_model_runner():
    """Mock runner simulating local LLM generation without requiring physical GPU."""
    class MockModelRunner:
        def generate_sql(self, prompt: str) -> str:
            if "DROP" in prompt or "امسح" in prompt:
                return "DROP TABLE Customers;"
            return "SELECT ProductID, Name, ListPrice FROM Production.Product;"

        def synthesize_answer(self, query: str, data: list) -> str:
            return "إجمالي المنتجات المتاحة هو 5 منتجات."

    return MockModelRunner()
