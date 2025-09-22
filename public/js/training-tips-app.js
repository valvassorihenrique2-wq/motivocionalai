// js/training-tips-app.js

document.addEventListener('DOMContentLoaded', async () => {
    const trainingTipsElement = document.getElementById('trainingTipsContent');

    // Função para buscar e exibir as dicas de treino
    async function fetchTrainingTips() {
        if (!trainingTipsElement) {
            console.error("Elemento 'trainingTipsContent' não encontrado no HTML.");
            return;
        }

        // Exibe mensagem de carregamento
        trainingTipsElement.innerHTML = '<p>Carregando dicas de treino...</p>';

        try {
            // A sua função no Netlify lida com requisições GET por padrão.
            // Não há necessidade de 'POST' ou de enviar um corpo vazio.
            const response = await fetch('/.netlify/functions/get-training-tips');

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status} ao buscar dicas.`);
            }

            const allTips = await response.json();

            // Limpa o conteúdo de carregamento
            trainingTipsElement.innerHTML = '';

            if (allTips.length > 0) {
                // Itera sobre cada dica e cria um elemento HTML para ela
                allTips.forEach(tip => {
                    const tipArticle = document.createElement('article');
                    const titleElement = document.createElement('h3');
                    titleElement.textContent = tip.titulo;
                    const contentElement = document.createElement('p');
                    contentElement.textContent = tip.conteudo;
                    
                    tipArticle.appendChild(titleElement);
                    tipArticle.appendChild(contentElement);
                    trainingTipsElement.appendChild(tipArticle);
                });
            } else {
                trainingTipsElement.innerHTML = '<p>Nenhuma dica de treino encontrada no momento.</p>';
            }

        } catch (error) {
            console.error('Erro ao buscar dicas de treino:', error);
            trainingTipsElement.innerHTML = `<p style="color: red;">Ops! Erro ao carregar as dicas de treino. ${error.message}.</p>`;
        }
    }

    // Chame as funções ao carregar a página
    fetchTrainingTips();
    // Você pode chamar a função de vídeos aqui quando ela estiver implementada
    // fetchTrainingVideos();
});