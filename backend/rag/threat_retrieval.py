import os
from dotenv import load_dotenv
from supabase import create_client, Client
from openai import OpenAI
from typing import List, Dict, Any

# Load .env from project root (backend directory is subdirectory)
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

class ThreatRetriever:
    """Retrieves relevant threat knowledge from the cyber_threats knowledge base using RAG."""
    
    def __init__(self):
        # Initialize OpenAI for embeddings
        self.openai_client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
        
        # Initialize Supabase client
        supabase_url = os.environ.get("SUPABASE_URL")
        supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
        
        if not supabase_url or not supabase_key:
            raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env")
        
        self.supabase: Client = create_client(supabase_url, supabase_key)
    
    def retrieve(self, threat_indicators: Dict[str, Any], top_k: int = 3) -> Dict[str, Any]:
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
        
        if not search_query:
            return {
                "threat_knowledge": [],
                "search_query": "",
                "total_results": 0
            }
        
        # Generate embedding for search query
        query_embedding = self._get_embedding(search_query)
        
        if not query_embedding:
            return {
                "threat_knowledge": [],
                "search_query": search_query,
                "total_results": 0,
                "error": "Failed to generate embedding"
            }
        
        # Perform vector search in Supabase
        results = self._vector_search(query_embedding, top_k)
        
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
        """Generate embedding vector using OpenAI."""
        try:
            response = self.openai_client.embeddings.create(
                input=text,
                model="text-embedding-3-small"
            )
            return response.data[0].embedding
        except Exception as e:
            print(f"Error generating embedding: {e}")
            return []
    
    def _vector_search(self, query_embedding: List[float], top_k: int) -> List[Dict[str, Any]]:
        """Perform vector similarity search in Supabase pgvector."""
        try:
            # Use pgvector cosine similarity search
            response = self.supabase.rpc(
                'match_threats',
                {
                    'query_embedding': query_embedding,
                    'match_threshold': 0.7,
                    'match_count': top_k
                }
            )
            
            if response.data:
                return self._format_results(response.data)
            return []
            
        except Exception as e:
            print(f"Error in vector search: {e}")
            # Fallback to text-based search if vector search fails
            return self._fallback_text_search(query_embedding, top_k)
    
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
    
    def _fallback_text_search(self, query_embedding: List[float], top_k: int) -> List[Dict[str, Any]]:
        """Fallback to simple text-based search if vector search unavailable."""
        try:
            # Simple text search using ILIKE
            response = self.supabase.table("cyber_threats").select("*").limit(top_k).execute()
            
            if response.data:
                return self._format_results(response.data)
            return []
            
        except Exception as e:
            print(f"Error in fallback search: {e}")
            return []


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
