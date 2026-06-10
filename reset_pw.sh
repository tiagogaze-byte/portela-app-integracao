HASH="\$2b\$10\$dvE.oN9scsFwyH0F.zdWe.HM2levZASjeYjnjFMHlqINDE2pZ422i"
docker exec -i postgres_postgres.1.$(docker service ps -q postgres_postgres | head -n1) psql -U portela_hub -d portelaapp -c "UPDATE core.usuarios SET senha_hash='$HASH' WHERE email='master@portela.app';"
echo "Senha de master@portela.app redefinida com sucesso."
