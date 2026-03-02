import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

text = "Hello world"
model = "models/gemini-embedding-001"
res = genai.embed_content(model=model, content=text, task_type="retrieval_document")
embedding = res['embedding']
print(f"Model: {model}")
print(f"Dimension: {len(embedding)}")
