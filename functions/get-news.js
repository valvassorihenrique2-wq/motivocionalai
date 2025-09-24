import { Client } from 'pg';

export const onRequestGet = async (context) => {
    const DATABASE_URL = context.env.DATABASE_URL;

    if (!DATABASE_URL) {
        console.error("Erro: Variável de ambiente DATABASE_URL não configurada.");
        return new Response(JSON.stringify({ error: 'Variável de ambiente DATABASE_URL ausente.' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const pgClient = new Client({
        connectionString: DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await pgClient.connect();
        console.log('Conectado ao banco de dados para notícias.');

        // ATENÇÃO AQUI: Sem LIMIT 1, para pegar todas as notícias
        const queryText = 'SELECT titulo, conteudo, data_geracao FROM noticias ORDER BY data_geracao DESC;';
        const res = await pgClient.query(queryText);

        if (res.rows.length > 0) {
            const allNews = res.rows; // Retorna todas as linhas (um array)
            console.log('Notícias encontradas:', allNews.length);
            return new Response(JSON.stringify(allNews), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        } else {
            console.log('Nenhuma notícia encontrada no banco de dados.');
            return new Response(JSON.stringify({ error: 'Nenhuma notícia encontrada no banco de dados.' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    } catch (error) {
        console.error('Erro na função get-news:', error);
        return new Response(JSON.stringify({ error: `Erro ao carregar notícias: ${error.message}` }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    } finally {
        if (pgClient) {
          await pgClient.end();
        }
    }
};
