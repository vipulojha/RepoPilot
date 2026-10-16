from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.common import RepositoryResponse
from app.schemas.onboarding import CloneRequest, CloneResponse, InspectRequest, OnboardRequest, OnboardingResponse
from app.services.onboarding import OnboardingError, OnboardingService

router = APIRouter(prefix="/repositories", tags=["onboarding"])


@router.post("/inspect", response_model=OnboardingResponse)
def inspect(request: InspectRequest, db: Session = Depends(get_db)):
    try: return OnboardingService().inspect(db, request)
    except (OnboardingError, OSError) as exc: raise HTTPException(400, str(exc)) from exc


@router.post("/onboard", response_model=RepositoryResponse)
def onboard(request: OnboardRequest, db: Session = Depends(get_db)):
    try: return OnboardingService().onboard(db, request.path, request.name, request.initialize_git)
    except (OnboardingError, OSError) as exc: raise HTTPException(400, str(exc)) from exc


@router.post("/clone", response_model=CloneResponse, status_code=status.HTTP_201_CREATED)
def clone(request: CloneRequest, db: Session = Depends(get_db)):
    try:
        repository = OnboardingService().clone(db, request)
        return CloneResponse(repository=RepositoryResponse.model_validate(repository).model_dump(), cloned_path=repository.path)
    except (OnboardingError, OSError) as exc: raise HTTPException(400, str(exc)) from exc
