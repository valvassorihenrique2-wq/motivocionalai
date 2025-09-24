// Caminho do import corrigido para o arquivo helper.
const { getContent } = require('../../utils/db'); 

exports.handler = async (event, context) => {
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    };

    try {
        const prompt = "Crie uma frase motivadora para mim, mostre apenas a frase. Não inicie a fala com 'boa ideia!' ou 'que interessante' ou qualquer outra introdução. Apenas a frase.";
        const data = await getContent('frase motivacional', prompt, 'phrases', 'phrase');

        return {
            statusCode: 200,
            body: JSON.stringify(data),
            headers
        };
    } catch (error) {
        console.error('Erro na função get-motivation:', error);
        return {
            statusCode: error.statusCode || 500,
            body: JSON.stringify({
                error: error.message || 'Erro desconhecido ao gerar frase motivacional.'
            }),
            headers
        };
    }
};