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
        advancedOutput.innerHTML = '<p>Iniciando conversão...</p>';
        convertAdvancedBtn.disabled = true;

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('targetFormat', targetFormat);

            const response = await fetch('/functions/createUploadJob', {
                method: 'POST',
                body: formData
            });

            const responseData = await response.json();

            if (!response.ok) {
                throw new Error(responseData.error || 'Erro desconhecido ao converter o arquivo.');
            }

            // Lógica adaptada para lidar com URL ou dados Base64
            if (responseData.downloadUrl) {
                const { downloadUrl } = responseData;
                const newFileName = `${file.name.split('.')[0]}.${targetFormat}`;
                advancedOutput.innerHTML = `<p>Conversão concluída!</p><a href="${downloadUrl}" download="${newFileName}">Baixar ${newFileName}</a>`;
            } else if (responseData.fileData) {
                const { fileData, fileName, fileExt } = responseData;
                
                // Converte o Base64 para um Blob
                const byteCharacters = atob(fileData);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: 'application/octet-stream' });

                // Cria uma URL para o Blob e gera o link de download
                const downloadUrl = URL.createObjectURL(blob);
                const newFileName = fileName || `${file.name.split('.')[0]}.${fileExt}`;
                
                advancedOutput.innerHTML = `<p>Conversão concluída!</p><a href="${downloadUrl}" download="${newFileName}">Baixar ${newFileName}</a>`;
            } else {
                advancedOutput.innerHTML = `<p>Erro: Resposta de conversão inválida.</p>`;
            }

        } catch (error) {
            console.error('Erro na conversão avançada:', error);
            advancedOutput.innerHTML = `<p style="color: red;">Erro na conversão: ${error.message}</p>`;
        } finally {
            convertAdvancedBtn.disabled = false;
        }
    });
});