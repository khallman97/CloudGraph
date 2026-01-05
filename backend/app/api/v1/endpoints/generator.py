from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session

from app.core.db import get_session
from app.models import Project
from app.schemas.diagram import ArchitectureRequest, TerraformResponse
from app.services.tf_engine import TerraformEngine

router = APIRouter()

@router.post("/generate", response_model=TerraformResponse)
async def generate_terraform(
    payload: ArchitectureRequest,
    session: Session = Depends(get_session)
):
    try:
        # Determine region: look up from project if project_id provided
        region = "us-east-1"  # Default fallback

        if payload.project_id:
            project = session.get(Project, payload.project_id)
            if project:
                region = project.region or "us-east-1"

        # Initialize the Engine with the nodes and resolved region
        engine = TerraformEngine(payload.nodes, region=region)

        # Run the compiler
        tf_code = engine.generate()

        return TerraformResponse(
            tf_code=tf_code,
            message="Successfully generated Terraform configuration."
        )
    except Exception as e:
        print(f"Error generating TF: {e}") # Log to docker console
        raise HTTPException(status_code=500, detail=str(e))