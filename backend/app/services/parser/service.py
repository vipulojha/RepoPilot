from tree_sitter import Parser

from app.services.parser.registry import ParserRegistry
from app.services.parser.result import ParseResult, ParseWarning, warning_for_tree


def parse_source(language: str, source: bytes, path: str, max_bytes: int = 2_000_000) -> ParseResult:
    if len(source) > max_bytes:
        return ParseResult(None, [ParseWarning("source exceeds parser size limit", path)], False)
    parser: Parser | None = ParserRegistry().parser_for(language)
    if parser is None:
        return ParseResult(None, [ParseWarning(f"unsupported language: {language}", path)], False)
    try:
        tree = parser.parse(source)
        return ParseResult(tree, warning_for_tree(tree, path), True)
    except Exception as exc:
        return ParseResult(None, [ParseWarning(f"parser failure: {exc}", path)], True)
