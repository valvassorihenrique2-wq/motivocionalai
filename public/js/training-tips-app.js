// js/training-tips-app.js

document.addEventListener('DOMContentLoaded', async () => {
    // É importante que 'trainingTipsContent' seja o ID do elemento no seu HTML (dicas-de-saude.html)
    const trainingTipsElement = document.getElementById('trainingTipsContent');
    // Você pode querer adicionar um elemento para mensagens de carregamento/erro aqui também,
    // similar ao que você tem para a frase motivacional
    const loadingTipsMessage = document.getElementById('loadingTipsMessage') || null; // Crie este ID se quiser
    const errorTipsMessage = document.getElementById('errorTipsMessage') || null; // Crie este ID se quiser

    // Assumindo que você tem um elemento para a galeria de vídeos de treino nesta página
    const trainingVideosGallery = document.getElementById('trainingVideosGallery'); 

    // Função para criar e adicionar um iframe de vídeo
    function createVideoEmbed(video, containerElement) {
        if (!containerElement) {
            console.error("Elemento container para vídeos não encontrado.");
            return;
        }

        const videoContainer = document.createElement('div');
        videoContainer.classList.add('video-container');
        videoContainer.classList.add('aspect-ratio-16x9');

        const iframe = document.createElement('iframe');
        iframe.setAttribute('width', '560');
        iframe.setAttribute('height', '315');
        // A URL do YouTube deve ser no formato de embed
        // Verifique se video.id é apenas o ID do vídeo (ex: "dQw4w9WgXcQ")
        iframe.setAttribute('src', `https://www.youtube.com/embed/${video.id}?rel=0`); 
        iframe.setAttribute('title', video.title || 'Vídeo de Treino do YouTube');
        iframe.setAttribute('frameborder', '0');
        iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
        iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
        iframe.setAttribute('allowfullscreen', '');
        iframe.setAttribute('loading', 'lazy');

        videoContainer.appendChild(iframe);
        containerElement.appendChild(videoContainer);
    }

    // Função para buscar as dicas de treino
    async function fetchTrainingTips() {
        if (!trainingTipsElement) {
            console.error("Elemento 'trainingTipsContent' não encontrado no HTML.");
            return;
        }

        trainingTipsElement.textContent = 'Carregando dicas de treino...';
        if (loadingTipsMessage) loadingTipsMessage.style.display = 'block';
        if (errorTipsMessage) errorTipsMessage.style.display = 'none';

        try {
            // CORREÇÃO: Removido '/.netlify/functions/' e 'tipss' para 'tips'
            const response = await fetch('/get-training-tips', {
                method: 'POST', // O server.js espera POST
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({}) // Envia um corpo vazio
            });

            if (!response.ok) {
                let errorData = {};
                try {
                    errorData = await response.json();
                } catch (jsonError) {
                    const textError = await response.text();
                    errorData.error = textError;
                }
                throw new Error(errorData.error || `Erro HTTP: ${response.status} ao buscar dicas.`);
            }
            const data = await response.json();
            trainingTipsElement.textContent = data.tips || 'Não foi possível carregar as dicas de treino no momento. Por favor, tente novamente.';
        } catch (error) {
            console.error('Erro ao buscar dicas de treino:', error);
            trainingTipsElement.textContent = 'Ops! Erro ao carregar as dicas de treino. Recarregue a página.';
            if (errorTipsMessage) {
                errorTipsMessage.textContent = `Detalhe do erro: ${error.message}`;
                errorTipsMessage.style.display = 'block';
            }
        } finally {
            if (loadingTipsMessage) loadingTipsMessage.style.display = 'none';
        }
    }

    // Função para buscar e exibir os vídeos de treino do YouTube (OPCIONAL)
    // ESTA FUNÇÃO REQUER UMA ROTA NO SEU SERVER.JS PARA PEGAR OS DADOS DOS VÍDEOS
    async function fetchTrainingVideos() {
        if (!trainingVideosGallery) {
            console.warn("Elemento 'trainingVideosGallery' não encontrado. Vídeos de treino não serão carregados.");
            return;
        }

        trainingVideosGallery.innerHTML = '<p class="loading-videos">Carregando Vídeos de Treino...</p>';
        try {
            // Esta rota '/get-training-videos' AINDA PRECISA SER IMPLEMENTADA NO SEU SERVER.JS
            // Por enquanto, ela provavelmente resultará em um erro 404 (Not Found)
            const response = await fetch('/get-training-videos'); // Método padrão GET é ok aqui se a API for GET
            if (!response.ok) {
                let errorData = {};
                try {
                    errorData = await response.json();
                } catch (jsonError) {
                    const textError = await response.text();
                    errorData.error = textError;
                }
                throw new Error(errorData.error || `Erro HTTP: ${response.status} ao buscar vídeos de treino.`);
            }
            const data = await response.json();

            trainingVideosGallery.innerHTML = ''; // Limpa o placeholder de carregamento

            if (data.trainingVideos && data.trainingVideos.length > 0) {
                data.trainingVideos.forEach(video => createVideoEmbed(video, trainingVideosGallery));
            } else {
                trainingVideosGallery.innerHTML = '<p>Nenhum vídeo de treino encontrado no momento. Volte mais tarde!</p>';
            }

        } catch (error) {
            console.error('Erro ao buscar vídeos de treino do YouTube:', error);
            trainingVideosGallery.innerHTML = `<p class="error">Ops! Erro ao carregar os vídeos: ${error.message}.</p>`;
        }
    }

    // Chame as funções ao carregar a página
    fetchTrainingTips();
    // Descomente a linha abaixo quando tiver a rota '/get-training-videos' implementada no server.js
    // fetchTrainingVideos(); 
});