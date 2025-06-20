#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Setting up PostgreSQL for Futuristic Mail${NC}"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker and try again.${NC}"
    exit 1
fi

# Start PostgreSQL
echo -e "${BLUE}Starting PostgreSQL container...${NC}"
docker compose up -d postgres

# Wait for PostgreSQL to be ready
echo -e "${BLUE}Waiting for PostgreSQL to be ready...${NC}"
sleep 5

# Check if PostgreSQL is ready
until docker compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; do
    echo -n "."
    sleep 1
done
echo ""

echo -e "${GREEN}✅ PostgreSQL is ready!${NC}"

# Optional: Start Adminer
read -p "Do you want to start Adminer (database UI)? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker compose up -d adminer
    echo -e "${GREEN}✅ Adminer is available at http://localhost:8080${NC}"
    echo -e "   Login with: Server=postgres, Username=postgres, Password=postgres"
fi

echo ""
echo -e "${GREEN}✅ Database setup complete!${NC}"
echo ""
echo -e "${BLUE}Connection details:${NC}"
echo -e "  Host: localhost"
echo -e "  Port: 5432"
echo -e "  Database: futuristic_mail"
echo -e "  Username: postgres"
echo -e "  Password: postgres"
echo ""
echo -e "${BLUE}Connection string:${NC}"
echo -e "  DATABASE_URL=postgres://postgres:postgres@localhost:5432/futuristic_mail"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo -e "  1. Copy .env.example to .env: ${GREEN}cp .env.example .env${NC}"
echo -e "  2. Run migrations: ${GREEN}bun run db:push${NC}"
echo -e "  3. (Optional) Open Drizzle Studio: ${GREEN}bun run db:studio${NC}"
echo ""
echo -e "${BLUE}To stop the database:${NC} ${GREEN}docker compose down${NC}"
echo -e "${BLUE}To stop and remove all data:${NC} ${GREEN}docker compose down -v${NC}"