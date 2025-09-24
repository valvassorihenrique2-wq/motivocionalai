import { Client } from 'pg';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const onRequestGet = async (context) => {
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    };

    const GOOGLE_API_KEY = context.env.GEMINI_API_KEY;
    const DATABASE_URL = context.env.DATABASE_URL;

    if (!GOOGLE_API_KEY || !DATABASE_URL) {
        console.error("Erro: Variáveis de ambiente GOOGLE_API_KEY ou DATABASE_URL não configuradas.");
        return new Response(JSON.stringify({ error: 'Variáveis de ambiente ausentes.' }), {
            status: 500,
            headers
        });
    }

    const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
    let pgClient;

    try {
        pgClient = new Client({
            connectionString: DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });
        await pgClient.connect();

        // 1. Tenta buscar o conteúdo existente
        const result = await pgClient.query('SELECT conteudo FROM dicas_treino ORDER BY data_geracao DESC LIMIT 1;');
        let tipContent = result.rows[0] ? result.rows[0].conteudo : null;

        // 2. Se o banco estiver vazio, gere e salve um novo conteúdo
        if (!tipContent) {
            console.log('Nenhum conteúdo encontrado no banco. Gerando novo...');

            const prompt = "Crie dicas de treino para iniciantes em tópicos. Mantenha as dicas concisas e use formatação como negrito e listas para facilitar a leitura. Escreva apenas o conteúdo das dicas, sem introduções.";
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const geminiResult = await model.generateContent(prompt);
            const generatedText = geminiResult.response.text();
            
            await pgClient.query('INSERT INTO dicas_treino (titulo, conteudo) VALUES ($1, $2);', ['Dica de Treino', generatedText]);
            tipContent = generatedText;

            console.log('Novo conteúdo gerado e salvo com sucesso.');
        }

        // 3. Retorna um objeto com a propriedade 'content'
        return new Response(JSON.stringify({ content: tipContent }), {
            status: 200,
            headers
        });

    } catch (error) {
        console.error('Erro na função get-training-tips:', error);
        return new Response(JSON.stringify({ error: `Erro interno: ${error.message}` }), {
            status: 500,
            headers
        });
    } finally {
        if (pgClient) {
            await pgClient.end();
        }
    }
};
