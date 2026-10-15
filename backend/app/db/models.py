from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class Repository(Base):
    __tablename__ = "repositories"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    path: Mapped[str] = mapped_column(String(2048), nullable=False, unique=True, index=True)
    branch: Mapped[str] = mapped_column(String(255), nullable=False, default="main")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    snapshots: Mapped[list["ScanSnapshot"]] = relationship(
        back_populates="repository", cascade="all, delete-orphan"
    )


class ScanSnapshot(Base):
    __tablename__ = "scan_snapshots"
    __table_args__ = ()

    id: Mapped[int] = mapped_column(primary_key=True)
    repository_id: Mapped[int] = mapped_column(ForeignKey("repositories.id"), index=True)
    status: Mapped[str] = mapped_column(String(20), default="queued", index=True)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    error_message: Mapped[str | None] = mapped_column(Text)
    file_count: Mapped[int] = mapped_column(Integer, default=0)
    total_bytes: Mapped[int] = mapped_column(Integer, default=0)
    total_lines: Mapped[int] = mapped_column(Integer, default=0)
    processed_files: Mapped[int] = mapped_column(Integer, default=0)
    discovered_files: Mapped[int] = mapped_column(Integer, default=0)
    warning_count: Mapped[int] = mapped_column(Integer, default=0)
    warnings_json: Mapped[str] = mapped_column(Text, default="[]")

    repository: Mapped[Repository] = relationship(back_populates="snapshots")
    files: Mapped[list["RepositoryFile"]] = relationship(
        back_populates="snapshot", cascade="all, delete-orphan"
    )
    symbols: Mapped[list["Symbol"]] = relationship(cascade="all, delete-orphan")


class RepositoryFile(Base):
    __tablename__ = "files"
    __table_args__ = (UniqueConstraint("snapshot_id", "relative_path"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    snapshot_id: Mapped[int] = mapped_column(ForeignKey("scan_snapshots.id"), index=True)
    relative_path: Mapped[str] = mapped_column(String(2048), index=True)
    name: Mapped[str] = mapped_column(String(255), index=True)
    extension: Mapped[str] = mapped_column(String(32), default="")
    language: Mapped[str] = mapped_column(String(64), default="Unknown", index=True)
    classification: Mapped[str] = mapped_column(String(16), default="TEXT")
    size_bytes: Mapped[int] = mapped_column(Integer, default=0)
    line_count: Mapped[int | None] = mapped_column(Integer)
    is_binary: Mapped[bool] = mapped_column(Boolean, default=False)
    is_test: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    warning: Mapped[str | None] = mapped_column(Text)

    snapshot: Mapped[ScanSnapshot] = relationship(back_populates="files")
    symbols: Mapped[list["Symbol"]] = relationship(back_populates="file", cascade="all, delete-orphan")


class Symbol(Base):
    __tablename__ = "symbols"
    __table_args__ = (UniqueConstraint("snapshot_id", "file_id", "qualified_name", "kind", "start_line", "start_column"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    snapshot_id: Mapped[int] = mapped_column(ForeignKey("scan_snapshots.id"), index=True)
    file_id: Mapped[int] = mapped_column(ForeignKey("files.id"), index=True)
    parent_symbol_id: Mapped[int | None] = mapped_column(ForeignKey("symbols.id"), index=True)
    kind: Mapped[str] = mapped_column(String(32), index=True)
    name: Mapped[str] = mapped_column(String(255), index=True)
    qualified_name: Mapped[str] = mapped_column(String(1024), index=True)
    start_line: Mapped[int] = mapped_column(Integer)
    start_column: Mapped[int] = mapped_column(Integer)
    end_line: Mapped[int] = mapped_column(Integer)
    end_column: Mapped[int] = mapped_column(Integer)
    signature: Mapped[str | None] = mapped_column(Text)
    warning: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    file: Mapped[RepositoryFile] = relationship(back_populates="symbols")


class Dependency(Base):
    __tablename__ = "dependencies"
    __table_args__ = (UniqueConstraint("snapshot_id", "source_file_id", "target_file_id", "imported_name", "kind", "source_line", "source_column"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    snapshot_id: Mapped[int] = mapped_column(ForeignKey("scan_snapshots.id"), index=True)
    source_file_id: Mapped[int] = mapped_column(ForeignKey("files.id"), index=True)
    target_file_id: Mapped[int | None] = mapped_column(ForeignKey("files.id"), index=True)
    imported_name: Mapped[str] = mapped_column(String(1024), index=True)
    kind: Mapped[str] = mapped_column(String(32), default="import", index=True)
    resolution_status: Mapped[str] = mapped_column(String(16), index=True)
    source_line: Mapped[int] = mapped_column(Integer)
    source_column: Mapped[int] = mapped_column(Integer)
    evidence: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
