SELECT b.id, p.nome, b.titulo, b.resumo FROM core.briefings b LEFT JOIN hub.parlamentares p ON b.parlamentar_id = p.id;
