const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// O Express irá servir os arquivos estáticos (HTML, CSS, JS) da pasta 'public'.
// Isso é o que faz com que seu site seja visível no navegador.
app.use(express.static(path.join(__dirname, 'public')));

// Esta rota de fallback é crucial para SPAs.
// Se o usuário tentar acessar qualquer URL no seu site (ex: /sobre, /contato),
// o servidor sempre enviará o arquivo index.html. O roteamento
// da página será então tratado pelo JavaScript do seu frontend.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});