// js/motivation-app.js

document.addEventListener('DOMContentLoaded', async () => {
    const fraseMotivadoraElement = document.getElementById('fraseMotivadora');
    const loadingMessage = document.getElementById('loadingMessage');
    const errorMessage = document.getElementById('errorMessage');

    // --- FUNÇÃO CENTRALIZADA DE FETCH E TRATAMENTO DE ERROS ---

    async function fetchData(url, options = {}) {
        const response = await fetch(url, options);

        // AQUI ESTÁ A CHAVE: Lê o corpo da resposta como texto uma única vez.
        const responseBody = await response.text();

        if (!response.ok) {
            // Se a resposta NÃO for bem-sucedida, lança um erro com a mensagem do corpo.
            // O corpo pode ser um JSON de erro ou um texto simples.
            throw new Error(responseBody || `Erro HTTP: ${response.status}`);
        }

        try {
            // Se a resposta for OK, tenta convertê-la para JSON.
            return JSON.parse(responseBody);
        } catch (jsonError) {
            // Se falhar, é porque o corpo não era um JSON válido.
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
            // CORREÇÃO AQUI: Remove o método 'POST'. O fetch usará o método 'GET' por padrão.
            // O corpo da requisição também é removido, já que não é necessário para GET.
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

    // --- EXECUÇÃO AO CARREGAR A PÁGINA ---

    fetchMotivationPhrase();
});