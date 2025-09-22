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
            const response = await fetch('/.netlify/functions/get-training-tipss');

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Erro HTTP: ${response.status} - ${errorText}`);
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