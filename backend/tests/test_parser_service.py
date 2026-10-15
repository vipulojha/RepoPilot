from app.services.parser.extractor import extract_symbols
from app.services.parser.service import parse_source


def test_python_symbols_and_hierarchy():
    source = b"class User:\n    def get(self):\n        return 1\n"
    result = parse_source("Python", source, "user.py")
    symbols = extract_symbols(result.tree.root_node, source)
    assert [(item.kind, item.qualified_name) for item in symbols] == [("class", "User"), ("function", "User.get")]


def test_malformed_source_warns_without_failure():
    result = parse_source("TypeScript", b"class Broken {", "broken.ts")
    assert result.supported is True
    assert result.tree is not None
    assert result.warnings


def test_unsupported_language_is_safe():
    result = parse_source("Unknown", b"hello", "README.md")
    assert result.tree is None
    assert result.supported is False
