from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.endpoints import generator, auth, projects, costs, aws
from app.core.db import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database tables on startup."""
    # Import models to ensure they're registered with SQLModel
    from app.models import User, Project  # noqa
    init_db()
    yield


app = FastAPI(
    title="CloudGraph IDE",
    description="Visual Infrastructure as Code - Converts diagrams into Terraform.",
    version="0.3.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Allow CORS for Dockerized Frontend
origins = ["*"]  # For Dev, allow all. For prod, restrict.

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(projects.router, prefix="/api/v1/projects", tags=["projects"])
app.include_router(generator.router, prefix="/api/v1", tags=["generator"])
app.include_router(costs.router, prefix="/api/v1/costs", tags=["costs"])
app.include_router(aws.router, prefix="/api/v1/aws", tags=["aws"])


@app.get("/health")
def health_check():
    return {"status": "ok"}
