from pydantic import BaseModel
class OverviewResponse(BaseModel):
    snapshot_id:int; file_count:int; total_lines:int; total_bytes:int; symbol_count:int; dependency_count:int; test_file_count:int; language_counts:dict[str,int]; warning_count:int; hotspot_count:int
