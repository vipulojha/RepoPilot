from pathlib import Path

_EXTENSIONS = {
    ".ts": "TypeScript", ".tsx": "TSX", ".js": "JavaScript", ".jsx": "JSX",
    ".py": "Python", ".java": "Java", ".c": "C", ".h": "C", ".cpp": "C++",
    ".cc": "C++", ".hpp": "C++", ".cs": "C#", ".go": "Go", ".rs": "Rust",
    ".php": "PHP", ".html": "HTML", ".css": "CSS", ".scss": "SCSS",
    ".json": "JSON", ".yaml": "YAML", ".yml": "YAML", ".md": "Markdown",
    ".sh": "Shell", ".bash": "Shell", ".zsh": "Shell",
}


def detect_language(name: str) -> str:
    if Path(name).name.lower() == "dockerfile":
        return "Dockerfile"
    return _EXTENSIONS.get(Path(name).suffix.lower(), "Unknown")
