/**
 * Centralized TypeScript types for CloudGraph IDE
 * This file defines types that align with backend Pydantic schemas
 */

import type { Node as ReactFlowNodeBase } from 'reactflow';

// ============================================================================
// React Flow Node/Edge Types (aligned with backend schemas/diagram.py)
// ============================================================================

/**
 * Extended React Flow Node with CloudGraph-specific data
 * Matches backend ReactFlowNode in schemas/diagram.py
 */
export interface CloudGraphNode extends ReactFlowNodeBase {
  id: string;
  type: 'vpc' | 'subnet' | 'service';
  position: { x: number; y: number };
  data: NodeData;
  parentNode?: string;
  width?: number;
  height?: number;
}

/**
 * Node data structure for different resource types
 */
export interface NodeData {
  type: string;      // Resource type: 'vpc', 'subnet', 'ec2', 'rds', 's3', 'lambda', etc.
  label: string;
  [key: string]: any; // Resource-specific properties
}

/**
 * VPC Node Data
 */
export interface VpcNodeData extends NodeData {
  type: 'vpc';
  cidr: string;
}

/**
 * Subnet Node Data
 */
export interface SubnetNodeData extends NodeData {
  type: 'subnet';
  cidr: string;
  availabilityZone?: string;
}

/**
 * Security Rule for EC2/RDS
 */
export interface SecurityRule {
  port: number;
  protocol: 'tcp' | 'udp';
  cidr: string;
  description?: string;
}

/**
 * EC2 Node Data - Enhanced with all configuration options
 */
export interface Ec2NodeData extends NodeData {
  type: 'ec2';
  instanceType: string;
  ami?: string;           // Friendly name (ubuntu-22.04)
  amiId?: string;         // Actual AMI ID from AWS
  keyName?: string;
  // Network
  associatePublicIp?: boolean;
  privateIp?: string;
  // Storage
  rootVolumeSize?: number;
  rootVolumeType?: 'gp2' | 'gp3' | 'io1' | 'io2';
  rootVolumeEncrypted?: boolean;
  // Security
  securityRules?: SecurityRule[];
}

/**
 * RDS Node Data - Enhanced with all configuration options
 */
export interface RdsNodeData extends NodeData {
  type: 'rds';
  engine: string;
  engineVersion?: string;
  instanceClass: string;
  allocatedStorage?: number;
  // Storage
  storageType?: 'gp2' | 'gp3' | 'io1';
  iops?: number;
  storageEncrypted?: boolean;
  // Database
  dbName?: string;
  username?: string;
  password?: string;
  port?: number;
  // Backup
  backupRetentionPeriod?: number;
  backupWindow?: string;
  multiAz?: boolean;
  skipFinalSnapshot?: boolean;
  // Network
  publiclyAccessible?: boolean;
}

/**
 * S3 Node Data
 */
export interface S3NodeData extends NodeData {
  type: 's3';
  versioning?: boolean;
}

/**
 * Lambda Node Data
 */
export interface LambdaNodeData extends NodeData {
  type: 'lambda';
  runtime: string;
  handler: string;
  memory?: number;
}

/**
 * EKS Cluster Node Data
 */
export interface EksClusterNodeData extends NodeData {
  type: 'eks';
  label: string;
  version: string;
  endpointPublicAccess: boolean;
  endpointPrivateAccess: boolean;
  enableLogging: boolean;
  logTypes?: ('api' | 'audit' | 'authenticator' | 'controllerManager' | 'scheduler')[];
  addons?: {
    vpcCni?: boolean;
    kubeProxy?: boolean;
    coreDns?: boolean;
    ebsCsi?: boolean;
  };
}

/**
 * EKS Node Group Node Data
 */
export interface EksNodeGroupNodeData extends NodeData {
  type: 'eks-node-group';
  label: string;
  instanceTypes: string[];
  desiredSize: number;
  minSize: number;
  maxSize: number;
  diskSize: number;
  amiType: 'AL2_x86_64' | 'AL2_ARM_64' | 'BOTTLEROCKET_x86_64' | 'BOTTLEROCKET_ARM_64';
  labels?: Record<string, string>;
  capacityType: 'ON_DEMAND' | 'SPOT';
}

/**
 * React Flow Edge
 */
export interface CloudGraphEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  [key: string]: any;
}

// ============================================================================
// Project Types (aligned with backend models.py)
// ============================================================================

/**
 * Diagram data structure containing nodes and edges
 */
export interface DiagramData {
  nodes: CloudGraphNode[];
  edges: CloudGraphEdge[];
}

/**
 * Project metadata containing configuration
 */
export interface ProjectMetadata {
  region?: string;               // AWS region (default: us-east-1)
  terraform_version?: string;    // Terraform version (default: 1.5.0)
}

/**
 * Full project structure
 * Matches backend ProjectRead in models.py
 */
export interface Project {
  id: number;
  name: string;
  diagram_data: DiagramData;
  meta_data: ProjectMetadata;
  region: string;
  terraform_version: string;
  created_at: string;
  updated_at: string;
}

/**
 * Project list item (minimal data for list views)
 * Matches backend ProjectListItem in models.py
 */
export interface ProjectListItem {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

/**
 * Data required to create a new project
 * Matches backend ProjectCreate in models.py
 */
export interface CreateProjectData {
  name: string;
  diagram_data: DiagramData;
  meta_data?: ProjectMetadata;
}

/**
 * Data for updating an existing project
 * Matches backend ProjectUpdate in models.py
 */
export interface UpdateProjectData {
  name?: string;
  diagram_data?: DiagramData;
  meta_data?: ProjectMetadata;
  region?: string;
  terraform_version?: string;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

/**
 * Request to generate Terraform code
 * Matches backend ArchitectureRequest in schemas/diagram.py
 */
export interface GenerateRequest {
  nodes: CloudGraphNode[];
  edges: CloudGraphEdge[];
  project_id?: number;  // If provided, backend fetches region from project
}

/**
 * Response from Terraform generation
 * Matches backend TerraformResponse in schemas/diagram.py
 */
export interface GenerateResponse {
  tf_code: string;
  message: string;
}

/**
 * Cost breakdown by node ID
 */
export interface CostBreakdown {
  [nodeId: string]: number;
}

/**
 * Response from cost estimation endpoint
 * Returned by POST /api/v1/costs/estimate
 */
export interface CostEstimateResponse {
  total_monthly_cost: number;
  breakdown: CostBreakdown;
}

/**
 * Response from pricing catalog endpoint
 * Returned by GET /api/v1/costs/pricing
 */
export interface PricingResponse {
  pricing: Record<string, number>;
  currency: string;
  period: string;
}

// ============================================================================
// Authentication Types
// ============================================================================

/**
 * User login credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * User signup data
 */
export interface SignupData {
  email: string;
  password: string;
}

/**
 * Authentication response with JWT token
 */
export interface AuthResponse {
  access_token: string;
  token_type: string;
}

/**
 * User data
 */
export interface User {
  id: number;
  email: string;
}

// ============================================================================
// AWS Resource Types (for dynamic options from boto3)
// ============================================================================

/**
 * EC2 Instance Type from AWS
 */
export interface AWSInstanceType {
  instanceType: string;
  vCpus: number;
  memory: number;  // in MiB
  family: string;
  architecture?: string[];
}

/**
 * AMI (Amazon Machine Image) from AWS
 */
export interface AWSAMI {
  id: string;
  name: string;
  os: 'ubuntu' | 'amazon-linux' | 'windows' | 'debian' | 'rhel';
  description?: string;
}

/**
 * RDS Database Engine
 */
export interface AWSRDSEngine {
  engine: string;
  description?: string;
  versions: string[];
}

/**
 * RDS Instance Class
 */
export interface AWSRDSInstanceClass {
  instanceClass: string;
  vCpus?: number;
  memory?: number;
}

/**
 * AWS Status Response
 */
export interface AWSStatusResponse {
  configured: boolean;
  region: string;
}

/**
 * AWS Instance Types Response
 */
export interface InstanceTypesResponse {
  instance_types: AWSInstanceType[];
  source: 'aws' | 'cache' | 'fallback';
}

/**
 * AWS AMIs Response
 */
export interface AMIsResponse {
  amis: AWSAMI[];
  source: 'aws' | 'cache' | 'fallback';
}

/**
 * AWS Availability Zones Response
 */
export interface AvailabilityZonesResponse {
  availability_zones: string[];
  source: 'aws' | 'cache' | 'fallback';
}

/**
 * AWS RDS Engines Response
 */
export interface RDSEnginesResponse {
  engines: AWSRDSEngine[];
  source: 'aws' | 'cache' | 'fallback';
}

/**
 * AWS RDS Instance Classes Response
 */
export interface RDSInstanceClassesResponse {
  instance_classes: AWSRDSInstanceClass[];
  source: 'aws' | 'cache' | 'fallback';
}

/**
 * EKS Version
 */
export interface AWSEKSVersion {
  version: string;
  status: 'STANDARD_SUPPORT' | 'EXTENDED_SUPPORT';
}

/**
 * AWS EKS Versions Response
 */
export interface EKSVersionsResponse {
  versions: AWSEKSVersion[];
  source: 'aws' | 'cache' | 'fallback';
}
