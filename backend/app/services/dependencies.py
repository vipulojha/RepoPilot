from dataclasses import dataclass
from pathlib import PurePosixPath
from tree_sitter import Node

@dataclass(frozen=True)
class DependencyData:
    imported_name: str
    kind: str
    line: int
    column: int
    evidence: str

def extract_dependencies(root: Node, source: bytes, language: str) -> list[DependencyData]:
    result: list[DependencyData] = []
    def walk(node: Node):
        supported = language in {"JavaScript", "JSX", "TypeScript", "TSX"} and node.type in {"import_statement", "export_statement"}
        supported = supported or language == "Python" and node.type in {"import_statement", "import_from_statement"}
        supported = supported or language == "Java" and node.type == "import_declaration"
        if supported:
            text = source[node.start_byte:node.end_byte].decode("utf-8", errors="replace")
            name = None
            for child in node.children:
                if child.type in {"string", "string_fragment", "dotted_name"}:
                    name = source[child.start_byte:child.end_byte].decode("utf-8", errors="replace").strip("'\"")
                    if name: break
            if name: result.append(DependencyData(name, "import", node.start_point[0], node.start_point[1], text[:500]))
        for child in node.children: walk(child)
    walk(root)
    return result

def resolve_dependency(dep: DependencyData, source_path: str, language: str, paths: set[str]) -> tuple[str, str | None]:
    name = dep.imported_name; candidates: list[str] = []
    if language in {"JavaScript", "JSX", "TypeScript", "TSX"} and name.startswith("."):
        base = PurePosixPath(source_path).parent / name
        candidates = [base.as_posix(), *[f"{base.as_posix()}{ext}" for ext in (".ts", ".tsx", ".js", ".jsx")], f"{base.as_posix()}/index.ts", f"{base.as_posix()}/index.tsx", f"{base.as_posix()}/index.js"]
    elif language == "Python":
        candidates = [name.replace(".", "/") + suffix for suffix in (".py", "/__init__.py")]
    elif language == "Java":
        candidates = [name.replace(".", "/") + ".java"]
    if any(candidate in paths for candidate in candidates):
        return "internal", next(candidate for candidate in candidates if candidate in paths)
    return ("external", None) if name and not name.startswith(".") else ("unresolved", None)
