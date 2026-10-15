import re
from dataclasses import dataclass

from sqlalchemy import text
from sqlalchemy.orm import Session

@dataclass(frozen=True)
class SearchHit:
    result_type: str
    file_id: int
    symbol_id: int | None
    path: str
    name: str
    language: str | None
    line: int | None
    snippet: str
    rank: float

def sanitize_query(query: str) -> str:
    tokens = re.findall(r"[\w./@#$+-]+", query.strip(), flags=re.UNICODE)
    if not tokens: raise ValueError("Search query must contain searchable text")
    return " AND ".join(f'"{token.replace(chr(34), chr(34) * 2)}"' for token in tokens)

def index_document(db: Session, snapshot_id: int, entity_type: str, file_id: int, path: str, name: str, content: str, symbol_id: int | None = None):
    db.execute(text("""CREATE VIRTUAL TABLE IF NOT EXISTS search_documents USING fts5(
        snapshot_id UNINDEXED, entity_type UNINDEXED, file_id UNINDEXED,
        symbol_id UNINDEXED, path, name, content,
        tokenize='unicode61 remove_diacritics 1'
    )"""))
    db.execute(text("INSERT INTO search_documents(snapshot_id, entity_type, file_id, symbol_id, path, name, content) VALUES (:snapshot, :type, :file, :symbol, :path, :name, :content)"), {"snapshot": snapshot_id, "type": entity_type, "file": file_id, "symbol": symbol_id, "path": path, "name": name, "content": content})

def search_documents(db: Session, snapshot_id: int, query: str, scope: str = "all", limit: int = 50, cursor: int = 0):
    match = sanitize_query(query)
    scope_clause = "" if scope == "all" else "AND entity_type = :scope"
    scope_value = "symbol" if scope == "symbols" else "file" if scope in {"files", "content"} else scope
    rows = db.execute(text(f"""SELECT rowid, entity_type, file_id, symbol_id, path, name,
        snippet(search_documents, 6, '<mark>', '</mark>', '…', 12) AS snippet, bm25(search_documents) AS score
        FROM search_documents WHERE search_documents MATCH :match {scope_clause}
        ORDER BY CASE entity_type WHEN 'symbol' THEN 0 WHEN 'file' THEN 1 ELSE 2 END, score, rowid
        LIMIT :limit OFFSET :cursor"""), {"match": match, "scope": scope_value, "limit": limit + 1, "cursor": cursor}).mappings().all()
    return rows[:limit], len(rows) > limit
