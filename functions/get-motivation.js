export const onRequestGet = async (context) => {
    // Acessando variáveis de ambiente do Cloudflare Pages
    const GOOGLE_API_KEY = context.env.GEMINI_API_KEY;

    // Acessa o objeto de requisição do contexto
    const request = context.request;

    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    };

    if (!GOOGLE_API_KEY) {
        console.error("Erro: Variável de ambiente GOOGLE_API_KEY não configurada.");
        return new Response(JSON.stringify({ error: 'Variável de ambiente ausente.' }), {
            status: 500,
            headers
        });
    }

    try {
        const prompt = "Crie uma frase motivadora para mim, mostre apenas a frase. Não inicie a fala com 'boa ideia!' ou 'que interessante' ou qualquer outra introdução. Apenas a frase.";

        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GOOGLE_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            })
        });

        if (!geminiResponse.ok) {
            const errorBody = await geminiResponse.json();
            console.error('Erro ao chamar Gemini AI:', errorBody);
            throw new Error(`Erro da API Gemini: ${geminiResponse.status} - ${errorBody.error.message || JSON.stringify(errorBody)}`);
        }

        const data = await geminiResponse.json();
        const generatedPhrase = data.candidates[0].content.parts[0].text.trim();

        const responseData = {
            phrase: generatedPhrase
        };

        return new Response(JSON.stringify(responseData), {
            status: 200,
            headers
        });
    } catch (error) {
        console.error('Erro na função get-motivation:', error);
        return new Response(JSON.stringify({
            error: error.message || 'Erro desconhecido ao gerar frase motivacional.'
        }), {
            status: 500,
            headers
        });
    }
};
