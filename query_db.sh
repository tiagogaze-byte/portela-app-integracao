docker exec -i postgres_postgres.1.w9nj5u5pd6msjy8lxib05vpky psql -U portela_hub -d portelaapp -c "SELECT password_hash FROM core.usuarios WHERE email='master@portela.app';"
