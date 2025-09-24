import { Pool } from '@neondatabase/serverless';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function onRequest(context) {
    const { env } = context;

    const DATABASE_URL = env.NETLIFY_DATABASE_URL;
    const GOOGLE_API_KEY = env.GEMINI_API_KEY;

    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    };

    if (!DATABASE_URL || !GOOGLE_API_KEY) {
        console.error("Erro: Variáveis de ambiente ausentes.");
        return new Response(
            JSON.stringify({ error: 'Variáveis de ambiente ausentes.' }),
            { status: 500, headers }
        );
    }

    const pool = new Pool({ connectionString: DATABASE_URL });

    try {
        const client = await pool.connect();

        // Verificar e criar a tabela se ela não existir
        await client.query(`
            CREATE TABLE IF NOT EXISTS dicas_treino (
                id SERIAL PRIMARY KEY,
                titulo TEXT NOT NULL,
                conteudo TEXT NOT NULL,
                data_geracao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Tabela dicas_treino verificada/criada.');
        
        const TWO_DAYS_IN_MILLIS = 2 * 24 * 60 * 60 * 1000;

        // 1. Tenta buscar o conteúdo existente
        const result = await client.query('SELECT titulo, conteudo, data_geracao FROM dicas_treino ORDER BY data_geracao DESC LIMIT 1;');
        const row = result.rows[0];

        let tipToReturn;
        const now = new Date();

        if (row && (now.getTime() - new Date(row.data_geracao).getTime() < TWO_DAYS_IN_MILLIS)) {
            console.log(`Servindo dica de treino do DB (última atualização: ${new Date(row.data_geracao).toLocaleString()}).`);
            tipToReturn = { titulo: row.titulo, conteudo: row.conteudo };
        } else {
            console.log(`Gerando nova dica de treino (expirada ou não existente).`);
            const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
            const prompt = "Crie uma dica de treino para iniciantes. Use um título e um corpo de texto. O título deve ser curto e o corpo do texto deve ter no mínimo 3 parágrafos. Não inclua nenhuma introdução ou formatação extra além do título e do conteúdo.";
            
            try {
                const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
                const geminiResult = await model.generateContent(prompt);
                const generatedText = geminiResult.response.text();
                
                const lines = generatedText.split('\n');
                const title = lines[0].trim();
                const contentBody = lines.slice(1).join('\n').trim();

                // 2. Salva o novo conteúdo no banco de dados, excluindo o antigo
                await client.query('TRUNCATE TABLE dicas_treino RESTART IDENTITY;');
                await client.query('INSERT INTO dicas_treino (titulo, conteudo, data_geracao) VALUES ($1, $2, NOW());', [title, contentBody]);
                
                console.log('Novo conteúdo gerado e salvo com sucesso.');
                tipToReturn = { titulo: title, conteudo: contentBody };

            } catch (error) {
                console.error(`Erro ao chamar a API do Google Gemini para dicas de treino:`, error);
                if (row && row.conteudo) {
                    console.warn(`Erro na API Gemini, servindo conteúdo antigo do DB.`);
                    tipToReturn = { titulo: row.titulo, conteudo: row.conteudo };
                } else {
                    throw new Error(`Erro ao gerar dica de treino.`);
                }
            }
        }
        
        return new Response(
            JSON.stringify(tipToReturn),
            { status: 200, headers }
        );

    } catch (error) {
        console.error('Erro na função get-training-tipss:', error);
        return new Response(
            JSON.stringify({ error: `Erro interno: ${error.message}` }),
            { status: 500, headers }
        );
    } finally {
        await pool.end();
        console.log('Conexão com o banco de dados fechada.');
    }
}
