from typing import List, Optional, Dict, Any
from pydantic import BaseModel

class ReactFlowNode(BaseModel):
    id: str
    type: str
    position: Dict[str, float]
    data: Dict[str, Any]
    parentNode: Optional[str] = None
    width: Optional[float] = None
    height: Optional[float] = None

    # --- ADD THESE TWO LINES ---
    # These are calculated by the Python Backend, not sent by React
    ami_id: Optional[str] = None
    vpc_id: Optional[str] = None

class ReactFlowEdge(BaseModel):
    id: str
    source: str
    target: str

class ArchitectureRequest(BaseModel):
    nodes: List[ReactFlowNode]
    edges: List[ReactFlowEdge]
    project_id: Optional[int] = None  # If provided, region is fetched from project

class TerraformResponse(BaseModel):
    tf_code: str
    message: str = "Success"

# EKS-specific schemas
class EksClusterData(BaseModel):
    """Schema for EKS cluster node data"""
    type: str = "eks"
    label: str
    version: str = "1.29"
    endpointPublicAccess: bool = True
    endpointPrivateAccess: bool = False
    enableLogging: bool = False
    logTypes: Optional[List[str]] = None
    addons: Optional[Dict[str, Any]] = None  # Keys: vpcCni, kubeProxy, coreDns, ebsCsi

class EksNodeGroupData(BaseModel):
    """Schema for EKS node group node data"""
    type: str = "eks-node-group"
    label: str
    instanceTypes: List[str] = ["t3.medium"]
    desiredSize: int = 2
    minSize: int = 1
    maxSize: int = 4
    diskSize: int = 20
    amiType: str = "AL2_x86_64"
    capacityType: str = "ON_DEMAND"
    labels: Optional[Dict[str, str]] = None