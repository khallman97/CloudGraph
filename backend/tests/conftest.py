import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.schemas.diagram import ReactFlowNode


@pytest.fixture
def client():
    """FastAPI test client fixture"""
    return TestClient(app)


@pytest.fixture
def sample_vpc_node():
    """Sample VPC node for testing"""
    return ReactFlowNode(
        id="vpc-123",
        type="vpc",
        position={"x": 0, "y": 0},
        data={
            "type": "vpc",
            "label": "Test VPC",
            "cidr": "10.0.0.0/16",
            "enableDnsHostnames": True
        }
    )


@pytest.fixture
def sample_subnet_node():
    """Sample subnet node for testing"""
    return ReactFlowNode(
        id="subnet-456",
        type="subnet",
        position={"x": 50, "y": 50},
        parentNode="vpc-123",
        data={
            "type": "subnet",
            "label": "Test Subnet",
            "cidr": "10.0.1.0/24",
            "az": "us-east-1a",
            "mapPublicIp": True
        }
    )


@pytest.fixture
def sample_ec2_node():
    """Sample EC2 instance node for testing"""
    return ReactFlowNode(
        id="ec2-789",
        type="service",
        position={"x": 100, "y": 100},
        parentNode="subnet-456",
        data={
            "type": "ec2",
            "label": "Web Server",
            "instanceType": "t3.micro",
            "keyName": "my-key"
        }
    )


@pytest.fixture
def sample_rds_node():
    """Sample RDS instance node for testing"""
    return ReactFlowNode(
        id="rds-101",
        type="service",
        position={"x": 100, "y": 200},
        parentNode="subnet-456",
        data={
            "type": "rds",
            "label": "Database",
            "instanceClass": "db.t3.micro",
            "engine": "mysql",
            "allocatedStorage": 20,
            "username": "admin"
        }
    )


@pytest.fixture
def sample_s3_node():
    """Sample S3 bucket node for testing"""
    return ReactFlowNode(
        id="s3-202",
        type="service",
        position={"x": 300, "y": 100},
        data={
            "type": "s3",
            "label": "my-bucket",
            "versioning": True,
            "forceDestroy": True
        }
    )
