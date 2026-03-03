"""Financial situation memory using BM25 for lexical similarity matching.

Uses BM25 (Best Matching 25) algorithm for retrieval - no API calls,
no token limits, works offline with any LLM provider.
"""

from rank_bm25 import BM25Okapi
from typing import List, Tuple
import re
import numpy as np
from langchain_google_genai import GoogleGenerativeAIEmbeddings


class FinancialSituationMemory:
    """Memory system for storing and retrieving financial situations using BM25."""

    def __init__(self, name: str, config: dict = None):
        """Initialize the memory system.

        Args:
            name: Name identifier for this memory instance
            config: Configuration dict (kept for API compatibility, not used for BM25)
        """
        self.name = name
        self.documents: List[str] = []
        self.recommendations: List[str] = []
        self.bm25 = None
        self.embeddings_model = GoogleGenerativeAIEmbeddings(
            model="models/embedding-001",
            max_retries=5
        )
        self.document_embeddings: List[List[float]] = []

    def _tokenize(self, text: str) -> List[str]:
        """Tokenize text for BM25 indexing.

        Simple whitespace + punctuation tokenization with lowercasing.
        """
        # Lowercase and split on non-alphanumeric characters
        tokens = re.findall(r'\b\w+\b', text.lower())
        return tokens

    def _rebuild_index(self):
        """Rebuild the BM25 index after adding documents."""
        if self.documents:
            tokenized_docs = [self._tokenize(doc) for doc in self.documents]
            self.bm25 = BM25Okapi(tokenized_docs)
        else:
            self.bm25 = None

    def add_situations(self, situations_and_advice: List[Tuple[str, str]]):
        """Add financial situations and their corresponding advice.

        Args:
            situations_and_advice: List of tuples (situation, recommendation)
        """
        for situation, recommendation in situations_and_advice:
            self.documents.append(situation)
            self.recommendations.append(recommendation)
            # Encode situation with Google GenAI Embeddings
            self.document_embeddings.append(self.embeddings_model.embed_query(situation))

        # Rebuild BM25 index with new documents
        self._rebuild_index()

    def get_memories(self, current_situation: str, n_matches: int = 1) -> List[dict]:
        """Find matching recommendations using BM25 similarity.

        Args:
            current_situation: The current financial situation to match against
            n_matches: Number of top matches to return

        Returns:
            List of dicts with matched_situation, recommendation, and similarity_score
        """
        if not self.documents or self.bm25 is None:
            return []

        # Tokenize query for BM25
        query_tokens = self._tokenize(current_situation)
        bm25_scores = self.bm25.get_scores(query_tokens)

        # Get query embedding for Semantic Search
        query_embedding = self.embeddings_model.embed_query(current_situation)

        # Calculate semantic scores (cosine similarity)
        semantic_scores = []
        for doc_emb in self.document_embeddings:
            norm_query = np.linalg.norm(query_embedding)
            norm_doc = np.linalg.norm(doc_emb)
            if norm_query > 0 and norm_doc > 0:
                sim = np.dot(query_embedding, doc_emb) / (norm_query * norm_doc)
            else:
                sim = 0
            semantic_scores.append(sim)

        # Combine scores (normalize both)
        max_bm25 = max(bm25_scores) if max(bm25_scores) > 0 else 1
        max_semantic = max(semantic_scores) if max(semantic_scores) > 0 else 1

        combined_scores = []
        for i in range(len(self.documents)):
            norm_bm25 = bm25_scores[i] / max_bm25
            norm_semantic = semantic_scores[i] / max_semantic
            # Weighting: 50% semantic, 50% BM25 (Hybrid Search)
            combined_scores.append(0.5 * norm_semantic + 0.5 * norm_bm25)

        # Get top-n indices sorted by score (descending)
        top_indices = sorted(range(len(combined_scores)), key=lambda i: combined_scores[i], reverse=True)[:n_matches]

        # Build results
        results = []
        for idx in top_indices:
            results.append({
                "matched_situation": self.documents[idx],
                "recommendation": self.recommendations[idx],
                "similarity_score": combined_scores[idx],
            })

        return results

    def clear(self):
        """Clear all stored memories."""
        self.documents = []
        self.recommendations = []
        self.document_embeddings = []
        self.bm25 = None


if __name__ == "__main__":
    # Example usage
    matcher = FinancialSituationMemory("test_memory")

    # Example data
    example_data = [
        (
            "High inflation rate with rising interest rates and declining consumer spending",
            "Consider defensive sectors like consumer staples and utilities. Review fixed-income portfolio duration.",
        ),
        (
            "Tech sector showing high volatility with increasing institutional selling pressure",
            "Reduce exposure to high-growth tech stocks. Look for value opportunities in established tech companies with strong cash flows.",
        ),
        (
            "Strong dollar affecting emerging markets with increasing forex volatility",
            "Hedge currency exposure in international positions. Consider reducing allocation to emerging market debt.",
        ),
        (
            "Market showing signs of sector rotation with rising yields",
            "Rebalance portfolio to maintain target allocations. Consider increasing exposure to sectors benefiting from higher rates.",
        ),
    ]

    # Add the example situations and recommendations
    matcher.add_situations(example_data)

    # Example query
    current_situation = """
    Market showing increased volatility in tech sector, with institutional investors
    reducing positions and rising interest rates affecting growth stock valuations
    """

    try:
        recommendations = matcher.get_memories(current_situation, n_matches=2)

        for i, rec in enumerate(recommendations, 1):
            print(f"\nMatch {i}:")
            print(f"Similarity Score: {rec['similarity_score']:.2f}")
            print(f"Matched Situation: {rec['matched_situation']}")
            print(f"Recommendation: {rec['recommendation']}")

    except Exception as e:
        print(f"Error during recommendation: {str(e)}")
