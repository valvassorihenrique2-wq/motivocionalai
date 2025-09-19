// server.js
require('dotenv').config(); // Carrega variáveis de ambiente do arquivo .env
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
const { Pool } = require('pg'); // Importa o Pool do PostgreSQL

const app = express();
const PORT = process.env.PORT || 3000;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Middlewares
app.use(cors());
app.use(express.json());

// Se você optou por servir o index.html pelo servidor Node.js
app.use(express.static(path.join(__dirname, 'public'))); // Garanta que 'public' é o diretório correto do seu HTML/CSS/JS

// Configuração do Banco de Dados PostgreSQL
// O Cyclic fornecerá a variável de ambiente DATABASE_URL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
  // Removido ou comentado: ssl: { rejectUnauthorized: false }
});

// Função para testar a conexão e criar tabelas
async function initializeDatabase() {
    try {
        const client = await pool.connect();
        console.log('Conectado ao banco de dados PostgreSQL.');

        // Cria a tabela phrases
        await client.query(`
            CREATE TABLE IF NOT EXISTS phrases (
                id SERIAL PRIMARY KEY,
                content TEXT NOT NULL,
                last_updated BIGINT NOT NULL
            );
        `);
        console.log('Tabela phrases verificada/criada.');

        // Cria a tabela tips
        await client.query(`
            CREATE TABLE IF NOT EXISTS tips (
                id SERIAL PRIMARY KEY,
                content TEXT NOT NULL,
                last_updated BIGINT NOT NULL
            );
        `);
        console.log('Tabela tips verificada/criada.');

        client.release(); // Libera o cliente de volta para o pool
    } catch (err) {
        console.error('Erro ao conectar ou inicializar o banco de dados:', err.message);
        // Em um ambiente de produção, você pode querer sair do processo ou tentar novamente
    }
}

// Chamar a inicialização do DB ao iniciar o servidor
initializeDatabase();

const TWO_DAYS_IN_MILLIS = 2 * 24 * 60 * 60 * 1000; // 2 dias em milissegundos

// Função genérica para buscar/gerar/salvar conteúdo
async function getContent(type, prompt, tableName, contentKey) {
    let client; // Declara client aqui para ser acessível no finally
    try {
        client = await pool.connect(); // Obtém um cliente do pool

        // Busca o conteúdo mais recente
        const result = await client.query(`SELECT content, last_updated FROM ${tableName} ORDER BY last_updated DESC LIMIT 1`);
        const row = result.rows[0]; // Obtém a primeira (e única) linha

        const now = Date.now();
        let contentToReturn;

        if (row && (now - row.last_updated < TWO_DAYS_IN_MILLIS)) {
            // Conteúdo existente e não expirado (menos de 2 dias)
            console.log(`Servindo ${type} do DB (última atualização: ${new Date(row.last_updated).toLocaleString()}).`);
            contentToReturn = row.content;
        } else {
            // Conteúdo não existe ou expirou (mais de 2 dias)
            console.log(`Gerando novo ${type} (expirado ou não existente).`);
            try {
                const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
                const geminiResult = await model.generateContent(prompt); // Renomeado para evitar conflito com 'result' do DB
                const response = await geminiResult.response;
                const generatedContent = response.text().trim();

                // Insere o novo conteúdo no banco de dados.
                // Usamos DELETE + INSERT para garantir que sempre teremos apenas 1 linha atualizada,
                // já que não estamos lidando com múltiplos IDs ou histórico neste caso.
                await client.query(`DELETE FROM ${tableName};`); // Remove a entrada antiga
                await client.query(`INSERT INTO ${tableName} (content, last_updated) VALUES ($1, $2);`,
                    [generatedContent, now]
                );
                console.log(`Novo ${type} salvo no DB.`);
                contentToReturn = generatedContent;

            } catch (error) {
                console.error(`Erro ao chamar a API do Google Gemini para ${type}:`, error);
                // Se a API Gemini falhar (ex: cota), tenta servir o conteúdo antigo se existir
                if (row && row.content) {
                    console.warn(`Erro na API Gemini para ${type}, servindo conteúdo antigo do DB.`);
                    contentToReturn = row.content; // Serve o conteúdo antigo mesmo com erro na API
                } else {
                    // Se não tem conteúdo antigo e a API falhou, rejeita com erro
                    throw new Error(`Erro ao gerar ${type}. Tente novamente mais tarde.`);
                }
            }
        }
        return { [contentKey]: contentToReturn };

    } catch (err) {
        console.error(`Erro na função getContent para ${type}:`, err.message);
        throw { status: 500, message: `Erro interno do servidor ao processar ${type}.` };
    } finally {
        if (client) {
            client.release(); // Sempre libera o cliente de volta para o pool
        }
    }
}

// Rota para obter a frase motivacional
app.post('/get-motivation', async (req, res) => {
    try {
        const prompt = "Crie uma frase motivadora para mim, mostre apenas a frase. Não inicie a fala com 'boa ideia!' ou 'que interessante' ou qualquer outra introdução. Apenas a frase.";
        const data = await getContent('frase motivacional', prompt, 'phrases', 'phrase');
        res.json(data);
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message });
    }
});

// Rota para obter as dicas de treino
app.post('/get-training-tips', async (req, res) => {
    try {
        const prompt = "Crie um parágrafo de aproximadamente 10 linhas com dicas de treino para iniciantes. Não inclua introduções, títulos ou saudações, apenas o texto com as dicas diretamente.";
        const data = await getContent('dicas de treino', prompt, 'tips', 'tips');
        res.json(data);
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message });
    }
});

// Rota padrão para servir o arquivo HTML estático (opcional, se você não tem outro servidor estático)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});