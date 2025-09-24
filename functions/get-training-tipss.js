import { Pool } from '@neondatabase/serverless';

export async function onRequest(context) {
    const { env } = context;

    const DATABASE_URL = env.NETLIFY_DATABASE_URL;
    
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    };

    if (!DATABASE_URL) {
        console.error("Erro: Variável de ambiente NETLIFY_DATABASE_URL não configurada.");
        return new Response(
            JSON.stringify({ error: 'Variável de ambiente NETLIFY_DATABASE_URL ausente.' }),
            { status: 500, headers }
        );
    }

    const pool = new Pool({ connectionString: DATABASE_URL });

    try {
        console.log('Tentando conectar ao banco de dados...');
        const client = await pool.connect();
        console.log('Conexão com o banco de dados bem-sucedida.');

        console.log('Executando a query SELECT...');
        const queryText = 'SELECT titulo, conteudo, data_geracao FROM dicas_treino ORDER BY data_geracao DESC;';
        const res = await client.query(queryText);
        console.log(`Query executada. Linhas encontradas: ${res.rows.length}`);
        
        const allTips = res.rows;

        return new Response(
            JSON.stringify(allTips),
            { status: 200, headers }
        );

    } catch (error) {
        console.error('Erro na função get-training-tipss:', error);
        return new Response(
            JSON.stringify({ error: `Erro ao carregar dica de treino: ${error.message}` }),
            { status: 500, headers }
        );
    } finally {
        // Encerra a conexão com o banco de dados
        await pool.end();
        console.log('Conexão com o banco de dados fechada.');
    }
}
