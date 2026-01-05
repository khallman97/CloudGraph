from jinja2 import Environment, FileSystemLoader
import os

# Setup Jinja Environment
TEMPLATE_DIR = os.path.join(os.path.dirname(__file__), '..', 'templates')
env = Environment(loader=FileSystemLoader(TEMPLATE_DIR))

# Helper to fix IDs (terraform doesn't like hyphens in resource names)
def sanitize(value):
    if not value: return "unknown"
    return value.replace("-", "_").replace(" ", "_").lower()

env.filters['sanitize'] = sanitize

class TerraformEngine:
    def __init__(self, nodes, region="us-east-1"):
        self.nodes = nodes
        self.region = region
        # Create a lookup map for easy parent finding
        self.node_map = {n.id: n for n in nodes}

    def generate(self):
        # 1. Categorize Resources
        vpcs = [n for n in self.nodes if n.type == 'vpc']
        subnets = [n for n in self.nodes if n.type == 'subnet']
        
        # EC2 Instances
        instances = [
            n for n in self.nodes 
            if n.type == 'service' and n.data.get('type') == 'ec2'
        ]

        # 🟢 NEW: RDS Instances
        rds_instances = [
            n for n in self.nodes 
            if n.type == 'service' and n.data.get('type') == 'rds'
        ]

        # 🟢 NEW: S3 Buckets
        buckets = [
            n for n in self.nodes
            if n.type == 'service' and n.data.get('type') == 's3'
        ]

        # EKS Clusters
        eks_clusters = [
            n for n in self.nodes
            if n.type == 'eks'
        ]

        # EKS Node Groups
        eks_node_groups = [
            n for n in self.nodes
            if n.type == 'eks-node-group'
        ]

        # 2. Enrich Data (Resolve Dependencies)

        # Enrich EC2 - Find VPC for security group attachment
        for instance in instances:
            parent_subnet_id = instance.parentNode
            if parent_subnet_id and parent_subnet_id in self.node_map:
                subnet = self.node_map[parent_subnet_id]
                instance.vpc_id = subnet.parentNode
            else:
                instance.vpc_id = None

        # Enrich RDS (If we needed special logic, we'd do it here)
        # Note: RDS relies on subnet_group which relies on the parentNode (subnet) ID.
        # We don't strictly need to enrich the python object if the template can access parentNode.

        # Enrich EKS Clusters - Find subnet and VPC for placement
        for cluster in eks_clusters:
            parent_subnet_id = cluster.parentNode
            if parent_subnet_id and parent_subnet_id in self.node_map:
                subnet = self.node_map[parent_subnet_id]
                cluster.subnet_id = parent_subnet_id
                cluster.vpc_id = subnet.parentNode
            else:
                cluster.subnet_id = None
                cluster.vpc_id = None

        # Enrich EKS Node Groups - Find parent EKS cluster and subnet info
        for node_group in eks_node_groups:
            parent_cluster_id = node_group.parentNode
            if parent_cluster_id and parent_cluster_id in self.node_map:
                cluster = self.node_map[parent_cluster_id]
                node_group.cluster_name = cluster.data.get('label', 'unnamed-cluster')
                node_group.cluster_id = parent_cluster_id
                # Node groups can use the same subnet as their parent cluster
                node_group.subnet_ids = [cluster.subnet_id] if hasattr(cluster, 'subnet_id') and cluster.subnet_id else []
            else:
                node_group.cluster_name = 'unnamed-cluster'
                node_group.cluster_id = None
                node_group.subnet_ids = []

        # 3. Render Template
        template = env.get_template('aws/main.tf.j2')
        return template.render(
            region=self.region,
            vpcs=vpcs,
            subnets=subnets,
            instances=instances,
            ec2_instances=instances,     # Template uses ec2_instances for data source check
            rds_instances=rds_instances,
            buckets=buckets,
            eks_clusters=eks_clusters,
            eks_node_groups=eks_node_groups
        )