const fetch = require('node-fetch');

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const CLOUDCONVERT_API_KEY = process.env.CLOUDCONVERT_API_KEY;

    if (!CLOUDCONVERT_API_KEY) {
        return { statusCode: 500, body: JSON.stringify({ error: 'Chave de API do CloudConvert não configurada.' }) };
    }

    try {
        const { fileName, targetFormat } = JSON.parse(event.body);

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

        if (!jobResponse.ok) {
            const errorData = await jobResponse.json();
            throw new Error(`Erro na API do CloudConvert: ${errorData.message || 'Erro desconhecido.'}`);
        }

        const job = await jobResponse.json();
        const uploadTask = job.data.tasks.find(task => task.operation === 'import/upload');
        const uploadUrl = uploadTask.result.form.url;

        return {
            statusCode: 200,
            body: JSON.stringify({
                jobId: job.data.id,
                uploadUrl: uploadUrl
            })
        };

    } catch (error) {
        console.error('Erro ao criar o job de upload:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: `Falha ao criar o job de upload: ${error.message}` })
        };
    }
};