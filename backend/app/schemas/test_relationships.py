from pydantic import BaseModel
class TestRelationship(BaseModel):
    test_file_id:int; test_path:str; source_file_id:int; source_path:str; kind:str; evidence_level:str; evidence:str
class TestRelationshipResponse(BaseModel):
    snapshot_id:int; items:list[TestRelationship]
