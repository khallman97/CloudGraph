from typing import List, Dict
from app.schemas.diagram import ReactFlowNode


# Mock pricing dictionary (monthly costs in USD)
PRICING = {
    # EC2 instances (monthly estimates based on 730 hours)
    "t3.micro": 10.00,
    "t3.small": 20.00,
    "t3.medium": 40.00,
    "t2.micro": 10.00,
    "t2.small": 20.00,
    "t2.medium": 40.00,
    "m5.large": 90.00,
    "m5.xlarge": 180.00,
    "m5.2xlarge": 360.00,

    # RDS instances (monthly estimates)
    "rds.db.t3.micro": 15.00,
    "rds.db.t3.small": 30.00,
    "rds.db.t3.medium": 60.00,
    "rds.db.t2.micro": 15.00,
    "rds.db.t2.small": 30.00,
    "rds.db.m5.large": 150.00,

    # S3 storage (base cost estimate)
    "s3": 5.00,

    # EKS (Elastic Kubernetes Service)
    "eks": 73.00,  # Control plane cost (~$0.10/hour)

    # VPC components
    "vpc": 0.00,
    "subnet": 0.00,
}


def get_instance_cost(instance_type: str) -> float:
    """
    Get the monthly cost for an EC2 instance type.

    Args:
        instance_type: EC2 instance type (e.g., 't3.micro', 't3.medium')

    Returns:
        Monthly cost in USD
    """
    return PRICING.get(instance_type, 0.00)


def get_resource_price(resource_type: str, instance_size: str = None) -> float:
    """
    Get the monthly price for a resource.

    Args:
        resource_type: Type of resource (e.g., 'ec2', 'rds', 's3', 'eks')
        instance_size: Instance size (e.g., 't3.micro', 'db.t3.micro')

    Returns:
        Monthly cost in USD
    """
    if resource_type == "ec2" and instance_size:
        return get_instance_cost(instance_size)

    if resource_type == "rds" and instance_size:
        if not instance_size.startswith("rds."):
            instance_size = f"rds.{instance_size}"
        return PRICING.get(instance_size, 0.00)

    if resource_type == "s3":
        return PRICING.get("s3", 0.00)

    if resource_type == "eks":
        return PRICING.get("eks", 0.00)

    return PRICING.get(resource_type, 0.00)


def calculate_costs(nodes: List[ReactFlowNode]) -> Dict:
    """
    Calculate total monthly cost and breakdown for a list of nodes.

    Args:
        nodes: List of ReactFlowNode objects from the diagram

    Returns:
        Dictionary with total_monthly_cost and breakdown by node_id
    """
    breakdown = {}
    total_cost = 0.00

    for node in nodes:
        node_cost = 0.00
        resource_type = node.data.get("type", "").lower()

        if node.type in ["vpc", "subnet"]:
            continue

        if node.type == "service":
            if resource_type == "ec2":
                instance_size = node.data.get("instanceType", "t3.micro")
                node_cost = get_resource_price("ec2", instance_size)

            elif resource_type == "rds":
                instance_size = node.data.get("instanceClass", "db.t3.micro")
                node_cost = get_resource_price("rds", instance_size)

            elif resource_type == "s3":
                node_cost = get_resource_price("s3")

            elif resource_type == "eks":
                # EKS control plane cost
                node_cost = get_resource_price("eks")

            elif resource_type == "eks-node-group":
                # EKS node group cost: instance_cost * desired_size
                instance_types = node.data.get("instanceTypes", ["t3.medium"])
                instance_type = instance_types[0] if instance_types else "t3.medium"
                desired_size = node.data.get("desiredSize", 2)
                instance_cost = get_instance_cost(instance_type)
                node_cost = instance_cost * desired_size

        if node_cost > 0:
            breakdown[node.id] = round(node_cost, 2)
            total_cost += node_cost

    return {
        "total_monthly_cost": round(total_cost, 2),
        "breakdown": breakdown
    }
