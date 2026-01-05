# =============================================================================
# AWS Configuration
# =============================================================================

variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "prod"
}

# =============================================================================
# Network Configuration
# =============================================================================

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "use_default_vpc" {
  description = "Use the default VPC instead of creating a new one"
  type        = bool
  default     = true
}

# =============================================================================
# EC2 Configuration (Backend Only)
# =============================================================================

variable "instance_type" {
  description = "EC2 instance type (t2.micro is free tier eligible)"
  type        = string
  default     = "t2.micro"
}

variable "key_name" {
  description = "Name of the SSH key pair to use for EC2 instance"
  type        = string
  default     = ""
}

variable "allowed_ssh_cidrs" {
  description = "CIDR blocks allowed to SSH to the instance"
  type        = list(string)
  default     = ["0.0.0.0/0"] # Restrict this in production!
}

variable "root_volume_size" {
  description = "Size of root EBS volume in GB"
  type        = number
  default     = 8 # Smaller since no frontend/db on this instance
}

# =============================================================================
# RDS Configuration (PostgreSQL)
# =============================================================================

variable "rds_instance_class" {
  description = "RDS instance class (db.t3.micro is free tier eligible)"
  type        = string
  default     = "db.t3.micro"
}

variable "rds_allocated_storage" {
  description = "RDS allocated storage in GB (up to 20GB is free tier)"
  type        = number
  default     = 20
}

variable "db_password" {
  description = "PostgreSQL database password"
  type        = string
  sensitive   = true
}

# =============================================================================
# Application Configuration
# =============================================================================

variable "app_name" {
  description = "Application name"
  type        = string
  default     = "cloudgraph-ide"
}

variable "jwt_secret" {
  description = "Secret key for JWT tokens (generate with: openssl rand -hex 32)"
  type        = string
  sensitive   = true
}

# =============================================================================
# Domain & SSL Configuration (Optional)
# =============================================================================

variable "domain_name" {
  description = "Custom domain name (e.g., cloudgraph.example.com). Leave empty to use CloudFront domain."
  type        = string
  default     = ""
}

variable "acm_certificate_arn" {
  description = "ARN of ACM certificate for custom domain. Required if domain_name is set."
  type        = string
  default     = ""
}

# =============================================================================
# GitHub Actions CI/CD
# =============================================================================

variable "github_repository" {
  description = "GitHub repository in format 'owner/repo' for OIDC authentication"
  type        = string
  default     = "*/*" # Default allows any repo - restrict in production!
}

# =============================================================================
# AWS Credentials for App (Optional)
# =============================================================================

variable "app_aws_access_key_id" {
  description = "AWS Access Key ID for the application (for live AWS data fetching)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "app_aws_secret_access_key" {
  description = "AWS Secret Access Key for the application"
  type        = string
  sensitive   = true
  default     = ""
}
