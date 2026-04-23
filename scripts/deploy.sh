#!/bin/bash

# Exit on error
set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting deployment...${NC}"
git pull

# Build and start Docker containers
echo -e "${BLUE}🐳 Building and starting Docker containers...${NC}"
sudo docker compose up -d --build

# Wait for the application to be ready
echo -e "${BLUE}⏳ Waiting for application to be ready...${NC}"
sleep 10

status=0

# Check if the application is running
if curl -s http://leafy.lan/api/plants > /dev/null; then
    echo -e "${GREEN}✅ Application is running successfully!${NC}"
    echo -e "${GREEN}🌐 Access the application at: http://leafy.lan/${NC}" #this is only true if you have setup a dns record on your router
else
    echo -e "${RED}❌ Application failed to start${NC}"
    status=1
fi

echo -e "${BLUE}📝 Checking logs...${NC}"
sudo docker compose logs

echo -e "${BLUE}🧹 Cleaning up old images...${NC}"
sudo docker image prune -f

exit $status
 
