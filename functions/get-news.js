import { Pool } from '@neondatabase/serverless';

// A função exportada 'onRequest' é a forma como o Cloudflare Pages Functions
// lida com requisições de entrada.
export async function onRequest(context) {
    const { env } = context;

    const DATABASE_URL = env.NETLIFY_DATABASE_URL;

    // Cabeçalhos para permitir requisições de qualquer origem (CORS).
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    };

    if (!DATABASE_URL) {
        console.error("Erro: Variável de ambiente DATABASE_URL não configurada.");
        return new Response(
            JSON.stringify({ error: 'Variável de ambiente DATABASE_URL ausente.' }),
            { status: 500, headers }
        );
    }

    const pool = new Pool({ connectionString: DATABASE_URL });

    try {
        console.log('Conectado ao banco de dados para notícias.');

        const queryText = 'SELECT titulo, conteudo, data_geracao FROM noticias ORDER BY data_geracao DESC;';
        const res = await pool.query(queryText);

        if (res.rows.length > 0) {
            const allNews = res.rows;
            console.log('Notícias encontradas:', allNews.length);
            return new Response(
                JSON.stringify(allNews),
                { status: 200, headers }
            );
        } else {
            console.log('Nenhuma notícia encontrada no banco de dados.');
            return new Response(
                JSON.stringify({ error: 'Nenhuma notícia encontrada no banco de dados.' }),
                { status: 404, headers }
            );
        }
    } catch (error) {
        console.error('Erro na função get-news:', error);
        return new Response(
            JSON.stringify({ error: `Erro ao carregar notícias: ${error.message}` }),
            { status: 500, headers }
        );
    } finally {
        await pool.end();
    }
}
