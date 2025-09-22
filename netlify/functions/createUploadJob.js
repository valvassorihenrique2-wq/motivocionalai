// netlify/functions/createUploadJob.js

const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const busboy = require('busboy');
const { Blob } = require('node:buffer'); 

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const CONVERTAPI_SECRET = process.env.CONVERTAPI_SECRET;

    if (!CONVERTAPI_SECRET) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Chave de API do ConvertAPI não configurada.' })
        };
    }

    try {
        const fileAndFields = await new Promise((resolve, reject) => {
            if (!event.body) {
                return reject(new Error("Corpo da requisição vazio."));
            }
            const bb = busboy({ headers: event.headers });
            const fields = {};
            const file = {};
            let fileBuffer = Buffer.from([]);

            bb.on('file', (name, stream, info) => {
                stream.on('data', data => {
                    fileBuffer = Buffer.concat([fileBuffer, data]);
                });
                stream.on('end', () => {
                    file.data = fileBuffer;
                    file.info = info;
                });
            });

            bb.on('field', (name, value) => {
                fields[name] = value;
            });
            
            bb.on('close', () => resolve({ file, fields }));
            bb.on('error', reject);

            bb.end(Buffer.from(event.body, event.isBase64Encoded ? 'base64' : 'utf8'));
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

        if (!result.Files || result.Files.length === 0 || !result.Files[0].Url) {
            console.error("Resposta da API inválida:", result);
            throw new Error('A API não retornou uma URL de download válida.');
        }

        const downloadUrl = result.Files[0].Url;

        return {
            statusCode: 200,
            body: JSON.stringify({ downloadUrl })
        };

    } catch (error) {
        console.error('Erro na função createUploadJob:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: `Falha na conversão: ${error.message}` })
        };
    }
};