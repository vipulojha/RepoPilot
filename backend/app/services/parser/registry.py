from dataclasses import dataclass
from typing import Callable

from tree_sitter import Language, Parser
import tree_sitter_java
import tree_sitter_javascript
import tree_sitter_python
import tree_sitter_typescript


@dataclass(frozen=True)
class Grammar:
    language: str
    factory: Callable[[], object]


GRAMMARS = {
    "Python": Grammar("Python", tree_sitter_python.language),
    "JavaScript": Grammar("JavaScript", tree_sitter_javascript.language),
    "JSX": Grammar("JSX", tree_sitter_javascript.language),
    "TypeScript": Grammar("TypeScript", tree_sitter_typescript.language_typescript),
    "TSX": Grammar("TSX", tree_sitter_typescript.language_tsx),
    "Java": Grammar("Java", tree_sitter_java.language),
}


class ParserRegistry:
    def parser_for(self, language: str) -> Parser | None:
        grammar = GRAMMARS.get(language)
        if grammar is None:
            return None
        parser = Parser(Language(grammar.factory()))
        return parser
