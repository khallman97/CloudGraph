# =============================================================================
# Outputs
# =============================================================================

# -----------------------------------------------------------------------------
# Application URLs
# -----------------------------------------------------------------------------

output "app_url" {
  description = "CloudFront URL (main application URL)"
  value       = "https://${aws_cloudfront_distribution.main.domain_name}"
}

output "api_url" {
  description = "API URL (via CloudFront)"
  value       = "https://${aws_cloudfront_distribution.main.domain_name}/api"
}

output "custom_domain_url" {
  description = "Custom domain URL (if configured)"
  value       = var.domain_name != "" ? "https://${var.domain_name}" : "No custom domain configured"
}

# -----------------------------------------------------------------------------
# CloudFront
# -----------------------------------------------------------------------------

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID (for cache invalidation)"
  value       = aws_cloudfront_distribution.main.id
}

output "cloudfront_domain_name" {
  description = "CloudFront domain name"
  value       = aws_cloudfront_distribution.main.domain_name
}

# -----------------------------------------------------------------------------
# S3
# -----------------------------------------------------------------------------

output "frontend_bucket_name" {
  description = "S3 bucket name for frontend deployment"
  value       = aws_s3_bucket.frontend.id
}

output "frontend_bucket_arn" {
  description = "S3 bucket ARN"
  value       = aws_s3_bucket.frontend.arn
}

# -----------------------------------------------------------------------------
# EC2 (Backend)
# -----------------------------------------------------------------------------

output "backend_instance_id" {
  description = "Backend EC2 instance ID"
  value       = aws_instance.backend.id
}

output "backend_public_ip" {
  description = "Backend EC2 public IP"
  value       = aws_eip.backend.public_ip
}

output "backend_direct_url" {
  description = "Direct backend URL (for debugging, bypass CloudFront)"
  value       = "http://${aws_eip.backend.public_ip}:8000"
}

output "ssh_command" {
  description = "SSH command to connect to backend instance"
  value       = var.key_name != "" ? "ssh -i ${var.key_name}.pem ec2-user@${aws_eip.backend.public_ip}" : "No SSH key configured"
}

# -----------------------------------------------------------------------------
# RDS
# -----------------------------------------------------------------------------

output "rds_endpoint" {
  description = "RDS PostgreSQL endpoint"
  value       = aws_db_instance.main.endpoint
}

output "rds_database_name" {
  description = "RDS database name"
  value       = aws_db_instance.main.db_name
}

# -----------------------------------------------------------------------------
# ECR
# -----------------------------------------------------------------------------

output "ecr_repository_url" {
  description = "ECR repository URL for backend image"
  value       = aws_ecr_repository.backend.repository_url
}

output "ecr_repository_name" {
  description = "ECR repository name"
  value       = aws_ecr_repository.backend.name
}

# -----------------------------------------------------------------------------
# GitHub Actions
# -----------------------------------------------------------------------------

output "github_actions_role_arn" {
  description = "IAM role ARN for GitHub Actions"
  value       = aws_iam_role.github_actions.arn
}

# -----------------------------------------------------------------------------
# Deployment Commands
# -----------------------------------------------------------------------------

output "deploy_frontend_command" {
  description = "Command to deploy frontend to S3"
  value       = <<-EOT

    # Build and deploy frontend
    cd frontend
    VITE_API_URL=https://${aws_cloudfront_distribution.main.domain_name} npm run build
    aws s3 sync dist/ s3://${aws_s3_bucket.frontend.id} --delete
    aws cloudfront create-invalidation --distribution-id ${aws_cloudfront_distribution.main.id} --paths "/*"

  EOT
}

output "deploy_backend_command" {
  description = "Commands to deploy backend"
  value       = <<-EOT

    # SSH into backend server
    ${var.key_name != "" ? "ssh -i ${var.key_name}.pem ec2-user@${aws_eip.backend.public_ip}" : "# Configure SSH key first"}

    # On the server:
    cd /opt/cloudgraph
    git clone https://github.com/YOUR_USERNAME/cloudgraph-ide.git .
    docker-compose up -d --build

  EOT
}

# -----------------------------------------------------------------------------
# Summary
# -----------------------------------------------------------------------------

output "github_secrets_setup" {
  description = "GitHub repository secrets to configure"
  value       = <<-EOT

    ╔══════════════════════════════════════════════════════════════════╗
    ║              GITHUB ACTIONS SECRETS SETUP                        ║
    ╠══════════════════════════════════════════════════════════════════╣
    ║                                                                   ║
    ║  Add these secrets to your GitHub repository:                    ║
    ║  (Settings → Secrets and variables → Actions → New secret)       ║
    ║                                                                   ║
    ║  AWS_ROLE_ARN                 = ${aws_iam_role.github_actions.arn}
    ║  ECR_REPOSITORY_NAME          = ${aws_ecr_repository.backend.name}
    ║  S3_BUCKET_NAME               = ${aws_s3_bucket.frontend.id}
    ║  CLOUDFRONT_DISTRIBUTION_ID   = ${aws_cloudfront_distribution.main.id}
    ║  CLOUDFRONT_URL               = https://${aws_cloudfront_distribution.main.domain_name}
    ║  EC2_HOST                     = ${aws_eip.backend.public_ip}
    ║  BACKEND_URL                  = http://${aws_eip.backend.public_ip}:8000
    ║  EC2_SSH_PRIVATE_KEY          = <contents of your .pem file>
    ║                                                                   ║
    ╚══════════════════════════════════════════════════════════════════╝

  EOT
}

output "deployment_summary" {
  description = "Deployment summary and next steps"
  value       = <<-EOT

    ╔══════════════════════════════════════════════════════════════════╗
    ║                    CLOUDGRAPH IDE DEPLOYED!                       ║
    ╠══════════════════════════════════════════════════════════════════╣
    ║                                                                   ║
    ║  Architecture:                                                    ║
    ║  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐        ║
    ║  │ CloudFront  │────▶│  S3 Bucket  │     │    RDS      │        ║
    ║  │   (CDN)     │     │ (Frontend)  │     │ (PostgreSQL)│        ║
    ║  └──────┬──────┘     └─────────────┘     └──────▲──────┘        ║
    ║         │ /api/*                                │               ║
    ║         ▼                                       │               ║
    ║  ┌─────────────┐                                │               ║
    ║  │    EC2      │────────────────────────────────┘               ║
    ║  │  (Backend)  │                                                ║
    ║  └─────────────┘                                                ║
    ║                                                                   ║
    ╠══════════════════════════════════════════════════════════════════╣
    ║  URLS:                                                           ║
    ║    App:     https://${aws_cloudfront_distribution.main.domain_name}
    ║    API:     https://${aws_cloudfront_distribution.main.domain_name}/api
    ║    Backend: http://${aws_eip.backend.public_ip}:8000 (direct)
    ║                                                                   ║
    ╠══════════════════════════════════════════════════════════════════╣
    ║  NEXT STEPS:                                                     ║
    ║                                                                   ║
    ║  1. Deploy Backend:                                              ║
    ║     ${var.key_name != "" ? "ssh -i ${var.key_name}.pem ec2-user@${aws_eip.backend.public_ip}" : "# Configure SSH key"}
    ║     cd /opt/cloudgraph                                           ║
    ║     git clone YOUR_REPO .                                        ║
    ║     docker-compose up -d --build                                 ║
    ║                                                                   ║
    ║  2. Deploy Frontend:                                             ║
    ║     cd frontend                                                  ║
    ║     VITE_API_URL=https://${aws_cloudfront_distribution.main.domain_name} npm run build
    ║     aws s3 sync dist/ s3://${aws_s3_bucket.frontend.id} --delete
    ║     aws cloudfront create-invalidation \                         ║
    ║       --distribution-id ${aws_cloudfront_distribution.main.id} \
    ║       --paths "/*"                                               ║
    ║                                                                   ║
    ╚══════════════════════════════════════════════════════════════════╝

  EOT
}
