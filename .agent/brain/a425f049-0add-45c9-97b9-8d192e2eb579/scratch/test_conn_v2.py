import psycopg2
import sys

host = "69.62.103.45".strip()
port = "5432".strip()
database = "portelaapp".strip()
user = "portela_hub".strip()
password = "Master@2026".strip()

print(f"Tentando conectar com Usuário: '{user}' no Host: '{host}'...")

try:
    conn = psycopg2.connect(
        host=host,
        port=port,
        database=database,
        user=user,
        password=password
    )
    print("Conexão estabelecida com sucesso!")
    conn.close()
except Exception as e:
    print(f"Erro: {e}")
    sys.exit(1)
