// netlify/functions/get-training-tips.js
const { Client } = require('pg');

exports.handler = async (event, context) => {
    const DATABASE_URL = process.env.NETLIFY_DATABASE_URL;

    if (!DATABASE_URL) {
        return { statusCode: 500, body: JSON.stringify({ error: 'Variável de ambiente NETLIFY_DATABASE_URL ausente.' }) };
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
        
        return {
            statusCode: 200,
            body: JSON.stringify(allTips)
        };

    } catch (error) {
        console.error('Erro na função get-training-tips:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: `Erro ao carregar dica de treino: ${error.message}` })
        };
    } finally {
        await pgClient.end();
        console.log('Conexão com o banco de dados fechada.');
    }
};