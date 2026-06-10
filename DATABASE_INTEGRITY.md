# Relatório de Integridade e Conectividade do Banco de Dados - Portela App

Este documento registra o diagnóstico de conectividade realizado nas instâncias de dados e infraestrutura da VPS do **Portela Hub**, após a manutenção global dos servidores.

---

## 📊 Status Atual de Conexão

| Componente | Canal / Porta | Status | Detalhes / Resposta |
| :--- | :--- | :---: | :--- |
| **API Web (Portela API)** | HTTPS (`hub-api.portela.app:443`) | 🟢 **ONLINE** | Respondendo com status HTTP `404 Not Found` (serviço ativo). |
| **Conexão SSH (Transporte MCP)** | SSH (`69.62.103.45:22`) | 🔴 **TIMEOUT** | `ssh: connect to host 69.62.103.45 port 22: Operation timed out`. |
| **Banco de Dados (PostgreSQL)** | PostgreSQL (`10.0.1.252:5432`) | 🟡 **INACESSÍVEL** | Dependente do túnel SSH para inicialização do MCP. |

---

## 🔍 Diagnóstico e Análise Técnica

### 1. Teste de Acessibilidade HTTP (Porta 443)
Para isolar o problema e confirmar se a VPS estava ativa, realizamos uma requisição de rede direta na URL da API de produção. A VPS respondeu prontamente, confirmando que a infraestrutura física está online e que a aplicação está executando:
- **Destino:** `https://hub-api.portela.app`
- **Resultado:** Retornou cabeçalhos de rede válidos (Nginx/Node.js) com status `404`.

### 2. Teste de Túnel SSH (Porta 22)
Ao testar a conexão SSH utilizando a chave local criptografada em `~/.ssh/id_james_local` (com permissões seguras `600`), a conexão falhou:
- **Comando Executado:** `ssh -o StrictHostKeyChecking=no -o BatchMode=yes -p 22 -i ~/.ssh/id_james_local james_dev@69.62.103.45`
- **Resultado:** A requisição expirou por tempo limite (**Operation timed out**).

---

## 💡 Causa Raiz Provável

A disparidade entre a porta **443 (HTTPS)** respondendo normalmente e a porta **22 (SSH)** caindo em timeout aponta para dois cenários prováveis ocorridos durante a manutenção de infraestrutura:

1. **Bloqueio por Regras de Firewall (IP de Origem):**
   O firewall nativo da VPS (ex: `ufw` / `iptables` ou painel do provedor de nuvem) pode ter sido reconfigurado para permitir conexões SSH apenas a partir de endereços de IP estáticos permitidos. Como os provedores de internet residencial mudam periodicamente o IP público do usuário, a sua máquina pode ter recebido um novo IP que atualmente não está na lista de permissões da VPS.
   
2. **Alteração da Porta Padrão do SSH:**
   Para fins de segurança da informação, o administrador da VPS pode ter configurado o daemon do SSH (`sshd_config`) para escutar em uma porta alternativa (ex: `2222`, `222`, `8022`), mas o arquivo `mcp_config.json` ainda está configurado para buscar a porta padrão `22`.

---

## 🚀 Próximas Ações Recomendadas

Para restaurar o acesso total e carregar a lista de tabelas e contagem de registros no relatório final:

1. **Liberar IP de Origem na VPS:**
   Verificar com o gestor global se o seu IP de internet atual precisa ser adicionado à lista de liberação de segurança (whitelist) da VPS.
   
2. **Confirmar a Porta do SSH:**
   Garantir se a porta de escuta do serviço SSH foi modificada durante o procedimento de limpeza do Docker e PM2.
   
3. **Atualização de Configuração:**
   Assim que a nova porta ou liberação de IP for definida, faremos o ajuste imediato no arquivo `mcp_config.json` para que as ferramentas `vps_james_sql` e `vps_james_portela` voltem a sincronizar de forma automática e transparente.

---

*Documento gerado de forma autônoma pela equipe de Arquitetura de Banco de Dados em 26 de Maio de 2026.*
