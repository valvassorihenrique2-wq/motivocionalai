const fetch = require('node-fetch');

const { Client } = require('pg');
exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const CLOUDCONVERT_API_KEY = process.env.CLOUDCONVERT_API_KEY; 

    if (!CLOUDCONVERT_API_KEY) {
        return { statusCode: 500, body: JSON.stringify({ error: 'Chave de API do CloudConvert não configurada.' }) };
    }

    try {
        const { fileName, targetFormat, fileContent } = JSON.parse(event.body); // Expects fileContent

        // 1. Create a CloudConvert job
        const jobResponse = await fetch('https://api.cloudconvert.com/v2/jobs', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${CLOUDCONVERT_API_KEY}`,
                'Content-Type': 'application/json',
                'X-Api-Key': CLOUDCONVERT_API_KEY
            },
            body: JSON.stringify({
                "tasks": {
                    "upload-file": {
                        "operation": "import/base64", // Using Base64
                        "file": fileContent,
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
            console.error('CloudConvert Job Creation Error:', errorData);
            throw new Error(`CloudConvert API error: ${errorData.message || JSON.stringify(errorData)}`);
        }

        const job = await jobResponse.json();
        const jobId = job.data.id;

        // 2. Poll for job completion
        let jobStatus = job.data.status;
        let resultFileUrl = null;
        let attempts = 0;
        const maxAttempts = 20;

        while (jobStatus !== 'finished' && jobStatus !== 'error' && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            const statusResponse = await fetch(`https://api.cloudconvert.com/v2/jobs/${jobId}`, {
                headers: { 'Authorization': `Bearer ${CLOUDCONVERT_API_KEY}` }
            });
            const statusData = await statusResponse.json();
            jobStatus = statusData.data.status;

            if (jobStatus === 'finished') {
                const exportTask = statusData.data.tasks.find(task => task.operation.startsWith('export/'));
                if (exportTask && exportTask.result && exportTask.result.files && exportTask.result.files.length > 0) {
                    resultFileUrl = exportTask.result.files[0].url;
                }
            } else if (jobStatus === 'error') {
                console.error('CloudConvert Job Failed:', statusData.data.tasks);
                throw new Error(`CloudConvert Job failed: ${statusData.data.tasks[0].message || 'Unknown error'}`);
            }
            attempts++;
        }

        if (!resultFileUrl) {
            throw new Error('Não foi possível obter a URL do arquivo convertido ou o trabalho falhou/expirou.');
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ downloadUrl: resultFileUrl, fileName: `${fileName.split('.')[0]}.${targetFormat}` })
        };

    } catch (error) {
        console.error('Erro na função Netlify convertFile:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: `Erro na conversão: ${error.message}` })
        };
    }
};