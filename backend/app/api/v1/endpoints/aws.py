"""
AWS API Endpoints - Fetch EC2 and RDS configuration options from AWS.
"""
from fastapi import APIRouter, Depends, Query
from typing import Optional, List

from app.core.security import get_current_user
from app.models import User
from app.services.aws_service import get_aws_service

router = APIRouter()


@router.get("/status")
async def get_aws_status(
    current_user: User = Depends(get_current_user)
):
    """Check AWS credentials status and configuration."""
    service = get_aws_service()
    return service.get_credentials_status()


# ==================== EC2 Endpoints ====================

@router.get("/ec2/instance-types")
async def get_instance_types(
    region: Optional[str] = Query(None, description="AWS region"),
    families: Optional[List[str]] = Query(None, description="Instance families to filter (e.g., t3, m5, c5)"),
    current_user: User = Depends(get_current_user)
):
    """
    Get available EC2 instance types.

    Optionally filter by instance family (t3, m5, c5, r5, etc.)
    Returns vCPU count, memory, and architecture info.
    """
    service = get_aws_service(region)
    return service.get_instance_types(families=families)


@router.get("/ec2/amis")
async def get_amis(
    region: Optional[str] = Query(None, description="AWS region"),
    os_filter: Optional[str] = Query(None, description="Filter by OS (ubuntu, amazon-linux, windows)"),
    current_user: User = Depends(get_current_user)
):
    """
    Get available AMIs (Amazon Machine Images).

    Returns common AMIs: Ubuntu, Amazon Linux, Windows Server.
    Optionally filter by OS type.
    """
    service = get_aws_service(region)
    return service.get_amis(os_filter=os_filter)


@router.get("/ec2/availability-zones")
async def get_availability_zones(
    region: Optional[str] = Query(None, description="AWS region"),
    current_user: User = Depends(get_current_user)
):
    """
    Get availability zones for a region.

    Returns list of available AZs (e.g., us-east-1a, us-east-1b).
    """
    service = get_aws_service(region)
    return service.get_availability_zones()


# ==================== RDS Endpoints ====================

@router.get("/rds/engines")
async def get_rds_engines(
    region: Optional[str] = Query(None, description="AWS region"),
    current_user: User = Depends(get_current_user)
):
    """
    Get available RDS database engines and versions.

    Returns engines like mysql, postgres, mariadb, aurora-mysql, aurora-postgresql
    with their available versions.
    """
    service = get_aws_service(region)
    return service.get_rds_engines()


@router.get("/rds/instance-classes")
async def get_rds_instance_classes(
    region: Optional[str] = Query(None, description="AWS region"),
    engine: Optional[str] = Query("mysql", description="Database engine"),
    engine_version: Optional[str] = Query(None, description="Engine version"),
    current_user: User = Depends(get_current_user)
):
    """
    Get available RDS instance classes for a given engine.

    Instance classes vary by engine and version.
    Examples: db.t3.micro, db.m5.large, db.r5.xlarge
    """
    service = get_aws_service(region)
    return service.get_rds_instance_classes(engine=engine, engine_version=engine_version)


# ==================== EKS Endpoints ====================

@router.get("/eks/versions")
async def get_eks_versions(
    region: Optional[str] = Query(None, description="AWS region"),
    current_user: User = Depends(get_current_user)
):
    """
    Get available EKS Kubernetes versions.

    Returns supported Kubernetes versions with their support status.
    """
    service = get_aws_service(region)
    return service.get_eks_versions()


# ==================== Cache Management ====================

@router.post("/cache/clear")
async def clear_cache(
    current_user: User = Depends(get_current_user)
):
    """
    Clear the AWS data cache.

    Use this to force refresh of all AWS data on next request.
    """
    service = get_aws_service()
    return service.clear_cache()
