// netlify/functions/get-motivation.js

// Carrega as variáveis de ambiente (essencial para o ambiente de produção do Netlify).
require('dotenv').config();

// Importa a lógica do seu banco de dados ou API de IA.
const { getContent } = require('../../utils/db'); 

exports.handler = async (event, context) => {
    // Define os cabeçalhos de resposta em um único objeto para evitar duplicação.
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*' // Permite requisições de qualquer domínio (CORS).
    };

    try {
        // A lógica do prompt é mantida aqui, mas poderia ser movida para 'utils/db.js' para maior organização.
        const prompt = "Crie uma frase motivadora para mim, mostre apenas a frase. Não inicie a fala com 'boa ideia!' ou 'que interessante' ou qualquer outra introdução. Apenas a frase.";
        
        // Chama a função para obter o conteúdo. O 'await' garante que a resposta seja esperada.
        const data = await getContent('frase motivacional', prompt, 'phrases', 'phrase');

        // Retorna a resposta de sucesso com os dados em formato JSON.
        return {
            statusCode: 200,
            body: JSON.stringify(data),
            headers
        };
    } catch (error) {
        console.error('Erro na função get-motivation:', error);

        // Em caso de erro, retorna uma resposta com o status 500 e a mensagem de erro.
        return {
            statusCode: error.statusCode || 500,
            body: JSON.stringify({ 
                error: error.message || 'Erro desconhecido ao gerar frase motivacional.' 
            }),
            headers
        };
    }
};