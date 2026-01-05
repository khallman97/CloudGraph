#!/bin/bash
# CloudGraph IDE - EC2 Setup Script
# Run this on a fresh Amazon Linux 2023 or Ubuntu 22.04 instance
#
# Usage:
#   chmod +x setup.sh
#   ./setup.sh
#
# Or as user-data (paste into EC2 launch wizard):
#   #!/bin/bash
#   curl -fsSL https://raw.githubusercontent.com/YOUR_REPO/main/deploy/aws/setup.sh | bash

set -e

echo "=========================================="
echo "CloudGraph IDE - EC2 Setup"
echo "=========================================="

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
else
    echo "Cannot detect OS"
    exit 1
fi

echo "Detected OS: $OS"

# Install Docker
echo "Installing Docker..."
if [ "$OS" = "amzn" ]; then
    # Amazon Linux 2023
    sudo dnf update -y
    sudo dnf install -y docker git
    sudo systemctl start docker
    sudo systemctl enable docker
    sudo usermod -aG docker ec2-user
elif [ "$OS" = "ubuntu" ]; then
    # Ubuntu
    sudo apt-get update
    sudo apt-get install -y ca-certificates curl gnupg
    sudo install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    sudo chmod a+r /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin git
    sudo usermod -aG docker ubuntu
else
    echo "Unsupported OS: $OS"
    exit 1
fi

# Install Docker Compose (standalone, for Amazon Linux)
if [ "$OS" = "amzn" ]; then
    echo "Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    sudo ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
fi

# Verify installations
echo "Verifying installations..."
docker --version
docker-compose --version || docker compose version

# Create app directory
APP_DIR=/opt/cloudgraph
echo "Creating application directory: $APP_DIR"
sudo mkdir -p $APP_DIR
sudo chown $(whoami):$(whoami) $APP_DIR

# Clone repository (replace with your actual repo URL)
echo "=========================================="
echo "NEXT STEPS:"
echo "=========================================="
echo ""
echo "1. Clone your repository:"
echo "   cd $APP_DIR"
echo "   git clone https://github.com/YOUR_USERNAME/cloudgraph-ide.git ."
echo ""
echo "2. Or copy files manually:"
echo "   scp -r ./backend ./frontend ./docker-compose.yaml ec2-user@YOUR_IP:$APP_DIR/"
echo ""
echo "3. Create environment file:"
echo "   cat > $APP_DIR/.env << 'EOF'"
echo "   # Database"
echo "   DATABASE_URL=postgresql://cloudgraph:cloudgraph@db:5432/cloudgraph"
echo "   "
echo "   # JWT Secret (generate with: openssl rand -hex 32)"
echo "   SECRET_KEY=your-secret-key-here"
echo "   "
echo "   # AWS Credentials (optional - for live AWS data)"
echo "   AWS_ACCESS_KEY_ID="
echo "   AWS_SECRET_ACCESS_KEY="
echo "   AWS_DEFAULT_REGION=us-east-1"
echo "   EOF"
echo ""
echo "4. Start the application:"
echo "   cd $APP_DIR"
echo "   docker-compose up -d --build"
echo ""
echo "5. Access the application:"
echo "   http://YOUR_PUBLIC_IP:5173  (Frontend)"
echo "   http://YOUR_PUBLIC_IP:8000  (Backend API)"
echo ""
echo "=========================================="
echo "Setup complete! Follow the steps above."
echo "=========================================="
