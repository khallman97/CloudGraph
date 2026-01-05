#!/bin/bash
# CloudGraph IDE - EC2 Backend Setup
# This script is templated by Terraform

set -e
exec > >(tee /var/log/user-data.log) 2>&1

echo "=========================================="
echo "CloudGraph IDE - Backend Setup"
echo "Started at: $(date)"
echo "=========================================="

# Update system
dnf update -y

# Install Docker and AWS CLI
dnf install -y docker git aws-cli
systemctl start docker
systemctl enable docker
usermod -aG docker ec2-user

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose

# Create app directory
APP_DIR=/opt/cloudgraph
mkdir -p $APP_DIR
cd $APP_DIR

# Create environment file
cat > $APP_DIR/.env << 'ENVEOF'
# Database Configuration (RDS)
DATABASE_URL=postgresql://cloudgraph:${db_password}@${db_host}:5432/cloudgraph

# JWT Secret
SECRET_KEY=${jwt_secret}

# AWS Region
AWS_DEFAULT_REGION=${aws_region}

# ECR Configuration
ECR_REGISTRY=${ecr_registry}
ECR_REPOSITORY=${ecr_repository}

# AWS Credentials for live data (optional)
%{ if app_aws_access_key_id != "" ~}
AWS_ACCESS_KEY_ID=${app_aws_access_key_id}
AWS_SECRET_ACCESS_KEY=${app_aws_secret_access_key}
%{ endif ~}
ENVEOF

chmod 600 $APP_DIR/.env

# Create docker-compose for ECR-based deployment
cat > $APP_DIR/docker-compose.yaml << 'COMPOSEEOF'
services:
  backend:
    image: ${ECR_REGISTRY}/${ECR_REPOSITORY}:latest
    restart: always
    env_file:
      - .env
    ports:
      - "8000:8000"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
COMPOSEEOF

# Create helper script for manual deployments
cat > $APP_DIR/deploy.sh << 'DEPLOYEOF'
#!/bin/bash
set -e

# Load environment
source /opt/cloudgraph/.env

echo "Logging into ECR..."
aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY

echo "Pulling latest image..."
docker pull $ECR_REGISTRY/$ECR_REPOSITORY:latest

echo "Restarting containers..."
docker-compose down
docker-compose up -d

echo "Cleaning up old images..."
docker image prune -af

echo "Deployment complete!"
docker-compose ps
DEPLOYEOF

chmod +x $APP_DIR/deploy.sh

# Create README
cat > $APP_DIR/README.md << 'READMEEOF'
# CloudGraph IDE - Backend Server

This EC2 instance runs the FastAPI backend from ECR.
- Images are built by GitHub Actions and pushed to ECR
- Frontend is served from S3 via CloudFront
- Database is hosted on RDS

## Deployment

Deployments are automatic via GitHub Actions when you push to main.

### Manual Deployment

If needed, run:
```bash
cd /opt/cloudgraph
./deploy.sh
```

### Useful Commands

```bash
# View logs
docker-compose logs -f backend

# Restart
docker-compose restart

# Check status
docker-compose ps

# View environment
cat .env
```

## First-Time Setup

If this is a fresh deployment and no image exists in ECR yet:

1. Push code to GitHub to trigger the first build
2. Or build and push manually:
   ```bash
   cd your-local-repo/backend
   docker build -t YOUR_ECR_URL:latest .
   aws ecr get-login-password | docker login --username AWS --password-stdin YOUR_ECR_URL
   docker push YOUR_ECR_URL:latest
   ```
3. Then on EC2: `./deploy.sh`
READMEEOF

chown -R ec2-user:ec2-user $APP_DIR

echo "=========================================="
echo "Backend setup complete at: $(date)"
echo "Database: ${db_host}"
echo "ECR: ${ecr_registry}/${ecr_repository}"
echo ""
echo "Next steps:"
echo "1. Push to GitHub to trigger first build"
echo "2. Or manually run: /opt/cloudgraph/deploy.sh"
echo "=========================================="
