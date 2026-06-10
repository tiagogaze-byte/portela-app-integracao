CONTAINER=$(docker ps | grep portela-hub-backend_hub | head -n1 | awk '{print $1}')
docker exec $CONTAINER cat package.json
