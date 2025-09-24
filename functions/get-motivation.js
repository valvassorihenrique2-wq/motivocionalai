// A função exportada 'onRequest' é a forma como o Cloudflare Pages Functions
// lida com requisições de entrada.
export async function onRequest(context) {
    const { env } = context;
    const GOOGLE_API_KEY = env.GEMINI_API_KEY;

    // Cabeçalhos para permitir requisições de qualquer origem (CORS).
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    };

    if (!GOOGLE_API_KEY) {
        console.error("Erro: A variável de ambiente GOOGLE_API_KEY não está configurada.");
        return new Response(
            JSON.stringify({ error: 'Variável de ambiente ausente.' }),
            { status: 500, headers }
        );
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
                    parts: [
                        { text: prompt }
                    ]
                }],
                generationConfig: {
                    temperature: 0.9,
                    maxOutputTokens: 100
                }
            })
        });

        const geminiData = await geminiResponse.json();

        if (!geminiResponse.ok) {
            console.error('Erro ao chamar Gemini AI para frase motivacional:', geminiData);
            throw new Error(`Erro da API Gemini: ${geminiResponse.status} - ${geminiData.error?.message || JSON.stringify(geminiData)}`);
        }

        const generatedPhrase = geminiData.candidates[0].content.parts[0].text.trim();
        
        return new Response(
            JSON.stringify({ phrase: generatedPhrase }),
            { status: 200, headers }
        );

    } catch (error) {
        console.error('Erro na função get-motivation:', error);
        return new Response(
            JSON.stringify({ error: `Erro interno: ${error.message}` }),
            { status: 500, headers }
        );
    }
}
