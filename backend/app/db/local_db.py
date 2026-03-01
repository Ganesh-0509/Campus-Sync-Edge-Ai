import sqlite3
import json
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime
import os

log = logging.getLogger("db_service")

DB_PATH = os.path.join(os.path.dirname(__file__), "hub.db")

class LocalDBService:
    def __init__(self):
        self._init_db()

    def _init_db(self):
        try:
            with sqlite3.connect(DB_PATH) as conn:
                cursor = conn.cursor()
                # 1. Knowledge Cache
                cursor.execute("""
                CREATE TABLE IF NOT EXISTS knowledge_cache (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    topic TEXT NOT NULL,
                    type TEXT NOT NULL,
                    content TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(topic, type)
                )
                """)
                # 2. User Contributions
                cursor.execute("""
                CREATE TABLE IF NOT EXISTS contributions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    topic TEXT NOT NULL,
                    submitted_by TEXT,
                    content TEXT NOT NULL,
                    status TEXT DEFAULT 'pending',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
                """)
                conn.commit()
                self._seed_data(cursor, conn)
        except Exception as e:
            log.error(f"Failed to init local db: {e}")

    def _seed_data(self, cursor, conn):
        """Seed initial content so users have something to start with."""
        cursor.execute("SELECT count(*) FROM knowledge_cache")
        if cursor.fetchone()[0] == 0:
            # Seed DSA
            dsa_study = {
                "skill": "dsa",
                "quick_summary": "Data Structures and Algorithms form the core of computer science logic. This comprehensive guide details memory structures, network representations, and essential problem-solving algorithms.",
                "estimated_study_time": "120 mins",
                "sub_roadmap": [
                    {"title": "Big O Notation", "duration": "15 mins"},
                    {"title": "Basic Sorting", "duration": "30 mins"},
                    {"title": "Binary Trees", "duration": "45 mins"}
                ],
                "detailed_content": [
                    {
                        "subheading": "1. Big O Notation",
                        "explanation": "Big O notation is used to classify algorithms according to how their run time or space requirements grow as the input size grows. It describes the worst-case scenario. For example, O(1) means constant time, O(n) means linear time (e.g. iterating through an array), and O(n^2) often indicates nested loops.",
                        "algorithm": "Step 1: Identify the largest polynomial term.\nStep 2: Drop all constants.\nStep 3: The remaining term is your Big O complexity.",
                        "example": "def print_all(arr):\n    for item in arr:\n        print(item)",
                        "complexity": "Time Complexity: O(n)\nSpace Complexity: O(1)"
                    },
                    {
                        "subheading": "2. Binary Search",
                        "explanation": "Binary search is an efficient algorithm for finding an item from a sorted list of items. It works by repeatedly dividing in half the portion of the list that could contain the item, until you've narrowed down the possible locations to just one.",
                        "algorithm": "Step 1: Set L = 0 and R = n - 1.\nStep 2: If L > R, the search terminates as unsuccessful.\nStep 3: Set mid = floor((L + R) / 2).\nStep 4: If arr[mid] < target, set L = mid + 1 and go to Step 2.\nStep 5: If arr[mid] > target, set R = mid - 1 and go to Step 2.\nStep 6: If arr[mid] == target, the search is done; return mid.",
                        "example": "def binary_search(arr, target):\n    low, high = 0, len(arr) - 1\n    while low <= high:\n        mid = (low + high) // 2\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            low = mid + 1\n        else:\n            high = mid - 1\n    return -1",
                        "complexity": "Time Complexity: O(log n)\nSpace Complexity: O(1)"
                    },
                    {
                        "subheading": "3. Depth First Search (DFS)",
                        "explanation": "Depth-first search (DFS) is an algorithm for traversing or searching tree or graph data structures. The algorithm starts at the root node and explores as far as possible along each branch before backtracking.",
                        "algorithm": "Step 1: Start at the root (or any arbitrary node).\nStep 2: Mark the current node as visited.\nStep 3: For each adjacent unvisited node, recursively call the DFS function.\nStep 4: Once all paths are exhausted, backtrack by returning.",
                        "example": "def dfs(graph, node, visited=None):\n    if visited is None:\n        visited = set()\n    visited.add(node)\n    print(node)\n    for neighbor in graph[node]:\n        if neighbor not in visited:\n            dfs(graph, neighbor, visited)\n    return visited",
                        "complexity": "Time Complexity: O(V + E)\nSpace Complexity: O(V)"
                    }
                ],
                "pro_tip": "Always write down edge cases before jumping into code during an interview."
            }
            dsa_quiz = {
                "skill": "dsa",
                "questions": [
                    {
                        "id": 1,
                        "question": "What is the time complexity of binary search?",
                        "options": ["O(1)", "O(n)", "O(log n)", "O(n^2)"],
                        "correct_index": 2,
                        "explanation": "Binary search halves the search space at each step."
                    }
                ]
            }
            cursor.execute("INSERT OR IGNORE INTO knowledge_cache (topic, type, content) VALUES (?, ?, ?)", 
                           ('dsa', 'study', json.dumps(dsa_study)))
            cursor.execute("INSERT OR IGNORE INTO knowledge_cache (topic, type, content) VALUES (?, ?, ?)", 
                           ('dsa', 'quiz', json.dumps(dsa_quiz)))
            
            # Seed Node.js
            node_study = {
                "skill": "nodejs",
                "quick_summary": "Node.js is an open-source, cross-platform JS runtime environment based on Chrome's V8 engine.",
                "estimated_study_time": "90 mins",
                "sub_roadmap": [
                    {"title": "Event Loop", "duration": "30 mins"},
                    {"title": "Express Basics", "duration": "60 mins"}
                ],
                "detailed_content": [
                    {
                        "subheading": "1. The Event Loop",
                        "explanation": "The Event Loop is what allows Node.js to perform non-blocking I/O operations despite the fact that JavaScript is single-threaded. By offloading operations to the system kernel whenever possible, Node.js remains highly performant and scalable under heavy load.",
                        "example": "setTimeout(() => console.log('This runs later'), 0);\nconsole.log('This runs first');"
                    },
                    {
                        "subheading": "2. Building with Express",
                        "explanation": "Express.js is a minimal and flexible Node.js web application framework that provides a robust set of features for web and mobile applications. It facilitates the rapid development of Node-based Web applications, taking the hassle out of setting up HTTP servers and routing.",
                        "example": "const express = require('express');\nconst app = express();\napp.get('/', (req, res) => res.send('Hello World!'));\napp.listen(3000);"
                    }
                ],
                "pro_tip": "Use async/await consistently instead of mixing with raw Promises."
            }
            cursor.execute("INSERT OR IGNORE INTO knowledge_cache (topic, type, content) VALUES (?, ?, ?)", 
                           ('nodejs', 'study', json.dumps(node_study)))
            conn.commit()
            log.info("Database seeded with initial course content.")

    # ── Knowledge Methods ──
    def get_knowledge(self, topic: str, type: str) -> Optional[Dict[str, Any]]:
        with sqlite3.connect(DB_PATH) as conn:
            c = conn.cursor()
            c.execute("SELECT content FROM knowledge_cache WHERE topic=? AND type=?", (topic.lower(), type))
            row = c.fetchone()
            if row:
                return json.loads(row[0])
            return None

    def cache_knowledge(self, topic: str, type: str, content: Dict[str, Any]):
        with sqlite3.connect(DB_PATH) as conn:
            c = conn.cursor()
            c.execute("""
                INSERT INTO knowledge_cache (topic, type, content) VALUES (?, ?, ?)
                ON CONFLICT(topic, type) DO UPDATE SET content=excluded.content
            """, (topic.lower(), type, json.dumps(content)))
            conn.commit()
            
    def get_all_topics_count(self) -> int:
        with sqlite3.connect(DB_PATH) as conn:
            c = conn.cursor()
            c.execute("SELECT COUNT(DISTINCT topic) FROM knowledge_cache")
            return c.fetchone()[0]

    # ── Contribution Methods ──
    def add_contribution(self, topic: str, submitted_by: str, content: Dict[str, Any]):
        with sqlite3.connect(DB_PATH) as conn:
            c = conn.cursor()
            c.execute("INSERT INTO contributions (topic, submitted_by, content) VALUES (?, ?, ?)", 
                      (topic.lower(), submitted_by, json.dumps(content)))
            conn.commit()
            
    def get_contributions(self, status: str = 'pending') -> List[Dict[str, Any]]:
        with sqlite3.connect(DB_PATH) as conn:
            conn.row_factory = sqlite3.Row
            c = conn.cursor()
            c.execute("SELECT * FROM contributions WHERE status=? ORDER BY created_at DESC", (status,))
            rows = c.fetchall()
            return [dict(row) for row in rows]
            
    def update_contribution_status(self, id: int, status: str) -> bool:
        with sqlite3.connect(DB_PATH) as conn:
            c = conn.cursor()
            c.execute("UPDATE contributions SET status=? WHERE id=?", (status, id))
            conn.commit()
            return c.rowcount > 0

    def get_contribution_by_id(self, id: int) -> Optional[Dict[str, Any]]:
        with sqlite3.connect(DB_PATH) as conn:
            conn.row_factory = sqlite3.Row
            c = conn.cursor()
            c.execute("SELECT * FROM contributions WHERE id=?", (id,))
            row = c.fetchone()
            return dict(row) if row else None

local_db = LocalDBService()
