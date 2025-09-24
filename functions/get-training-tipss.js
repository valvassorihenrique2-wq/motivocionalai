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
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('Tentando conectar ao banco de dados...');
        await pgClient.connect();
        console.log('Conexão com o banco de dados bem-sucedida.');

        console.log('Executando a query SELECT...');
        const queryText = 'SELECT titulo, conteudo, data_geracao FROM dicas_treino ORDER BY data_geracao DESC;';
        const res = await pgClient.query(queryText);
        console.log(`Query executada. Linhas encontradas: ${res.rows.length}`);

        const allTips = res.rows;
        
        return new Response(JSON.stringify(allTips), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Erro na função get-training-tips:', error);
        return new Response(JSON.stringify({ error: `Erro ao carregar dica de treino: ${error.message}` }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    } finally {
        if (pgClient) {
            await pgClient.end();
            console.log('Conexão com o banco de dados fechada.');
        }
    }
};
