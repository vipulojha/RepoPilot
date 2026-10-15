from pathlib import PurePosixPath
from app.services.git import GitService, GitServiceError
from app.schemas.git import GitCommit, GitChangedFile, GitHistoryResponse, GitFileHistoryResponse, GitCompareResponse

class GitHistoryService:
    """Bounded, read-only history facade over GitService's subprocess boundary."""
    def __init__(self, git: GitService | None = None): self.git = git or GitService(timeout=5, max_output=2_000_000)

    def _commit(self, root, sha, *, files=True):
        raw = self.git._run(root, ["show", "-s", f"--format=%H%x00%h%x00%s%x00%an%x00%cI%x00%P", sha])
        p = raw.rstrip("\n").split("\0")
        if len(p) < 6: raise GitServiceError("Invalid commit")
        changed=[]; additions=deletions=0
        if files:
            changed = self._files(root, [sha, "-m"])
            additions=sum(x.additions for x in changed); deletions=sum(x.deletions for x in changed)
        parents=p[5].split() if p[5] else []
        return GitCommit(sha=p[0], short_sha=p[1], subject=p[2], author=p[3], committed_at=p[4], parents=parents,
                         is_merge=len(parents)>1, changed_files=len(changed), additions=additions, deletions=deletions, files=changed)

    def _files(self, root, args):
        raw=self.git._run(root,["diff-tree","--root","--no-commit-id","--numstat","-z","-M","-r",*args])
        out=[]; i=0; parts=raw.split("\0")
        while i+1 < len(parts) and parts[i]:
            nums=parts[i].split("\t"); i+=1
            if len(nums)<3: continue
            path=parts[i]; i+=1; old=None; status="modified"
            if path.startswith("\t"):
                old=path[1:]; path=parts[i]; i+=1; status="renamed"
            if nums[0]=="-": add=delete=0
            else: add,delete=int(nums[0]),int(nums[1])
            out.append(GitChangedFile(path=path,old_path=old,status=status,additions=add,deletions=delete))
        return out[:1000]

    def history(self, path, page=1, limit=50, ref=None):
        root=self.git._validate_root(path); target=ref or "HEAD"
        if not self.git._run(root,["rev-parse","--verify",f"{target}^{{commit}}"],check=False).strip():
            if ref: raise GitServiceError("Invalid ref")
            return GitHistoryResponse(items=[],page=page,limit=limit,has_more=False,ref=ref,detached=False,empty=True)
        raw=self.git._run(root,["log","--format=%H","--max-count",str(page*limit+1),target])
        shas=[x for x in raw.splitlines() if x]; start=(page-1)*limit; selected=shas[start:start+limit]
        branch=self.git._run(root,["symbolic-ref","--quiet","--short","HEAD"],check=False).strip()
        return GitHistoryResponse(items=[self._commit(root,s) for s in selected],page=page,limit=limit,has_more=len(shas)>start+limit,ref=ref,detached=not bool(branch),empty=not bool(shas))

    def commit(self,path,sha):
        root=self.git._validate_root(path); self.git._run(root,["rev-parse","--verify",f"{sha}^{{commit}}"]); return self._commit(root,sha)

    def file_history(self,path,file_id,relative,page=1,limit=50):
        root=self.git._validate_root(path); raw=self.git._run(root,["log","--format=%H","--follow","--max-count",str(page*limit+1),"--",relative]); shas=[x for x in raw.splitlines() if x]; start=(page-1)*limit
        return GitFileHistoryResponse(file_id=file_id,path=relative,items=[self._commit(root,s) for s in shas[start:start+limit]],has_more=len(shas)>start+limit)

    def compare(self,path,base,head):
        root=self.git._validate_root(path); self.git._run(root,["rev-parse","--verify",f"{base}^{{commit}}"]); self.git._run(root,["rev-parse","--verify",f"{head}^{{commit}}"])
        files=self._files(root,[base,head]); raw=self.git._run(root,["rev-list","--count",f"{base}..{head}"]).strip()
        return GitCompareResponse(base=base,head=head,commits=int(raw or 0),files=files,additions=sum(x.additions for x in files),deletions=sum(x.deletions for x in files))
