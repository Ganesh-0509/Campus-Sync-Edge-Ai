"""
role_definitions.py — 6 role profiles for synthetic data generation.

Each role has:
  core:       High-probability skills (essential for the role)
  optional:   Medium-probability skills (add strength)
  peripheral: Low-probability skills (nice-to-have / noise)
"""

ROLE_DEFINITIONS: dict[str, dict] = {

    "Frontend Developer": {
        "core":       ["html", "css", "javascript", "react"],
        "optional":   ["typescript", "redux", "next.js"],
        "peripheral": ["firebase", "git", "api"],
    },

    "Backend Developer": {
        "core":       ["python", "java", "sql", "api"],
        "optional":   ["docker", "microservices", "gcp"],
        "peripheral": ["redis", "linux", "git"],
    },

    "Full Stack Developer": {
        "core":       ["javascript", "react", "node.js", "sql"],
        "optional":   ["docker", "aws", "typescript"],
        "peripheral": ["firebase", "git", "api"],
    },

    "Data Scientist": {
        "core":       ["python", "pandas", "numpy", "scikit-learn"],
        "optional":   ["tensorflow", "pytorch", "matplotlib"],
        "peripheral": ["sql", "jupyter", "statistics"],
    },

    "ML Engineer": {
        "core":       ["python", "tensorflow", "pytorch", "mlops"],
        "optional":   ["docker", "kubernetes", "gcp"],
        "peripheral": ["api", "sql", "linux"],
    },

    "DevOps Engineer": {
        "core":       ["docker", "kubernetes", "aws", "linux"],
        "optional":   ["terraform", "gcp", "ci/cd"],
        "peripheral": ["python", "bash", "monitoring"],
    },
}

ROLE_NAMES: list[str] = list(ROLE_DEFINITIONS.keys())
