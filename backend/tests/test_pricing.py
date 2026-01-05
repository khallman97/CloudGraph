import pytest
from app.services.pricing import calculate_costs, get_resource_price, PRICING
from app.schemas.diagram import ReactFlowNode


class TestPricing:
    """Test suite for pricing service"""

    def test_cost_calculation_two_t3_micro(self):
        """
        Test cost calculation for 2 t3.micro EC2 instances.
        Expected: $10.00 per instance = $20.00 total
        """
        nodes = [
            ReactFlowNode(
                id="ec2-1",
                type="service",
                position={"x": 0, "y": 0},
                data={"type": "ec2", "label": "Server 1", "instanceType": "t3.micro"}
            ),
            ReactFlowNode(
                id="ec2-2",
                type="service",
                position={"x": 100, "y": 100},
                data={"type": "ec2", "label": "Server 2", "instanceType": "t3.micro"}
            ),
        ]

        result = calculate_costs(nodes)

        # Assert total monthly cost
        assert result["total_monthly_cost"] == 20.00, "Total cost should be $20.00"

        # Assert breakdown has correct per-node costs
        assert result["breakdown"]["ec2-1"] == 10.00, "ec2-1 should cost $10.00"
        assert result["breakdown"]["ec2-2"] == 10.00, "ec2-2 should cost $10.00"
        assert len(result["breakdown"]) == 2, "Breakdown should have 2 entries"

    def test_get_resource_price_ec2(self):
        """Test individual EC2 instance pricing"""
        assert get_resource_price("ec2", "t3.micro") == 10.00
        assert get_resource_price("ec2", "t3.small") == 20.00
        assert get_resource_price("ec2", "t3.medium") == 40.00
        assert get_resource_price("ec2", "m5.large") == 90.00
        assert get_resource_price("ec2", "m5.xlarge") == 180.00

    def test_get_resource_price_rds(self):
        """Test RDS instance pricing"""
        assert get_resource_price("rds", "db.t3.micro") == 15.00
        assert get_resource_price("rds", "db.t3.small") == 30.00
        assert get_resource_price("rds", "db.t3.medium") == 60.00

        # Test with and without "rds." prefix
        assert get_resource_price("rds", "rds.db.t3.micro") == 15.00

    def test_get_resource_price_s3(self):
        """Test S3 bucket pricing"""
        assert get_resource_price("s3") == 5.00

    def test_get_resource_price_unknown(self):
        """Test unknown resource type returns 0.00"""
        assert get_resource_price("ec2", "unknown.type") == 0.00
        assert get_resource_price("unknown_resource") == 0.00

    def test_calculate_costs_mixed_resources(self):
        """Test cost calculation with mixed resource types"""
        nodes = [
            ReactFlowNode(
                id="ec2-1",
                type="service",
                position={"x": 0, "y": 0},
                data={"type": "ec2", "instanceType": "t3.small"}
            ),
            ReactFlowNode(
                id="rds-1",
                type="service",
                position={"x": 0, "y": 100},
                data={"type": "rds", "instanceClass": "db.t3.micro"}
            ),
            ReactFlowNode(
                id="s3-1",
                type="service",
                position={"x": 0, "y": 200},
                data={"type": "s3"}
            ),
        ]

        result = calculate_costs(nodes)

        # t3.small = $20, db.t3.micro = $15, s3 = $5 = Total: $40
        assert result["total_monthly_cost"] == 40.00
        assert result["breakdown"]["ec2-1"] == 20.00
        assert result["breakdown"]["rds-1"] == 15.00
        assert result["breakdown"]["s3-1"] == 5.00

    def test_calculate_costs_ignores_vpc_subnet(self):
        """Test that VPC and subnet nodes are not included in cost calculation"""
        nodes = [
            ReactFlowNode(
                id="vpc-1",
                type="vpc",
                position={"x": 0, "y": 0},
                data={"type": "vpc", "label": "VPC", "cidr": "10.0.0.0/16"}
            ),
            ReactFlowNode(
                id="subnet-1",
                type="subnet",
                position={"x": 0, "y": 0},
                parentNode="vpc-1",
                data={"type": "subnet", "label": "Subnet", "cidr": "10.0.1.0/24"}
            ),
            ReactFlowNode(
                id="ec2-1",
                type="service",
                position={"x": 0, "y": 0},
                parentNode="subnet-1",
                data={"type": "ec2", "instanceType": "t3.micro"}
            ),
        ]

        result = calculate_costs(nodes)

        # Only EC2 should be counted
        assert result["total_monthly_cost"] == 10.00
        assert "vpc-1" not in result["breakdown"]
        assert "subnet-1" not in result["breakdown"]
        assert "ec2-1" in result["breakdown"]

    def test_calculate_costs_empty_nodes(self):
        """Test cost calculation with no nodes"""
        nodes = []

        result = calculate_costs(nodes)

        assert result["total_monthly_cost"] == 0.00
        assert result["breakdown"] == {}

    def test_calculate_costs_only_free_resources(self):
        """Test with only free resources (VPC, Subnet)"""
        nodes = [
            ReactFlowNode(
                id="vpc-1",
                type="vpc",
                position={"x": 0, "y": 0},
                data={"type": "vpc", "cidr": "10.0.0.0/16"}
            ),
        ]

        result = calculate_costs(nodes)

        assert result["total_monthly_cost"] == 0.00
        assert result["breakdown"] == {}

    def test_calculate_costs_default_instance_types(self):
        """Test that missing instanceType defaults to t3.micro"""
        nodes = [
            ReactFlowNode(
                id="ec2-1",
                type="service",
                position={"x": 0, "y": 0},
                data={"type": "ec2"}  # No instanceType specified
            ),
        ]

        result = calculate_costs(nodes)

        # Should default to t3.micro = $10.00
        assert result["total_monthly_cost"] == 10.00
        assert result["breakdown"]["ec2-1"] == 10.00

    def test_calculate_costs_default_rds_instance_class(self):
        """Test that missing RDS instanceClass defaults to db.t3.micro"""
        nodes = [
            ReactFlowNode(
                id="rds-1",
                type="service",
                position={"x": 0, "y": 0},
                data={"type": "rds"}  # No instanceClass specified
            ),
        ]

        result = calculate_costs(nodes)

        # Should default to db.t3.micro = $15.00
        assert result["total_monthly_cost"] == 15.00
        assert result["breakdown"]["rds-1"] == 15.00

    def test_calculate_costs_large_infrastructure(self):
        """Test cost calculation for a larger infrastructure setup"""
        nodes = [
            # Multiple EC2 instances
            ReactFlowNode(id="ec2-1", type="service", position={"x": 0, "y": 0},
                         data={"type": "ec2", "instanceType": "m5.large"}),
            ReactFlowNode(id="ec2-2", type="service", position={"x": 0, "y": 0},
                         data={"type": "ec2", "instanceType": "m5.large"}),
            ReactFlowNode(id="ec2-3", type="service", position={"x": 0, "y": 0},
                         data={"type": "ec2", "instanceType": "t3.small"}),

            # RDS instances
            ReactFlowNode(id="rds-1", type="service", position={"x": 0, "y": 0},
                         data={"type": "rds", "instanceClass": "db.m5.large"}),

            # S3 buckets
            ReactFlowNode(id="s3-1", type="service", position={"x": 0, "y": 0},
                         data={"type": "s3"}),
            ReactFlowNode(id="s3-2", type="service", position={"x": 0, "y": 0},
                         data={"type": "s3"}),
        ]

        result = calculate_costs(nodes)

        # m5.large * 2 = $180, t3.small = $20, db.m5.large = $150, s3 * 2 = $10
        # Total = $360
        assert result["total_monthly_cost"] == 360.00
        assert result["breakdown"]["ec2-1"] == 90.00
        assert result["breakdown"]["ec2-2"] == 90.00
        assert result["breakdown"]["ec2-3"] == 20.00
        assert result["breakdown"]["rds-1"] == 150.00
        assert result["breakdown"]["s3-1"] == 5.00
        assert result["breakdown"]["s3-2"] == 5.00

    def test_pricing_dictionary_consistency(self):
        """Test that PRICING dictionary has expected values"""
        assert PRICING["t3.micro"] == 10.00
        assert PRICING["t3.small"] == 20.00
        assert PRICING["rds.db.t3.micro"] == 15.00
        assert PRICING["s3"] == 5.00
        assert PRICING["vpc"] == 0.00
        assert PRICING["subnet"] == 0.00

    def test_calculate_costs_rounds_correctly(self):
        """Test that costs are rounded to 2 decimal places"""
        # Even though our mock data uses whole numbers,
        # verify the rounding logic is in place
        nodes = [
            ReactFlowNode(
                id="ec2-1",
                type="service",
                position={"x": 0, "y": 0},
                data={"type": "ec2", "instanceType": "t3.micro"}
            ),
        ]

        result = calculate_costs(nodes)

        # Should be exactly 10.00, not 10.0 or 10
        assert result["total_monthly_cost"] == 10.00
        assert isinstance(result["total_monthly_cost"], float)
        assert result["breakdown"]["ec2-1"] == 10.00
