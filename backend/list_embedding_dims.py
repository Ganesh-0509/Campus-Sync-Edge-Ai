import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

print("Embedding models available:")
for m in genai.list_models():
    if 'embedContent' in m.supported_generation_methods:
        try:
            # Try to get dimension
            res = genai.embed_content(model=m.name, content="test", task_type="retrieval_query")
            dim = len(res['embedding'])
            print(f"Model: {m.name} | Dimension: {dim}")
        except:
            print(f"Model: {m.name} | Could not embed")
