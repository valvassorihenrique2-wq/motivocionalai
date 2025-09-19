document.addEventListener('DOMContentLoaded', () => {
    const advancedInput = document.getElementById('advancedInput');
    const advancedFormatSelect = document.getElementById('advancedFormat');
    const convertAdvancedBtn = document.getElementById('convertAdvancedBtn');
    const advancedOutput = document.getElementById('advancedOutput');

    convertAdvancedBtn.addEventListener('click', async () => {
        const file = advancedInput.files[0];
        if (!file) {
            alert('Por favor, selecione um arquivo.');
            return;
        }

        const targetFormat = advancedFormatSelect.value;
        advancedOutput.innerHTML = '<p>Iniciando upload e conversão...</p>';

        try {
            // Step 1: Request a direct upload URL from the new backend function.
            const response = await fetch('/.netlify/functions/createUploadJob', { // Corrected function name
                method: 'POST',
                body: JSON.stringify({
                    fileName: file.name,
                    targetFormat: targetFormat
                }),
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erro ao preparar a conversão.');
            }

            const { uploadUrl, jobId } = await response.json();

            // Step 2: Upload the file directly to the CloudConvert URL.
            advancedOutput.innerHTML = '<p>Enviando arquivo...</p>';
            const uploadResponse = await fetch(uploadUrl, {
                method: 'PUT',
                body: file
            });

            if (!uploadResponse.ok) {
                throw new Error('Falha no upload direto para o CloudConvert.');
            }

            // Step 3: Wait for the conversion to finish (polling).
            advancedOutput.innerHTML = '<p>Upload concluído! Aguardando a conversão...</p>';
            let resultFileUrl = null;
            let attempts = 0;
            const maxAttempts = 20;

            while (!resultFileUrl && attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 5000));
                const statusResponse = await fetch(`/.netlify/functions/getJobStatus?jobId=${jobId}`);
                const statusData = await statusResponse.json();

                if (statusData.status === 'finished') {
                    resultFileUrl = statusData.downloadUrl;
                } else if (statusData.status === 'error') {
                    throw new Error(statusData.error || 'O trabalho de conversão falhou.');
                }
                attempts++;
            }

            if (resultFileUrl) {
                const newFileName = `${file.name.split('.')[0]}.${targetFormat}`;
                advancedOutput.innerHTML = `<p>Conversão concluída!</p><a href="${resultFileUrl}" download="${newFileName}">Baixar ${newFileName}</a>`;
            } else {
                advancedOutput.innerHTML = `<p>Erro: URL de download não recebida ou tempo limite excedido.</p>`;
            }

        } catch (error) {
            console.error('Erro na conversão avançada:', error);
            advancedOutput.innerHTML = `<p style="color: red;">Erro na conversão: ${error.message}</p>`;
        }
    });
});