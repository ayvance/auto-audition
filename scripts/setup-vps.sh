#!/bin/bash

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install ffmpeg (Required for video processing)
sudo apt install -y ffmpeg

# Setup Directory
sudo mkdir -p /var/www/auto-audition
sudo chown -R $USER:$USER /var/www/auto-audition

# Setup Swap (Crucial for low memory VPS)
# Check if swap exists
if [ $(sudo swapon --show | wc -l) -eq 0 ]; then
    echo "Setting up 2GB Swap..."
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    echo "Swap created."
else
    echo "Swap already exists."
fi

echo "Setup complete! Please configure your git repo in /var/www/auto-audition"
