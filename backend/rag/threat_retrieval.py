import os
import json
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client
from typing import List, Dict, Any

# Load backend/.env consistently when this module is executed directly.
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
env_path = os.path.join(backend_dir, '.env')
load_dotenv(env_path)

class ThreatRetriever:
    """Retrieves relevant threat knowledge from the cyber_threats knowledge base using RAG."""
    
    def __init__(self):
        self.hf_model = None
        self.openai_client = None
        
        # Initialize Supabase client
        supabase_url = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
        supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_SERVICE_KEY")
        
        self.supabase = None
        if supabase_url and supabase_key and "your-project" not in supabase_url:
            try:
                self.supabase: Client = create_client(supabase_url, supabase_key)
            except Exception as e:
                print(f"Warning: Supabase client init failed in ThreatRetriever: {e}")
    
    def retrieve(self, threat_indicators: Dict[str, Any], top_k: int = 3, channel: str = "email") -> Dict[str, Any]:
        """
        Retrieve relevant threat knowledge based on detected threat indicators.
        
        Args:
            threat_indicators: Dictionary of threat indicators from ThreatExtractor
            top_k: Number of top results to retrieve
            
        Returns:
            Dictionary with retrieved threat knowledge and context
        """
        # Build search query from threat indicators
        search_query = self._build_search_query(threat_indicators)
        channel_terms = {
            "cloud_oauth": "oauth illicit consent application permissions",
            "voice_phone": "vishing impersonation phone callback",
            "slack_teams": "chat messaging impersonation",
            "qr_code": "qr quishing phishing",
            "sms_push": "mfa push fatigue authentication",
            "physical_media": "usb removable media",
        }
        search_query = f"{search_query} {channel_terms.get(channel, '')}".strip()
        
        if not search_query:
            return {
                "threat_knowledge": [],
                "search_query": "",
                "total_results": 0
            }
        
        # Generate an embedding with the same local model used by the seed script.
        query_embedding = self._get_embedding(search_query)

        results = []
        if query_embedding and self.supabase:
            results = self._vector_search(query_embedding, top_k)
        if not results:
            results = self._fallback_text_search(search_query, top_k)
        
        return {
            "threat_knowledge": results,
            "search_query": search_query,
            "total_results": len(results)
        }
    
    def _build_search_query(self, threat_indicators: Dict[str, Any]) -> str:
        """Build a search query from threat indicators."""
        query_parts = []
        
        # Add detected threat types
        for threat_type, indicators in threat_indicators.items():
            if indicators and len(indicators) > 0:
                if threat_type == "financial_requests":
                    query_parts.append("financial request wire transfer payment")
                elif threat_type == "urgency_indicators":
                    query_parts.append("urgency pressure immediate action")
                elif threat_type == "authority_abuse":
                    query_parts.append("authority impersonation CEO fraud")
                elif threat_type == "spoofed_domains":
                    query_parts.append("domain spoofing fake email")
                elif threat_type == "suspicious_urls":
                    query_parts.append("phishing link malicious URL")
                elif threat_type == "attachment_requests":
                    query_parts.append("malicious attachment email virus")
        
        return " ".join(query_parts) if query_parts else ""
    
    def _get_embedding(self, text: str) -> List[float]:
        """Generate a query vector compatible with the configured seed provider."""
        try:
            if self.hf_model is None:
                from sentence_transformers import SentenceTransformer
                self.hf_model = SentenceTransformer("all-MiniLM-L6-v2")
            vector = self.hf_model.encode(text).tolist()
            return vector + [0.0] * (1536 - len(vector)) if len(vector) < 1536 else vector[:1536]
        except Exception as e:
            try:
                if self.openai_client is None:
                    from openai import OpenAI
                    api_key = os.environ.get("OPENAI_API_KEY", "").strip()
                    if not api_key:
                        return []
                    self.openai_client = OpenAI(api_key=api_key)
                response = self.openai_client.embeddings.create(
                    model="text-embedding-3-small",
                    input=text,
                )
                return response.data[0].embedding
            except Exception as openai_error:
                print(f"Notice: threat embedding unavailable, using keyword retrieval: {openai_error or e}")
                return []
    
    def _vector_search(self, query_embedding: List[float], top_k: int) -> List[Dict[str, Any]]:
        """Perform vector similarity search in Supabase pgvector."""
        try:
            # Use pgvector cosine similarity search
            response = self.supabase.rpc(
                'match_threats',
                {
                    'query_embedding': query_embedding,
                    'match_threshold': 0.35,
                    'match_count': top_k
                }
            ).execute()
            
            if response.data:
                return self._format_results(response.data)
            return []
            
        except Exception as e:
            print(f"Error in vector search: {e}")
            # Fallback to text-based search if vector search fails
            return []
    
    def _format_results(self, raw_results: List[Dict]) -> List[Dict[str, Any]]:
        """Format raw database results into clean output."""
        formatted = []
        for result in raw_results:
            formatted.append({
                "category": result.get("category"),
                "source": result.get("source"),
                "content": result.get("content"),
                "metadata": result.get("metadata", {}),
                "similarity": result.get("similarity", 0.0)
            })
        return formatted
    
    def _fallback_text_search(self, search_query: str, top_k: int) -> List[Dict[str, Any]]:
        """Rank the checked-in curated threat corpus when pgvector is unavailable."""
        data_path = Path(__file__).resolve().parent.parent / "scripts" / "data" / "threat_chunks.json"
        try:
            records = json.loads(data_path.read_text(encoding="utf-8"))
        except Exception as e:
            print(f"Error loading local threat corpus: {e}")
            return []

        tokens = {token for token in search_query.lower().replace("_", " ").split() if len(token) > 3}
        ranked = []
        for record in records:
            haystack = " ".join([
                str(record.get("category", "")),
                str(record.get("source", "")),
                str(record.get("content", "")),
                json.dumps(record.get("metadata", {})),
            ]).lower()
            score = sum(1 for token in tokens if token in haystack)
            ranked.append((score, record))
        ranked.sort(key=lambda item: item[0], reverse=True)
        results = []
        for score, record in ranked[:top_k]:
            if score <= 0:
                continue
            normalized = dict(record)
            normalized["source"] = normalized.get("source") or normalized.get("metadata", {}).get("source")
            normalized["similarity"] = None
            results.append(normalized)
        return results


# Example usage and testing
if __name__ == "__main__":
    retriever = ThreatRetriever()
    
    # Test with sample threat indicators
    test_indicators = {
        "financial_requests": [
            {"keyword": "wire transfer", "context": "process this wire transfer", "confidence": 0.7}
        ],
        "urgency_indicators": [
            {"keyword": "immediately", "context": "process immediately", "confidence": 0.75}
        ],
        "authority_abuse": [
            {"keyword": "ceo", "context": "From: ceo@", "confidence": 0.65}
        ],
        "spoofed_domains": [],
        "suspicious_urls": [],
        "attachment_requests": []
    }
    
    result = retriever.retrieve(test_indicators)
    print("Threat Knowledge Retrieval Result:")
    print(f"Search Query: {result['search_query']}")
    print(f"Total Results: {result['total_results']}")
    print("\nRetrieved Threat Knowledge:")
    for i, knowledge in enumerate(result['threat_knowledge'], 1):
        print(f"\n{i}. Category: {knowledge['category']}")
        print(f"   Source: {knowledge['source']}")
        print(f"   Content: {knowledge['content'][:100]}...")
        print(f"   Similarity: {knowledge.get('similarity', 'N/A')}")
