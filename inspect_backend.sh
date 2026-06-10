CONTAINER=$(docker ps | grep portela-hub-backend_hub | awk '{print $1}')
docker exec $CONTAINER grep -A 20 -B 5 "login" /usr/src/app/src/controllers/authController.ts || docker exec $CONTAINER grep -A 20 -B 5 "login" /app/src/controllers/authController.ts || docker exec $CONTAINER cat /usr/src/app/package.json || docker exec $CONTAINER cat /app/package.json
