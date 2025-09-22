// js/advancedconverter.js

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
            // Passo 1: Solicita uma URL de upload ao backend.
            const response = await fetch('/.netlify/functions/createUploadJob', {
                method: 'POST',
                body: JSON.stringify({
                    fileName: file.name,
                    targetFormat: targetFormat
                }),
                headers: { 'Content-Type': 'application/json' }
            });

            const responseData = await response.json();
            if (!response.ok) {
                throw new Error(responseData.error || 'Erro ao preparar a conversão. Resposta do servidor não foi OK.');
            }

            const { uploadUrl, jobId } = responseData;

            // Passo 2: Faz o upload do arquivo diretamente para a URL do CloudConvert.
            advancedOutput.innerHTML = '<p>Enviando arquivo...</p>';
            
            // CORREÇÃO AQUI: Adiciona o cabeçalho 'Origin' para ajudar a resolver problemas de CORS.
            const uploadResponse = await fetch(uploadUrl, {
                method: 'PUT',
                body: file,
                headers: {
                    'Origin': window.location.origin
                }
            });

            if (!uploadResponse.ok) {
                // Tenta ler o corpo da resposta para uma mensagem de erro mais detalhada
                let errorMessage = 'Falha no upload direto para o CloudConvert.';
                try {
                    const errorBody = await uploadResponse.text();
                    errorMessage = errorBody || errorMessage;
                } catch (e) {
                    // Ignora o erro se a leitura do corpo falhar
                }
                throw new Error(errorMessage);
            }

            // Passo 3: Espera a conversão terminar (polling).
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