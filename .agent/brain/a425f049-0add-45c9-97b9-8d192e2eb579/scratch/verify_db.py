import psycopg2
import sys

try:
    conn = psycopg2.connect(
        host="69.62.103.45",
        port="5432",
        database="portelaapp",
        user="portela_hub",
        password="Master@2026"
    )
    cur = conn.cursor()
    
    # Check connection
    cur.execute("SELECT version();")
    record = cur.fetchone()
    print("Conexão estabelecida com sucesso!")
    print(f"Versão do PostgreSQL: {record[0]}")
    
    # List tables
    cur.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
    """)
    tables = cur.fetchall()
    print("\nTabelas encontradas no esquema 'public':")
    for table in tables:
        print(f"- {table[0]}")
    
    cur.close()
    conn.close()
except Exception as e:
    print(f"Erro ao conectar ao banco de dados: {e}")
    sys.exit(1)
