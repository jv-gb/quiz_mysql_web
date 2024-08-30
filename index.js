const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const app = express();
const port = 3000;





const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'admin',
    database: 'quizsql'
});

connection.connect((err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err.stack);
        return;
    }
    console.log('Conectado ao banco de dados.');
});

// Servir os arquivos estáticos
app.use(express.static(path.join(__dirname, 'view')));
app.use('/style', express.static(path.join(__dirname, 'style')));

// Middleware para parsear o corpo das requisições POST
app.use(express.urlencoded({ extended: true }));

// Rota para salvar o jogador
app.post('/salvar-jogador', (req, res) => {
    console.log('entrou aqui');
    const nomeJogador = req.body['nome-jogador'];
    const sql = 'INSERT INTO jogador (nome) VALUES (?)';

    connection.query(sql, [nomeJogador], (err) => {
        if (err) {
            console.error('Erro ao salvar o jogador:', err);
            res.status(500).send('Erro ao salvar o jogador');
            return;
        }
        res.redirect('/jogo.html');
    });
});

// Rota para salvar a pontuação
app.post('/salvar-pontuacao', (req, res) => {
    const nomeJogador = req.body['nome-jogador'];
    const pontuacao = req.body.pontuacao;
    const sql = 'UPDATE jogador SET pontuacao = ? WHERE nome = ?';

    connection.query(sql, [pontuacao, nomeJogador], (err) => {
        if (err) {
            console.error('Erro ao salvar a pontuação:', err);
            res.status(500).send('Erro ao salvar a pontuação');
            return;
        }
        res.redirect('/ranking.html');
    });
});

// Rota para visualizar perguntas
app.get('/perguntas', (req, res) => {
    const sql = `SELECT DISTINCT p.Texto_pergunta, r.Texto_Resposta, r.correta 
                 FROM pergunta p
                 JOIN resposta r ON p.ID_pergunta = r.ID_pergunta;`;

    connection.query(sql, (err, results) => {
        if (err) {
            console.error('Erro ao obter perguntas:', err);
            res.status(500).send('Erro ao obter perguntas');
            return;
        }

        const perguntasMap = new Map();

        // Agrupar perguntas e respostas
        results.forEach(row => {
            if (!perguntasMap.has(row.Texto_pergunta)) {
                perguntasMap.set(row.Texto_pergunta, []);
            }
            perguntasMap.get(row.Texto_pergunta).push({
                texto: row.Texto_Resposta,
                correta: row.correta
            });
        });

        const perguntas = Array.from(perguntasMap.entries()).map(([pergunta, respostas]) => ({
            pergunta,
            respostas: respostas.sort(() => 0.5 - Math.random()) // Embaralha as respostas
        }));

        res.json(perguntas.slice(0, 10)); // Retorna 10 perguntas
    });
});

// Configura a rota principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Iniciar o servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
