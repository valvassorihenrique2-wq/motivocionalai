// netlify/functions/createUploadJob.js

const fetch = require('node-fetch');

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const CLOUDCONVERT_API_KEY = process.env.CLOUDCONVERT_API_KEY;

    if (!CLOUDCONVERT_API_KEY) {
        // Log para ajudar a depurar a ausência da variável de ambiente
        console.error("Erro: A variável de ambiente CLOUDCONVERT_API_KEY não está configurada.");
        return { 
            statusCode: 500, 
            body: JSON.stringify({ error: 'Chave de API do CloudConvert não configurada.' }) 
        };
    }

    try {
        const { fileName, targetFormat } = JSON.parse(event.body);

        console.log(`Iniciando job para o arquivo: ${fileName}, formato: ${targetFormat}`);

        const jobResponse = await fetch('https://api.cloudconvert.com/v2/jobs', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${CLOUDCONVERT_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "tasks": {
                    "upload-file": {
                        "operation": "import/upload",
                        "filename": fileName
                    },
                    "convert-file": {
                        "operation": "convert",
                        "input": "upload-file",
                        "output_format": targetFormat,
                        "filename": `${fileName.split('.')[0]}.${targetFormat}`
                    },
                    "export-file": {
                        "operation": "export/url",
                        "input": "convert-file"
                    }
                }
            })
        });

        // Verificação e log mais detalhados da resposta da API externa
        if (!jobResponse.ok) {
            const errorData = await jobResponse.json();
            console.error('Erro na API do CloudConvert:', errorData);
            throw new Error(`Erro na API do CloudConvert: ${jobResponse.status} - ${errorData.message || 'Erro desconhecido.'}`);
        }

        const job = await jobResponse.json();
        console.log("Job CloudConvert criado com sucesso:", job.data.id);
        
        const uploadTask = job.data.tasks.find(task => task.operation === 'import/upload');
        if (!uploadTask || !uploadTask.result || !uploadTask.result.form || !uploadTask.result.form.url) {
            console.error("Resposta da API CloudConvert não contém a URL de upload esperada.");
            throw new Error("Resposta da API inválida. Não foi possível obter a URL de upload.");
        }
        
        const uploadUrl = uploadTask.result.form.url;

        return {
            statusCode: 200,
            body: JSON.stringify({
                jobId: job.data.id,
                uploadUrl: uploadUrl
            })
        };

    } catch (error) {
        console.error('Erro na função createUploadJob:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: `Falha ao criar o job de upload: ${error.message}` })
        };
    }
};