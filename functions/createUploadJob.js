import busboy from 'busboy';

export const onRequestPost = async (context) => {
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
        const fileAndFields = await new Promise((resolve, reject) => {
            if (!request.headers.get('content-type')) {
                return reject(new Error("Content-Type header is missing."));
            }

            const bb = busboy({ headers: Object.fromEntries(request.headers) });
            const fields = {};
            const file = {};
            const chunks = [];

            bb.on('file', (name, stream, info) => {
                stream.on('data', data => {
                    chunks.push(data);
                });
                stream.on('end', () => {
                    file.data = Buffer.concat(chunks);
                    file.info = info;
                });
            });

            bb.on('field', (name, value) => {
                fields[name] = value;
            });

            bb.on('close', () => resolve({ file, fields }));
            bb.on('error', reject);

            request.body.pipeTo(new WritableStream({
                write(chunk) {
                    bb.write(chunk);
                },
                close() {
                    bb.end();
                },
                abort(err) {
                    bb.destroy(err);
                }
            }));
        });

        const { file, fields } = fileAndFields;
        if (!file.data) {
            throw new Error('Nenhum arquivo recebido.');
        }

        const { targetFormat } = fields;
        const sourceFormat = file.info.filename.split('.').pop();
        
        const convertUrl = `https://v2.convertapi.com/convert/${sourceFormat}/to/${targetFormat}?secret=${CONVERTAPI_SECRET}`;

        const form = new FormData();
        const fileBlob = new Blob([file.data]);
        form.append('file', fileBlob, file.info.filename);

        const response = await fetch(convertUrl, {
            method: 'POST',
            body: form
        });
        
        const result = await response.json();

        if (!response.ok) {
            console.error('Erro na API do ConvertAPI:', result);
            throw new Error(result.message || 'Erro desconhecido na API do ConvertAPI');
        }

        if (!result.Files || result.Files.length === 0) {
            console.error("Resposta da API inválida: A propriedade 'Files' está ausente ou vazia.", result);
            throw new Error('A API não retornou nenhum arquivo.');
        }

        const firstFile = result.Files[0];

        if (firstFile.Url) {
            const downloadUrl = firstFile.Url;
            return new Response(JSON.stringify({ downloadUrl }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        } else if (firstFile.FileData) {
            const fileData = firstFile.FileData;
            const fileName = firstFile.FileName;
            const fileExt = firstFile.FileExt;

            return new Response(JSON.stringify({ fileData, fileName, fileExt }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        } else {
            console.error('O primeiro arquivo não tem uma URL nem dados em Base64:', result);
            throw new Error('A API não retornou uma URL de download ou dados de arquivo válidos.');
        }

    } catch (error) {
        console.error('Erro na função createUploadJob:', error);
        return new Response(JSON.stringify({ error: `Falha na conversão: ${error.message}` }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
