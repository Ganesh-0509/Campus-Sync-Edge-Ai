import logging
import json
from typing import Optional, Dict, Any
from app.db.local_db import local_db

log = logging.getLogger("ai_service")

class KnowledgeService:
    def get_cached_knowledge(self, topic: str, type: str = "study") -> Optional[Dict[str, Any]]:
        """
        Retrieves cached AI content (notes or quiz) from local DB.
        type: 'study' or 'quiz'
        """
        try:
            content = local_db.get_knowledge(topic, type)
            if content:
                log.info(f"Local Cache HIT for {topic} ({type})")
                return content
        except Exception as e:
            log.warning(f"Knowledge cache read error: {e}")
        
        return None

    def cache_knowledge(self, topic: str, content: Dict[str, Any], type: str = "study"):
        """
        Stores AI content in local DB knowledge_cache table.
        """
        try:
            local_db.cache_knowledge(topic, type, content)
            log.info(f"Cached {topic} ({type}) to local DB")
        except Exception as e:
            log.error(f"Knowledge cache write error: {e}")

knowledge_service = KnowledgeService()
