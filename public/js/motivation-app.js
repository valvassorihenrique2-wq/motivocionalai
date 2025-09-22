// js/motivation-app.js

document.addEventListener('DOMContentLoaded', async () => {
    const fraseMotivadoraElement = document.getElementById('fraseMotivadora');
    const loadingMessage = document.getElementById('loadingMessage');
    const errorMessage = document.getElementById('errorMessage');

    // --- FUNÇÃO DE UTILIDADE PARA TRATAMENTO DE FETCH ---

    // Função centralizada para fazer fetch e tratar erros da API de forma segura.
    async function fetchData(url, options = {}) {
        const response = await fetch(url, options);

        // A resposta é lida como texto UMA ÚNICA VEZ.
        const responseBody = await response.text();

        // Agora verificamos se a resposta foi um sucesso.
        if (!response.ok) {
            // Se a resposta não for OK, lançamos um erro com a mensagem do corpo da resposta.
            throw new Error(responseBody || `Erro HTTP: ${response.status} ao buscar dados.`);
        }

        try {
            // Tentamos converter a resposta para JSON APÓS a verificação de sucesso.
            return JSON.parse(responseBody);
        } catch (jsonError) {
            // Se a conversão JSON falhar, retornamos um erro claro.
            throw new Error(`Falha ao converter resposta para JSON: ${jsonError.message}`);
        }
    }

    // --- FUNÇÃO DE BUSCA DE DADOS E EXIBIÇÃO ---

    // Busca e exibe a frase motivacional.
    async function fetchMotivationPhrase() {
        if (!fraseMotivadoraElement || !loadingMessage || !errorMessage) return;

        fraseMotivadoraElement.textContent = 'Carregando sua frase...';
        loadingMessage.style.display = 'block';
        errorMessage.style.display = 'none';

        try {
            // Verifique se o caminho da URL está correto
            const data = await fetchData('/.netlify/functions/get-motivation', {
                method: 'POST',
                body: JSON.stringify({})
            });

            fraseMotivadoraElement.textContent = data.phrase || 'Não foi possível gerar a frase no momento.';
        } catch (error) {
            console.error('Erro ao buscar frase motivacional:', error);
            fraseMotivadoraElement.textContent = 'Ops! Não conseguimos carregar a frase. Tente recarregar a página.';
            errorMessage.textContent = `Detalhe: ${error.message}`;
            errorMessage.style.display = 'block';
        } finally {
            loadingMessage.style.display = 'none';
        }
    }

    // --- EXECUÇÃO AO CARREGAR A PÁGINA ---

    fetchMotivationPhrase();
});