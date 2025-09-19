// js/motivation-app.js (para o seu index.html)

document.addEventListener('DOMContentLoaded', async () => {
    const fraseMotivadoraElement = document.getElementById('fraseMotivadora');
    const trainingTipsElement = document.getElementById('trainingTipsContent'); // Este elemento está no index.html e em dicas-de-saude.html
    const loadingMessage = document.getElementById('loadingMessage');
    const errorMessage = document.getElementById('errorMessage');
    const videosGallery = document.getElementById('videosGallery'); // Para a galeria de vídeos principal

    // Função para buscar a frase motivacional
    async function fetchMotivationPhrase() {
        if (!fraseMotivadoraElement || !loadingMessage || !errorMessage) return;

        fraseMotivadoraElement.textContent = 'Carregando sua frase...';
        loadingMessage.style.display = 'block'; 
        errorMessage.style.display = 'none'; 
        try {
            // CORREÇÃO: Removido '/.netlify/functions/' e adicionado method: 'POST'
            const response = await fetch('/get-motivation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({})
            });

            if (!response.ok) {
                let errorData = {};
                try { errorData = await response.json(); } catch (jsonError) {
                    const textError = await response.text(); errorData.error = textError; }
                throw new Error(errorData.error || `Erro HTTP: ${response.status} ao buscar frase.`);
            }
            const data = await response.json();
            fraseMotivadoraElement.textContent = data.phrase || 'Não foi possível gerar a frase motivacional no momento. Tente novamente mais tarde.';
        } catch (error) {
            console.error('Erro ao buscar frase motivacional:', error);
            fraseMotivadoraElement.textContent = 'Ops! Não conseguimos carregar a frase. Tente recarregar a página.';
            errorMessage.textContent = `Detalhe do erro: ${error.message}`;
            errorMessage.style.display = 'block'; 
        } finally {
            loadingMessage.style.display = 'none'; 
        }
    }

    // Função para buscar as dicas de treino (esta função pode ser duplicada ou centralizada se ambas as páginas a usarem)
    async function fetchTrainingTips() {
        if (!trainingTipsElement) return;

        trainingTipsElement.textContent = 'Carregando dicas de treino...';
        try {
            // CORREÇÃO: Removido '/.netlify/functions/'
            const response = await fetch('/get-training-tips', { // Corrigido para /get-training-tips (sem o 's' extra)
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({})
            });
            if (!response.ok) {
                let errorData = {};
                try { errorData = await response.json(); } catch (jsonError) {
                    const textError = await response.text(); errorData.error = textError; }
                throw new Error(errorData.error || `Erro HTTP: ${response.status} ao buscar dicas.`);
            }
            const data = await response.json();
            trainingTipsElement.textContent = data.tips || 'Não foi possível carregar as dicas de treino no momento. Por favor, tente novamente.';
        } catch (error) {
            console.error('Erro ao buscar dicas de treino:', error);
            trainingTipsElement.textContent = 'Ops! Erro ao carregar as dicas de treino. Recarregue a página.';
        }
    }

    // Função para criar e adicionar um iframe de vídeo (DUPLICADA, pode ser centralizada)
    function createVideoEmbed(video, containerElement) {
        if (!containerElement) { console.error("Elemento container para vídeos não encontrado."); return; }
        const videoContainer = document.createElement('div');
        videoContainer.classList.add('video-container', 'aspect-ratio-16x9');
        const iframe = document.createElement('iframe');
        iframe.setAttribute('width', '560');
        iframe.setAttribute('height', '315');
        iframe.setAttribute('src', `https://www.youtube.com/embed/${video.id}?rel=0`); 
        iframe.setAttribute('title', video.title || 'Vídeo do YouTube');
        iframe.setAttribute('frameborder', '0');
        iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
        iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
        iframe.setAttribute('allowfullscreen', '');
        iframe.setAttribute('loading', 'lazy');
        videoContainer.appendChild(iframe);
        containerElement.appendChild(videoContainer);
    }

    // Função para buscar e exibir os vídeos do YouTube (para index.html)
    // ESTA FUNÇÃO REQUER UMA ROTA NO SEU SERVER.JS PARA PEGAR OS DADOS DOS VÍDEOS
    async function fetchYouTubeVideos() {
        if (!videosGallery) {
            console.warn("Elemento 'videosGallery' não encontrado. Vídeos não serão carregados.");
            return;
        }

        videosGallery.innerHTML = '<p class="loading-videos">Carregando Vídeos...</p>';
        try {
            // Esta rota '/get-youtube-videos' AINDA PRECISA SER IMPLEMENTADA NO SEU SERVER.JS
            const response = await fetch('/get-youtube-videos'); // Método padrão GET é ok aqui se a API for GET
            if (!response.ok) {
                let errorData = {};
                try { errorData = await response.json(); } catch (jsonError) {
                    const textError = await response.text(); errorData.error = textError; }
                throw new Error(errorData.error || `Erro HTTP: ${response.status} ao buscar vídeos.`);
            }
            const data = await response.json();

            videosGallery.innerHTML = ''; 

            if (data.regularVideos && data.regularVideos.length > 0) {
                data.regularVideos.forEach(video => createVideoEmbed(video, videosGallery));
            } else {
                videosGallery.innerHTML = '<p>Nenhum vídeo longo encontrado no momento. Volte mais tarde!</p>';
            }

        } catch (error) {
            console.error('Erro ao buscar vídeos do YouTube:', error);
            videosGallery.innerHTML = `<p class="error">Ops! Erro ao carregar os vídeos: ${error.message}.</p>`;
        }
    }

    // Chame todas as funções ao carregar a página
    fetchMotivationPhrase();
    fetchTrainingTips(); // Se você quer que a frase de treino apareça no index.html também
    // Descomente a linha abaixo quando tiver a rota '/get-youtube-videos' implementada no server.js
    // fetchYouTubeVideos();
});