// js/motivation-app.js

document.addEventListener('DOMContentLoaded', async () => {
    // Elementos da Frase Motivacional e Dica de Treino
    const fraseMotivadoraElement = document.getElementById('fraseMotivadora');
    const trainingTipsElement = document.getElementById('trainingTipsContent');
    const loadingMessage = document.getElementById('loadingMessage');
    const errorMessage = document.getElementById('errorMessage');

    // --- FUNÇÃO CENTRALIZADA DE FETCH E TRATAMENTO DE ERROS ---

    async function fetchData(url, options = {}) {
        const response = await fetch(url, options);

        const responseBody = await response.text();

        if (!response.ok) {
            throw new Error(responseBody || `Erro HTTP: ${response.status}`);
        }

        try {
            return JSON.parse(responseBody);
        } catch (jsonError) {
            throw new Error(`Falha ao converter resposta para JSON. Resposta do servidor: ${responseBody}`);
        }
    }

    // --- FUNÇÃO DE BUSCA E EXIBIÇÃO DA FRASE MOTIVACIONAL ---

    async function fetchMotivationPhrase() {
        if (!fraseMotivadoraElement || !loadingMessage || !errorMessage) return;

        fraseMotivadoraElement.textContent = 'Carregando sua frase...';
        loadingMessage.style.display = 'block';
        errorMessage.style.display = 'none';

        try {
            // CORREÇÃO: Usando a URL correta para o Cloudflare Pages
            const data = await fetchData('/functions/get-motivation');
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

    // --- FUNÇÃO PARA BUSCAR E EXIBIR A DICA DE TREINO ---

    async function fetchTrainingTip() {
        if (!trainingTipsElement) return;
        trainingTipsElement.innerHTML = '<p>Carregando dica...</p>';

        try {
            // CORREÇÃO: Usando a URL correta para o Cloudflare Pages
            const tipObject = await fetchData('/functions/get-training-tips');
            const tipContent = tipObject.content;

            if (tipContent) {
                trainingTipsElement.innerHTML = tipContent;
            } else {
                trainingTipsElement.innerHTML = '<p>Nenhuma dica de treino encontrada no momento.</p>';
            }
        } catch (error) {
            console.error('Erro ao buscar dica de treino:', error);
            trainingTipsElement.innerHTML = `<p style="color: red;">Ops! Erro ao carregar a dica. ${error.message}.</p>`;
        }
    }

    // --- EXECUÇÃO AO CARREGAR A PÁGINA ---
    fetchMotivationPhrase();
    fetchTrainingTip();

});