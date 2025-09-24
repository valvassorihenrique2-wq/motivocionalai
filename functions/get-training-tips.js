import { Pool } from '@neondatabase/serverless';
import { GoogleGenerativeAI } from '@google/generative-ai';

// A função exportada 'onRequest' é a forma como o Cloudflare Pages Functions
// lida com requisições de entrada.
export async function onRequest(context) {
    const { env } = context;

    const GOOGLE_API_KEY = env.GEMINI_API_KEY;
    const DATABASE_URL = env.NETLIFY_DATABASE_URL;

    // Cabeçalhos para permitir requisições de qualquer origem (CORS).
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    };

    if (!GOOGLE_API_KEY || !DATABASE_URL) {
        console.error("Erro: Variáveis de ambiente ausentes.");
        return new Response(
            JSON.stringify({ error: 'Variáveis de ambiente ausentes.' }),
            { status: 500, headers }
        );
    }

    const pool = new Pool({ connectionString: DATABASE_URL });

    try {
        // 1. Tenta buscar o conteúdo existente
        const result = await pool.query('SELECT content FROM tips ORDER BY last_updated DESC LIMIT 1;');
        let tipContent = result.rows[0] ? result.rows[0].content : null;

        // 2. Se o banco estiver vazio, gere e salve um novo conteúdo
        if (!tipContent) {
            console.log('Nenhum conteúdo encontrado no banco. Gerando novo...');

            const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
            const prompt = "Crie dicas de treino para iniciantes em tópicos. Mantenha as dicas concisas e use formatação como negrito e listas para facilitar a leitura. Escreva apenas o conteúdo das dicas, sem introduções.";
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const geminiResult = await model.generateContent(prompt);
            const generatedText = geminiResult.response.text();
            
            await pool.query('INSERT INTO tips (content, last_updated) VALUES ($1, NOW());', [generatedText]);
            tipContent = generatedText;

            console.log('Novo conteúdo gerado e salvo com sucesso.');
        }

        // 3. Retorna um objeto com a propriedade 'content'
        return new Response(
            JSON.stringify({ content: tipContent }),
            { status: 200, headers }
        );

    } catch (error) {
        console.error('Erro na função get-training-tips:', error);
        return new Response(
            JSON.stringify({ error: `Erro interno: ${error.message}` }),
            { status: 500, headers }
        );
    } finally {
        // Encerra todas as conexões ociosas no pool
        await pool.end();
    }
}
