// A função exportada 'onRequest' é a forma como o Cloudflare Pages Functions
// lida com requisições de entrada.
export async function onRequest(context) {
    const { request, env } = context;

    if (request.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    const CONVERTAPI_SECRET = env.CONVERTAPI_SECRET;

    if (!CONVERTAPI_SECRET) {
        return new Response(JSON.stringify({ error: 'Chave de API do ConvertAPI não configurada.' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const formData = await request.formData();
        const file = formData.get('file'); // 'file' é o nome do campo do arquivo no formulário
        const targetFormat = formData.get('targetFormat');

        if (!file || typeof file.arrayBuffer !== 'function') {
            return new Response(JSON.stringify({ error: 'Nenhum arquivo recebido ou arquivo inválido.' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const sourceFormat = file.name.split('.').pop();
        const convertUrl = `https://v2.convertapi.com/convert/${sourceFormat}/to/${targetFormat}?secret=${CONVERTAPI_SECRET}`;

        const form = new FormData();
        form.append('file', file, file.name);

        const response = await fetch(convertUrl, {
            method: 'POST',
            body: form
        });

        const result = await response.json();

        if (!response.ok) {
            console.error('Erro na API do ConvertAPI:', result);
            return new Response(JSON.stringify({ error: result.message || 'Erro desconhecido na API do ConvertAPI' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (!result.Files || result.Files.length === 0) {
            console.error("Resposta da API inválida: A propriedade 'Files' está ausente ou vazia.", result);
            return new Response(JSON.stringify({ error: 'A API não retornou nenhum arquivo.' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const firstFile = result.Files[0];
        const responseBody = firstFile.Url ? { downloadUrl: firstFile.Url } : {
            fileData: firstFile.FileData,
            fileName: firstFile.FileName,
            fileExt: firstFile.FileExt
        };

        return new Response(JSON.stringify(responseBody), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Erro na função createUploadJob:', error);
        return new Response(JSON.stringify({ error: `Falha na conversão: ${error.message}` }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
