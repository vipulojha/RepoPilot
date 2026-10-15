from dataclasses import dataclass

from tree_sitter import Node


@dataclass(frozen=True)
class SymbolData:
    kind: str
    name: str
    qualified_name: str
    parent_name: str | None
    start_line: int
    start_column: int
    end_line: int
    end_column: int
    signature: str | None


DECLARATIONS = {
    "class_definition": "class", "class_declaration": "class", "interface_declaration": "interface",
    "type_alias_declaration": "type", "enum_declaration": "enum", "enum_declaration": "enum",
    "function_definition": "function", "function_declaration": "function", "method_definition": "method",
    "method_declaration": "method", "constructor_declaration": "constructor", "module": "module",
    "namespace_declaration": "namespace", "lexical_declaration": "type",
}


def _name(node: Node, source: bytes) -> str | None:
    for field in ("name", "declarator", "left"):
        child = node.child_by_field_name(field)
        if child and child.type in {"identifier", "type_identifier", "property_identifier", "shorthand_property_identifier_pattern"}:
            return source[child.start_byte:child.end_byte].decode("utf-8", errors="replace")
    for child in node.children:
        if child.type in {"identifier", "type_identifier", "property_identifier"}:
            return source[child.start_byte:child.end_byte].decode("utf-8", errors="replace")
    return None


def extract_symbols(root: Node, source: bytes) -> list[SymbolData]:
    results: list[SymbolData] = []

    def visit(node: Node, parents: list[str]) -> None:
        kind = DECLARATIONS.get(node.type)
        current = parents
        if kind:
            name = _name(node, source)
            if name:
                qualified = ".".join([*parents, name])
                results.append(SymbolData(kind, name, qualified, ".".join(parents) if parents else None, node.start_point[0], node.start_point[1], node.end_point[0], node.end_point[1], source[node.start_byte:min(node.end_byte, node.start_byte + 240)].decode("utf-8", errors="replace").splitlines()[0]))
                current = [*parents, name]
        for child in node.children:
            visit(child, current)

    visit(root, [])
    seen: set[tuple[str, str, int, int]] = set()
    unique: list[SymbolData] = []
    for item in results:
        key = (item.kind, item.qualified_name, item.start_line, item.start_column)
        if key not in seen:
            seen.add(key)
            unique.append(item)
    return unique
