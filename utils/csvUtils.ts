// utils/csvUtils.ts

export const downloadCSVTemplate = (tableName: string) => {
    let headers = '';
    let exampleRow = '';
    let fileName = `template_${tableName}.csv`;

    switch (tableName) {
        case 'liderancas':
            headers = 'nome,cargo,telefone,municipio,regiao,partido,origem,notas,status,nivel_influencia';
            exampleRow = 'João Silva,Prefeito,31999999999,Belo Horizonte,Central,PT,Alê Portela,Apoio forte,Ativo,Alta';
            break;
        case 'assessores':
            headers = 'nome,telefone,regiaoAtuacao,municipiosCobertos,cargo,notas';
            exampleRow = 'Maria Oliveira,31988888888,Norte de Minas,Montes Claros; Janaúba,Assessor Parlamentar,Foco em saúde';
            break;
        case 'briefings':
            headers = 'titulo,descricao,acao_sugerida,origem,prioridade';
            exampleRow = 'Pauta de Infraestrutura,Acompanhar obra da BR-381,Sugerir nota nas redes,Lincoln Portela,ALTA';
            break;
        case 'votos_eleicoes':
            headers = 'municipio_id,ano_eleicao,cargo,candidato,origem,votos,percentual_validos';
            exampleRow = '1,2022,Deputado Federal,Lincoln Portela,Lincoln Portela,5000,15.5';
            break;
        case 'municipios':
            headers = 'nome,regiao,populacao,pib,perfilEconomico,historicoPolitico,statusAtividade,prioridade';
            exampleRow = 'Belo Horizonte,Central,2500000,100000000,Serviços,Capital do Estado,Consolidado,Alta';
            break;
        default:
            console.error('Tabela não reconhecida para exportação de template CSV');
            return;
    }

    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + exampleRow;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", fileName);
    document.body.appendChild(link); // Required for FF
    link.click();
    document.body.removeChild(link);
};
