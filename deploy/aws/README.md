# CloudGraph IDE - AWS Deployment (Free Tier)

Deploy CloudGraph IDE to AWS using Terraform with a production-ready architecture.

## Architecture

```
                         ┌─────────────────────────────────────┐
                         │            CloudFront               │
     Users ─────────────▶│  (CDN + HTTPS + Edge Caching)      │
                         └──────────────┬──────────────────────┘
                                        │
                    ┌───────────────────┼───────────────────┐
                    │                   │                   │
                    ▼                   ▼                   │
            ┌───────────────┐   ┌───────────────┐          │
            │  S3 Bucket    │   │     EC2       │          │
            │  (Frontend)   │   │  (Backend)    │          │
            │               │   │   FastAPI     │          │
            │  React Build  │   │   :8000       │          │
            └───────────────┘   └───────┬───────┘          │
                                        │                   │
                                        ▼                   │
                                ┌───────────────┐          │
                                │     RDS       │          │
                                │  PostgreSQL   │          │
                                │  (Managed)    │          │
                                └───────────────┘          │
                                                           │
                         Free Tier Eligible ───────────────┘
```

## Free Tier Resources

| Resource | Type | Free Tier Allowance |
|----------|------|---------------------|
| EC2 | t2.micro | 750 hrs/month (12 months) |
| RDS | db.t3.micro | 750 hrs/month (12 months) |
| S3 | Standard | 5GB storage, 20K GET, 2K PUT |
| CloudFront | - | 1TB transfer, 10M requests/month |
| EBS | gp2 | 30GB total |

**Estimated cost: $0/month** (within free tier for first 12 months)

---

## Prerequisites

1. **AWS Account** with free tier eligibility
2. **AWS CLI** installed and configured (`aws configure`)
3. **Terraform** >= 1.0 installed
4. **SSH Key Pair** created in AWS Console (EC2 → Key Pairs)

---

## Quick Start

### 1. Configure Variables

```bash
cd deploy/aws/terraform

# Copy example and edit
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars`:
```hcl
# Required
db_password = "your-secure-password"    # Database password
jwt_secret  = "$(openssl rand -hex 32)" # Generate this

# Recommended
key_name          = "your-key-pair-name"
allowed_ssh_cidrs = ["YOUR_IP/32"]      # Find at ifconfig.me
```

### 2. Deploy Infrastructure

```bash
# Initialize Terraform
terraform init

# Preview changes
terraform plan

# Deploy (takes ~10-15 minutes for RDS)
terraform apply
```

### 3. Deploy Backend

```bash
# SSH into the server (command shown in terraform output)
ssh -i your-key.pem ec2-user@<BACKEND_IP>

# Clone your repository
cd /opt/cloudgraph
git clone https://github.com/YOUR_USERNAME/cloudgraph-ide.git .

# Start the backend
docker-compose up -d --build

# Verify it's running
docker-compose logs -f
```

### 4. Deploy Frontend

```bash
# From your local machine
cd frontend

# Build with the CloudFront URL
VITE_API_URL=https://<CLOUDFRONT_DOMAIN> npm run build

# Deploy to S3
aws s3 sync dist/ s3://<BUCKET_NAME> --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id <DISTRIBUTION_ID> \
  --paths "/*"
```

Or use the deployment script:
```bash
./deploy/aws/scripts/deploy-frontend.sh
```

### 5. Access Your Application

After deployment, Terraform outputs will show:
- **App URL**: `https://d1234567890.cloudfront.net`
- **API URL**: `https://d1234567890.cloudfront.net/api`

---

## Terraform Outputs

After `terraform apply`, you'll see:

```
app_url                    = "https://d1234567890.cloudfront.net"
api_url                    = "https://d1234567890.cloudfront.net/api"
frontend_bucket_name       = "cloudgraph-ide-prod-frontend-123456789"
cloudfront_distribution_id = "E1234567890ABC"
backend_public_ip          = "54.123.45.67"
rds_endpoint              = "cloudgraph-ide-prod-db.abc123.us-east-1.rds.amazonaws.com:5432"
ssh_command               = "ssh -i your-key.pem ec2-user@54.123.45.67"
```

---

## File Structure

```
deploy/aws/
├── README.md                    # This file
├── scripts/
│   └── deploy-frontend.sh       # Frontend deployment script
└── terraform/
    ├── providers.tf             # AWS provider config
    ├── variables.tf             # Input variables
    ├── main.tf                  # EC2, RDS, S3, CloudFront, ECR, IAM
    ├── outputs.tf               # Output values
    ├── user-data.sh             # EC2 bootstrap script
    ├── terraform.tfvars.example # Example configuration
    └── .gitignore               # Ignore sensitive files

.github/workflows/
├── deploy-backend.yml           # Backend CI/CD (ECR + EC2)
└── deploy-frontend.yml          # Frontend CI/CD (S3 + CloudFront)
```

---

## CI/CD with GitHub Actions

Automatic deployments are triggered when you push to `main`:
- **Backend changes** (`backend/**`) → Build Docker image → Push to ECR → Deploy to EC2
- **Frontend changes** (`frontend/**`) → Build React → Sync to S3 → Invalidate CloudFront

### Setup GitHub Actions

After running `terraform apply`, configure these GitHub repository secrets:

| Secret | Value | Where to find |
|--------|-------|---------------|
| `AWS_ROLE_ARN` | IAM role ARN for GitHub | `terraform output github_actions_role_arn` |
| `ECR_REPOSITORY_NAME` | ECR repo name | `terraform output ecr_repository_name` |
| `S3_BUCKET_NAME` | S3 bucket name | `terraform output frontend_bucket_name` |
| `CLOUDFRONT_DISTRIBUTION_ID` | Distribution ID | `terraform output cloudfront_distribution_id` |
| `CLOUDFRONT_URL` | CloudFront URL | `terraform output app_url` |
| `EC2_HOST` | Backend EC2 IP | `terraform output backend_public_ip` |
| `EC2_SSH_PRIVATE_KEY` | SSH private key | Contents of your .pem file |
| `BACKEND_URL` | Direct backend URL | `terraform output backend_direct_url` |

### How It Works

1. **Push to main** triggers the appropriate workflow
2. **GitHub authenticates to AWS** using OIDC (no stored credentials!)
3. **Backend workflow**:
   - Builds Docker image
   - Pushes to ECR with commit SHA tag
   - SSHs into EC2 and pulls the new image
   - Restarts the container
4. **Frontend workflow**:
   - Builds React app with production API URL
   - Syncs to S3 with proper cache headers
   - Invalidates CloudFront cache

### Manual Trigger

You can also manually trigger deployments from the GitHub Actions tab.

---

## Custom Domain (Optional)

To use your own domain:

1. **Create ACM Certificate** (must be in us-east-1 for CloudFront):
   ```bash
   aws acm request-certificate \
     --domain-name cloudgraph.yourdomain.com \
     --validation-method DNS \
     --region us-east-1
   ```

2. **Validate the certificate** via DNS (add CNAME record)

3. **Update terraform.tfvars**:
   ```hcl
   domain_name         = "cloudgraph.yourdomain.com"
   acm_certificate_arn = "arn:aws:acm:us-east-1:123456789:certificate/abc-123"
   ```

4. **Apply changes**:
   ```bash
   terraform apply
   ```

5. **Update DNS**: Point your domain to the CloudFront distribution

---

## Updating the Application

### Update Backend
```bash
ssh -i your-key.pem ec2-user@<BACKEND_IP>
cd /opt/cloudgraph
git pull
docker-compose up -d --build
```

### Update Frontend
```bash
cd frontend
VITE_API_URL=https://<CLOUDFRONT_DOMAIN> npm run build
aws s3 sync dist/ s3://<BUCKET_NAME> --delete
aws cloudfront create-invalidation --distribution-id <ID> --paths "/*"
```

---

## Troubleshooting

### Check Backend Logs
```bash
ssh -i your-key.pem ec2-user@<BACKEND_IP>
docker-compose logs -f
```

### Check EC2 User Data Logs
```bash
sudo cat /var/log/user-data.log
```

### Test Backend Directly
```bash
curl http://<BACKEND_IP>:8000/health
curl http://<BACKEND_IP>:8000/docs
```

### RDS Connection Issues
- Ensure security group allows EC2 → RDS on port 5432
- Check RDS is in the same VPC/subnets as EC2

### CloudFront 502/504 Errors
- Backend might not be running: check `docker-compose ps`
- Security group might not allow port 8000 from CloudFront

---

## Cleanup

To destroy all resources:

```bash
cd deploy/aws/terraform
terraform destroy
```

**Warning**: This will delete:
- EC2 instance
- RDS database (and all data!)
- S3 bucket (and all files!)
- CloudFront distribution
