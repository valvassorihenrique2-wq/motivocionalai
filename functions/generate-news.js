import { Pool } from '@neondatabase/serverless';

// A função exportada 'onRequest' é a forma como o Cloudflare Pages Functions
// lida com requisições de entrada.
export async function onRequest(context) {
    const { env } = context;

    // As variáveis de ambiente GOOGLE_API_KEY e DATABASE_URL agora são acessadas de env.
    const GOOGLE_API_KEY = env.GEMINI_API_KEY; 
    const DATABASE_URL = env.NETLIFY_DATABASE_URL;

    if (!GOOGLE_API_KEY || !DATABASE_URL) { 
        console.error("Erro: Variáveis de ambiente GOOGLE_API_KEY ou DATABASE_URL não configuradas.");
        return new Response(
            JSON.stringify({ error: 'Variáveis de ambiente ausentes.' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }

    const pool = new Pool({ connectionString: DATABASE_URL });

    try {
        const queryLastNews = 'SELECT data_geracao FROM noticias ORDER BY data_geracao DESC LIMIT 1;';
        const resLastNews = await pool.query(queryLastNews);

        let canGenerate = true;
        if (resLastNews.rows.length > 0) {
            const lastGenerationTime = new Date(resLastNews.rows[0].data_geracao);
            const now = new Date();
            const hoursSinceLastGeneration = (now.getTime() - lastGenerationTime.getTime()) / (1000 * 60 * 60);

            if (hoursSinceLastGeneration < 24) {
                canGenerate = false;
                console.log(`Notícia já gerada há ${hoursSinceLastGeneration.toFixed(2)} horas. Próxima geração em ${(24 - hoursSinceLastGeneration).toFixed(2)} horas.`);
                return new Response(
                    JSON.stringify({ message: 'Notícia não gerada. Intervalo de 24h não atingido.', lastGenerated: lastGenerationTime.toISOString() }),
                    { status: 200, headers: { 'Content-Type': 'application/json' } }
                );
            }
        }

        if (canGenerate) {
            const prompt = `Crie uma notícia aleatoria sobre tecnologia.Minimo 10 paragrafos`;

            const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GOOGLE_API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            {text: prompt}
                        ]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 500
                    }
                })
            });

            if (!geminiResponse.ok) {
                const errorBody = await geminiResponse.json();
                console.error('Erro ao chamar Gemini AI:', errorBody);
                throw new Error(`Erro da API Gemini: ${geminiResponse.status} - ${errorBody.error.message || JSON.stringify(errorBody)}`);
            }

            const data = await geminiResponse.json();
            const generatedContent = data.candidates[0].content.parts[0].text.trim();

            const lines = generatedContent.split('\n');
            const title = lines[0].trim();
            const contentBody = lines.slice(1).join('\n').trim();

            const queryInsertNews = `
                INSERT INTO noticias (titulo, conteudo)
                VALUES ($1, $2)
                RETURNING id, titulo, data_geracao;
            `;
            const resInsertNews = await pool.query(queryInsertNews, [title, contentBody]);
            const newNews = resInsertNews.rows[0];

            console.log('Notícia gerada e salva:', newNews);

            return new Response(
                JSON.stringify({
                    message: 'Notícia gerada e salva com sucesso!',
                    news: newNews
                }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
        }

    } catch (error) {
        console.error('Erro na função generate-news:', error);
        return new Response(
            JSON.stringify({ error: `Erro interno: ${error.message}` }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    } finally {
        // Encerra o pool de conexões para evitar vazamentos de recursos em ambientes serverless.
        await pool.end();
    }
}
