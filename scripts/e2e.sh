#!/usr/bin/env bash

psql_ready() {
    pg_isready --dbname=postgres --host=localhost --port=8001 --username=postgres > /dev/null 2>&1
}

docker-compose up -d

while !(psql_ready)
do
    echo "waiting for test DB to start..."
    sleep 3
done

echo "Database started!"

dotenv -e .env.test -- npx prisma migrate deploy

echo "Migrations complete. Running tests."

dotenv -e .env.test -- npx playwright test

echo "Tests complete. Tearing down DB."

docker-compose down -v