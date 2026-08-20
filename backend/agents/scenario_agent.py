import os
from dotenv import load_dotenv
from openai import OpenAI
import json

# Load environment variables from .env file
load_dotenv()

# Initialize OpenAI client
client = OpenAI(
    api_key=os.environ.get("OPENAI_API_KEY", "dummy_key_for_testing"),
)

def generate_scenario(role: str, difficulty: str, org_context: str) -> str:
    prompt = f"""
    You are a cybersecurity training simulator.
    Generate a {difficulty} phishing scenario for a {role}.
    Make it realistic by incorporating this company context: {org_context}
    Output ONLY in JSON format with exactly these keys: 'scenario_text', 'choices', 'threat_type'.
    Ensure that no actual malicious links are generated.
    """
    
    response = client.chat.completions.create(
        messages=[
            {"role": "system", "content": prompt}
        ],
        model="gpt-4o-mini", # Lowest cost OpenAI model
        response_format={"type": "json_object"}
    )
    
    return response.choices[0].message.content
