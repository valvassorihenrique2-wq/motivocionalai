// js/training-tips-app.js

document.addEventListener('DOMContentLoaded', async () => {
    const trainingTipsElement = document.getElementById('trainingTipsContent');

    async function fetchTrainingTips() {
        if (!trainingTipsElement) {
            console.error("Elemento 'trainingTipsContent' não encontrado no HTML.");
            return;
        }

        trainingTipsElement.innerHTML = '<p>Carregando dicas de treino...</p>';

        try {
            // CORREÇÃO: Usando o caminho correto para o Netlify Function
            const response = await fetch('/.netlify/functions/get-training-tips');

            if (!response.ok) {
                // Lê o corpo da resposta UMA ÚNICA VEZ para obter a mensagem de erro.
                const errorData = await response.json().catch(() => ({ error: 'Resposta do servidor não é um JSON válido.' }));
                const errorMessage = errorData.error || `Erro HTTP: ${response.status} ao buscar dicas.`;
                throw new Error(errorMessage);
            }

            const allTips = await response.json();

            trainingTipsElement.innerHTML = '';

            if (allTips.length > 0) {
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

    fetchTrainingTips();
});