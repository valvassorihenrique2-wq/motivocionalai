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
        convertAdvancedBtn.disabled = true; // Desabilita o botão para evitar cliques múltiplos

        try {
            // Cria um objeto FormData para enviar o arquivo e o formato para o backend
            const formData = new FormData();
            formData.append('file', file);
            formData.append('targetFormat', targetFormat);

            // Passo 1: Envia o arquivo e as informações diretamente para o backend
            const response = await fetch('/.netlify/functions/createUploadJob', {
                method: 'POST',
                body: formData
            });

            const responseData = await response.json();

            if (!response.ok) {
                throw new Error(responseData.error || 'Erro desconhecido ao converter o arquivo.');
            }

            const { downloadUrl } = responseData;

            if (downloadUrl) {
                const newFileName = `${file.name.split('.')[0]}.${targetFormat}`;
                advancedOutput.innerHTML = `<p>Conversão concluída!</p><a href="${downloadUrl}" download="${newFileName}">Baixar ${newFileName}</a>`;
            } else {
                advancedOutput.innerHTML = `<p>Erro: URL de download não recebida.</p>`;
            }

        } catch (error) {
            console.error('Erro na conversão avançada:', error);
            advancedOutput.innerHTML = `<p style="color: red;">Erro na conversão: ${error.message}</p>`;
        } finally {
            convertAdvancedBtn.disabled = false; // Habilita o botão novamente
        }
    });
});