from pathlib import Path
from app.services.dependencies import extract_dependencies, resolve_dependency
from app.services.parser.service import parse_source

def test_typescript_relative_dependency_resolves():
    source = b"import { User } from './user';\n"
    parsed = parse_source("TypeScript", source, "src/main.ts")
    deps = extract_dependencies(parsed.tree.root_node, source, "TypeScript")
    assert deps[0].imported_name == "./user"
    assert resolve_dependency(deps[0], "src/main.ts", "TypeScript", {"src/main.ts", "src/user.ts"}) == ("internal", "src/user.ts")

def test_external_and_unresolved_are_distinct():
    source = b"import x from 'react';\nimport y from './missing';\n"
    parsed = parse_source("JavaScript", source, "src/main.js")
    deps = extract_dependencies(parsed.tree.root_node, source, "JavaScript")
    statuses = [resolve_dependency(dep, "src/main.js", "JavaScript", {"src/main.js"})[0] for dep in deps]
    assert statuses == ["external", "unresolved"]
