SELECT 
    bc.id,
    bc.titulo,
    bc.descricao,
    bc.acao as acao_sugerida,
    UPPER(bc.prioridade) as prioridade,
    p.nome as origem,
    b.data_referencia as data_publicacao
FROM core.briefing_cards bc
JOIN core.briefings b ON bc.briefing_id = b.id
LEFT JOIN hub.parlamentares p ON b.parlamentar_id = p.id
ORDER BY b.data_referencia DESC, bc.created_at DESC
LIMIT 20;
