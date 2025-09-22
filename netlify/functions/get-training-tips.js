// netlify/functions/get-training-tips.js

const { Pool } = require('pg');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Configuração do banco de dados e da API
const pool = new Pool({
    connectionString: process.env.NETLIFY_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.handler = async (event, context) => {
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    };

    let client;
    try {
        client = await pool.connect();

        // 1. Tenta buscar o conteúdo existente
        const result = await client.query('SELECT content FROM tips ORDER BY last_updated DESC LIMIT 1;');
        let tipContent = result.rows[0] ? result.rows[0].content : null;

        // 2. Se o banco estiver vazio, gere e salve um novo conteúdo
        if (!tipContent) {
            console.log('Nenhum conteúdo encontrado no banco. Gerando novo...');

            const prompt = "Crie dicas de treino para iniciantes em tópicos. Mantenha as dicas concisas e use formatação como negrito e listas para facilitar a leitura. Escreva apenas o conteúdo das dicas, sem introduções.";
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const geminiResult = await model.generateContent(prompt);
            const generatedText = geminiResult.response.text();
            
            await client.query('INSERT INTO tips (content, last_updated) VALUES ($1, NOW());', [generatedText]);
            tipContent = generatedText;

            console.log('Novo conteúdo gerado e salvo com sucesso.');
        }

        // 3. Retorna um objeto com a propriedade 'content'
        return {
            statusCode: 200,
            body: JSON.stringify({ content: tipContent }),
            headers
        };

    } catch (error) {
        console.error('Erro na função get-training-tips:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: `Erro interno: ${error.message}` }),
            headers
        };
    } finally {
        if (client) {
            client.release();
        }
    }
};