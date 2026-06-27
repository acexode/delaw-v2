"""Smoke test for the retrieval pipeline (spec §5).

Calls POST /internal/search with a Nigerian law query and prints the top 3
results. Requires the service running (`uvicorn src.main:app`) with a populated
`legal_content` table and a reachable database.

Usage:
    python test_pipeline.py
    AI_SERVICE_URL=http://localhost:8000 python test_pipeline.py

Reads AI_SERVICE_SECRET and AI_SERVICE_URL from the environment (or ../../.env).
"""

import os
import sys

import httpx

try:
    from dotenv import load_dotenv

    load_dotenv()
    load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))
except ImportError:
    pass

BASE_URL = os.environ.get("AI_SERVICE_URL", "http://localhost:8000")
SERVICE_SECRET = os.environ.get("AI_SERVICE_SECRET", "")
QUERY = "What is the test for locus standi in Nigerian courts?"


def main() -> int:
    if not SERVICE_SECRET:
        print("AI_SERVICE_SECRET is not set; the request will be rejected with 403.")

    payload = {
        "query": QUERY,
        "jurisdiction": "NG",
        "filters": {},
        "limit": 12,
    }
    headers = {"X-Service-Secret": SERVICE_SECRET}

    print(f"POST {BASE_URL}/internal/search")
    print(f"Query: {QUERY}\n")

    try:
        response = httpx.post(
            f"{BASE_URL}/internal/search",
            json=payload,
            headers=headers,
            timeout=30.0,
        )
    except httpx.HTTPError as exc:
        print(f"Request failed: {exc}")
        return 1

    if response.status_code != 200:
        print(f"Error {response.status_code}: {response.text}")
        return 1

    results = response.json().get("results", [])
    if not results:
        print("No results returned. Is legal_content populated and embedded?")
        return 0

    print(f"Top {min(3, len(results))} of {len(results)} results:\n")
    for rank, result in enumerate(results[:3], start=1):
        print(f"{rank}. {result['title']}")
        print(f"   Citation: {result.get('citation') or 'n/a'}")
        print(f"   Court: {result.get('court') or 'n/a'} ({result.get('year') or 'n.d.'})")
        print(f"   Authority: {result.get('authority_status')}")
        print(
            "   Score: "
            f"{result.get('score'):.4f} "
            f"(semantic={result.get('semantic_score')}, keyword={result.get('keyword_score')})"
        )
        print()
    return 0


if __name__ == "__main__":
    sys.exit(main())
