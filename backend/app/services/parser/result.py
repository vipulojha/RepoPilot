from dataclasses import dataclass

from tree_sitter import Node, Tree


@dataclass(frozen=True)
class ParseWarning:
    message: str
    path: str
    line: int | None = None


@dataclass(frozen=True)
class ParseResult:
    tree: Tree | None
    warnings: list[ParseWarning]
    supported: bool


def warning_for_tree(tree: Tree, path: str) -> list[ParseWarning]:
    warnings: list[ParseWarning] = []
    stack: list[Node] = [tree.root_node]
    while stack:
        node = stack.pop()
        if node.is_error or node.is_missing:
            warnings.append(ParseWarning("syntax error in source", path, node.start_point[0] + 1))
        stack.extend(reversed(node.children))
    return warnings
