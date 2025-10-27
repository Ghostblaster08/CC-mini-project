#!/bin/bash

# Ashray Pharmacy System - EC2 Setup Script
# Run this script on your EC2 instance after connecting via SSH

set -e

echo "========================================="
echo "Ashray Pharmacy System - EC2 Setup"
echo "========================================="

# Update system
echo "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
echo "Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# Install Git
echo "Installing Git..."
sudo apt install -y git

# Install PM2 globally
echo "Installing PM2 process manager..."
sudo npm install -g pm2

# Install Nginx
echo "Installing Nginx..."
sudo apt install -y nginx

# Install UFW firewall
echo "Setting up firewall..."
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw allow 5000/tcp
sudo ufw --force enable

echo "========================================="
echo "Setup Complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Clone your repository:"
echo "   git clone https://github.com/Ghostblaster08/CC-mini-project.git"
echo ""
echo "2. Navigate to server directory:"
echo "   cd CC-mini-project/server"
echo ""
echo "3. Install dependencies:"
echo "   npm install"
echo ""
echo "4. Create .env file:"
echo "   cp .env.example .env"
echo "   nano .env"
echo ""
echo "5. Start the application:"
echo "   pm2 start server.js --name ashray-api"
echo "   pm2 save"
echo "   pm2 startup"
echo ""
echo "========================================="
