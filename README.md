# 🗺️ turismo-llm

## ✨ Visão Geral

O **turismo-ai** é um sistema automatizado de auditoria e fiscalização digital desenvolvido para auxiliar órgãos públicos na gestão e monitoramento de pontos turísticos. A ferramenta resolve o problema da ineficiência e do alto custo da fiscalização manual, antecipando-se aos problemas ao transformar relatos espontâneos da internet em dados acionáveis antes mesmo de virarem denúncias formais.

**Objetivo:** Coletar, processar e categorizar automaticamente comentários de grandes plataformas turísticas utilizando Modelos de Linguagem (LLMs), permitindo que a administração pública identifique irregularidades, riscos de segurança e descumprimentos de normas de forma rápida e inteligente.

## 🔑 Funcionalidades Chave

O sistema opera com base em três pilares principais:

* **📥 Coleta Automatizada (Scraping):**
    * Monitoramento e extração de comentários de plataformas como Google Maps, TripAdvisor e Reclame Aqui.
* **🤖 Triagem Inteligente (LLM):**
    * Processamento de linguagem natural com prompts calibrados para extrair sentimentos, identificar problemas estruturais e separar desabafos de infrações reais.
* **🚨 Painel de Alertas e Gravidade:**
    * Geração de alertas automatizados categorizados pelo nível de criticidade:
        * **Conforme:** Comentários positivos ou dentro da normalidade.
        * **Segurança:** Infrações diretas à integridade física ou operacional do local.
        * **Denúncia:** Relatos formais de abusos ou problemas graves recorrentes.
        * **Crítico:** Casos com altíssima probabilidade de ilegalidade imediata.

## 🧠 Matriz de Análise da LLM (Regras de Negócio)

A inteligência artificial avalia os textos coletados com base nas seguintes diretrizes:

| Categoria | O que a LLM deve buscar no texto | Exemplo de Gatilho (Trigger) |
| :--- | :--- | :--- |
| **Conformidade** | Problemas de infraestrutura, limpeza, horários descumpridos e acessibilidade. | *"Não tinha rampa para cadeirante"*, *"Banheiros imundos"*. |
| **Suspeita de Ilegalidade** | Cobranças abusivas, venda casada, racismo, homofobia, agressão verbal/física, falta de alvará. | *"Me cobraram o dobro por ser estrangeiro"*, *"O segurança nos ameaçou"*. |
| **Falso Positivo** | Reclamações puramente subjetivas, gosto pessoal ou fatores externos (clima, etc). | *"Choveu o dia todo"*, *"Achei o picolé meio sem gosto"*. |

---

## 🛠️ Tecnologias Utilizadas

| Categoria | Tecnologia | Descrição |
| :--- | :--- | :--- |
| **Frontend** | [React / TypeScript] | Dashboard de visualização dos alertas e relatórios de auditoria. |
| **Backend** | [Python / FastAPI ou Flask] | API para gerenciar o fluxo de dados e requisições da IA. |
| **Inteligência Artificial**| [OpenAI API] | Integração com LLM e calibração de prompts. |
| **Banco de Dados** | [PostgreSQL / Supabase] | Armazenamento dos comentários minerados, alertas gerados e autenticação de usuários. |
| **Web Scraping** | [BeautifulSoup / Selenium] | Ferramentas para extração automatizada dos dados das plataformas. |

---

## 🚀 Como Executar o Projeto Localmente

Siga os passos abaixo para configurar e rodar o projeto em sua máquina:

### Pré-requisitos

Você deve ter o seguinte software instalado:

* `Git` Ferramenta de controle de versionamento.
* `Node.js` (Para o ambiente do painel/frontend).
* `Python 3.10+` (Para os scripts de IA, scraping e backend).
* Banco de dados configurado localmente.

### 1. Clonagem e Navegação

```bash
git clone https://github.com/igorBrenno/turismo-ai-llm.git

cd turismo-llm
```

### 2. Instalando bibliotecas e extenções do front

```bash
npm install
```

### 3.  Rodando o front-end

```bash
npm run dev
```