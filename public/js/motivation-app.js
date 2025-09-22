// js/motivation-app.js

document.addEventListener('DOMContentLoaded', async () => {
    // Elementos da Frase Motivacional
    const fraseMotivadoraElement = document.getElementById('fraseMotivadora');
    const loadingMessage = document.getElementById('loadingMessage');
    const errorMessage = document.getElementById('errorMessage');
    
    // NOVO: Elemento da Dica de Treino
    const trainingTipElement = document.getElementById('trainingTipsContent');

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
            const data = await fetchData('/.netlify/functions/get-motivation');
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

    // --- NOVO: FUNÇÃO PARA BUSCAR E EXIBIR A DICA DE TREINO ---

    async function fetchTrainingTip() {
        if (!trainingTipElement) return;

        trainingTipElement.innerHTML = '<p>Carregando dica...</p>';

        try {
            const allTips = await fetchData('/.netlify/functions/get-training-tips');

            if (allTips && allTips.length > 0) {
                // Pega a primeira dica do array retornado
                const tip = allTips[0];
                trainingTipElement.innerHTML = `
                   
                    <p>${tip.conteudo}</p>
                `;
            } else {
                trainingTipElement.innerHTML = '<p>Nenhuma dica de treino encontrada no momento.</p>';
            }
        } catch (error) {
            console.error('Erro ao buscar dica de treino:', error);
            trainingTipElement.innerHTML = `<p style="color: red;">Ops! Erro ao carregar a dica de treino. ${error.message}.</p>`;
        }
    }

    // --- EXECUÇÃO AO CARREGAR A PÁGINA ---

    fetchMotivationPhrase();
    fetchTrainingTip(); // NOVO: Chama a função para buscar a dica de treino
});