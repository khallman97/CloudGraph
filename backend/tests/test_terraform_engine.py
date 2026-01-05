import pytest
from app.services.tf_engine import TerraformEngine
from app.schemas.diagram import ReactFlowNode


class TestTerraformEngine:
    """Test suite for TerraformEngine service"""

    def test_terraform_region_output(self, sample_vpc_node, sample_subnet_node, sample_ec2_node):
        """
        Test that Terraform generation respects the region parameter
        and includes required data sources for EC2 instances.
        """
        # Create nodes including EC2 instance
        nodes = [sample_vpc_node, sample_subnet_node, sample_ec2_node]

        # Generate with eu-west-2 region
        engine = TerraformEngine(nodes, region="eu-west-2")
        result = engine.generate()

        # Assert region appears in provider block
        assert 'region = "eu-west-2"' in result, "Region should be set to eu-west-2"

        # Assert AWS AMI data source is included when EC2 instances are present
        assert 'data "aws_ami" "ubuntu"' in result, "Ubuntu AMI data source should be included"
        assert 'most_recent = true' in result, "AMI data source should query most recent"
        assert '099720109477' in result, "Canonical owner ID should be present"

    def test_default_region_us_east_1(self, sample_vpc_node):
        """Test that default region is us-east-1 when not specified"""
        nodes = [sample_vpc_node]

        # Generate without specifying region (should default to us-east-1)
        engine = TerraformEngine(nodes)
        result = engine.generate()

        assert 'region = "us-east-1"' in result, "Default region should be us-east-1"

    def test_vpc_generation(self, sample_vpc_node):
        """Test VPC resource generation"""
        nodes = [sample_vpc_node]

        engine = TerraformEngine(nodes, region="us-east-1")
        result = engine.generate()

        # Check VPC resource block
        assert 'resource "aws_vpc"' in result
        assert 'vpc_123' in result  # Sanitized ID (vpc-123 -> vpc_123)
        assert 'cidr_block           = "10.0.0.0/16"' in result
        assert 'enable_dns_hostnames = true' in result
        assert 'Name = "Test VPC"' in result

    def test_subnet_generation(self, sample_vpc_node, sample_subnet_node):
        """Test subnet resource generation with VPC reference"""
        nodes = [sample_vpc_node, sample_subnet_node]

        engine = TerraformEngine(nodes)
        result = engine.generate()

        # Check subnet resource block
        assert 'resource "aws_subnet"' in result
        assert 'subnet_456' in result
        assert 'vpc_id                  = aws_vpc.vpc_123.id' in result
        assert 'cidr_block              = "10.0.1.0/24"' in result
        assert 'availability_zone       = "us-east-1a"' in result
        assert 'map_public_ip_on_launch = true' in result

    def test_ec2_instance_generation(self, sample_vpc_node, sample_subnet_node, sample_ec2_node):
        """Test EC2 instance generation"""
        nodes = [sample_vpc_node, sample_subnet_node, sample_ec2_node]

        engine = TerraformEngine(nodes)
        result = engine.generate()

        # Check EC2 resource block
        assert 'resource "aws_instance"' in result
        assert 'ec2_789' in result
        assert 'ami           = data.aws_ami.ubuntu.id' in result
        assert 'instance_type = "t3.micro"' in result
        assert 'subnet_id     = aws_subnet.subnet_456.id' in result
        assert 'key_name = "my-key"' in result
        assert 'Name = "Web Server"' in result

    def test_rds_instance_generation(self, sample_vpc_node, sample_subnet_node, sample_rds_node):
        """Test RDS database instance generation"""
        nodes = [sample_vpc_node, sample_subnet_node, sample_rds_node]

        engine = TerraformEngine(nodes)
        result = engine.generate()

        # Check RDS subnet group
        assert 'resource "aws_db_subnet_group"' in result
        assert 'grp_rds_101' in result

        # Check RDS instance
        assert 'resource "aws_db_instance"' in result
        assert 'rds_101' in result
        assert 'engine                 = "mysql"' in result
        assert 'instance_class         = "db.t3.micro"' in result
        assert 'allocated_storage      = 20' in result
        assert 'username               = "admin"' in result

    def test_s3_bucket_generation(self, sample_s3_node):
        """Test S3 bucket generation (no parent required)"""
        nodes = [sample_s3_node]

        engine = TerraformEngine(nodes)
        result = engine.generate()

        # Check S3 bucket resource
        assert 'resource "aws_s3_bucket"' in result
        assert 's3_202' in result
        assert 'bucket        = "my_bucket-s3_202"' in result  # Sanitized label
        assert 'force_destroy = true' in result

        # Check versioning block
        assert 'resource "aws_s3_bucket_versioning"' in result
        assert 'ver_s3_202' in result
        assert 'status = "Enabled"' in result

    def test_empty_nodes_list(self):
        """Test generation with no nodes"""
        nodes = []

        engine = TerraformEngine(nodes, region="us-west-2")
        result = engine.generate()

        # Should only have provider block
        assert 'provider "aws"' in result
        assert 'region = "us-west-2"' in result
        # Should not have any resource blocks
        assert 'resource "aws_vpc"' not in result
        assert 'resource "aws_instance"' not in result

    def test_multiple_regions(self):
        """Test different AWS regions"""
        regions = ["us-east-1", "us-west-2", "eu-west-1", "eu-west-2", "ap-southeast-1"]

        for region in regions:
            nodes = [ReactFlowNode(
                id="vpc-test",
                type="vpc",
                position={"x": 0, "y": 0},
                data={"type": "vpc", "label": "Test", "cidr": "10.0.0.0/16"}
            )]

            engine = TerraformEngine(nodes, region=region)
            result = engine.generate()

            assert f'region = "{region}"' in result, f"Region {region} should appear in output"

    def test_full_architecture(self, sample_vpc_node, sample_subnet_node,
                               sample_ec2_node, sample_rds_node, sample_s3_node):
        """Test complete architecture with all resource types"""
        nodes = [
            sample_vpc_node,
            sample_subnet_node,
            sample_ec2_node,
            sample_rds_node,
            sample_s3_node
        ]

        engine = TerraformEngine(nodes, region="ap-southeast-1")
        result = engine.generate()

        # Verify all resource types are present
        assert 'resource "aws_vpc"' in result
        assert 'resource "aws_subnet"' in result
        assert 'resource "aws_instance"' in result
        assert 'resource "aws_db_instance"' in result
        assert 'resource "aws_s3_bucket"' in result

        # Verify region
        assert 'region = "ap-southeast-1"' in result

        # Verify data source for EC2
        assert 'data "aws_ami" "ubuntu"' in result
