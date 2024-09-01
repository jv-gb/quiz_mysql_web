const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const app = express();
const port = 3000;

app.use(express.json());

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

app.get('/acessar-jogador', (req, res) => {
    const nomeJogador = req.query['nome-jogador'];
    const senhaJogador = req.query['senha'];
    const sql = 'SELECT username FROM jogador WHERE username = (?) and senha = (?)';

    console.log(sql);

    connection.query(sql, [nomeJogador, senhaJogador], (err, response) => {
        if (err) {
            console.error('Usuário ou senha incorretos:', err);
            res.status(500).send('Usuário ou senha incorretos');
            return;
        }
        if (response.length === 0) {
            console.error('Usuário ou senha incorretos:', err);
            res.status(401).send('Usuário ou senha incorretos');
            return;
        }
        res.redirect('/jogo.html');
    });

})

// Rota para salvar o jogador
app.post('/salvar-jogador', (req, res) => {

    const nomeJogador = req.body['nome-jogador-novo'];
    const senhaJogador = req.body['senha-nova'];
    console.log(nomeJogador);

    const sql = 'INSERT INTO jogador (username, senha) VALUES (?, ?)';

    connection.query(sql, [nomeJogador, senhaJogador], (err) => {
        if (err) {
            console.log('teste');
            console.error('Erro ao salvar o jogador:', err);
            res.status(500).send('Erro ao salvar o jogador');
            return;
        }

        res.redirect('/login.html');
    });
});


// Rota para salvar a pontuação
app.post('/salvar-pontuacao', (req, res) => {
    const idJogador = req.body.id; // ID do jogador enviado pelo frontend
    const pontuacao = parseInt(req.body.pontuacao, 10); // Converte a pontuação para um número inteiro

    // Verifica se a pontuação é um número válido
    if (isNaN(pontuacao)) {
        console.error('Pontuação inválida:', req.body.pontuacao);
        res.status(400).send('Pontuação inválida');
        return;
    }

    // Consulta SQL para inserir a pontuação na tabela partida
    const sql = `
        INSERT INTO partida (ID_jogador, pontuacao_total)
        VALUES (?, ?)
    `;

    // Executando a consulta SQL
    connection.query(sql, [idJogador, pontuacao], (err) => {
        if (err) {
            console.error('Erro ao salvar a pontuação:', err);
            res.status(500).send('Erro ao salvar a pontuação');
            return;
        }
        // Redirecionando para a página de ranking após salvar a pontuação
        res.redirect('/ranking.html');
    });
});


// Rota para visualizar perguntas
app.get('/perguntas', (req, res) => {
    const sql = `SELECT * FROM
        (SELECT DISTINCT p.id_pergunta, p.texto_pergunta
            FROM pergunta p
            ORDER BY RAND ()
            LIMIT 10) as pr
            JOIN resposta r ON pr.id_pergunta = r.id_pergunta`;

    connection.query(sql, (err, results) => {
        console.log(results);

        if (err) {
            console.error('Erro ao obter perguntas:', err);
            res.status(500).send('Erro ao obter perguntas');
            return;
        }

        const perguntasMap = new Map();

        results.forEach(result => {
            if (!perguntasMap.has(result.texto_pergunta)) {
                perguntasMap.set(result.texto_pergunta, []);
            }
            perguntasMap.get(result.texto_pergunta).push({
                texto: result.texto_resposta,
                correta: result.correta
            });
        });

        const perguntas = Array.from(perguntasMap.entries()).map(([pergunta, respostas]) => ({
            pergunta,
            respostas: respostas.sort(() => 0.5 - Math.random())
        }));

        res.json(perguntas);
    });
});

// Rota principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'view/index.html'));
});


// Rota para obter todas as perguntas
app.get('/obter-perguntas', (req, res) => {
    const sql = `SELECT p.id_pergunta, p.texto_pergunta, r.id_resposta, r.texto_resposta, r.correta 
                 FROM pergunta p
                 JOIN resposta r ON p.id_pergunta = r.id_pergunta`;

    connection.query(sql, (err, results) => {
        if (err) {
            console.error('Erro ao obter perguntas:', err);
            res.status(500).send('Erro ao obter perguntas');
            return;
        }

        const perguntasRespostas = [];

        results.forEach(result => {
            if (!perguntasRespostas.find(pergunta => pergunta.id === result.id_pergunta)) {
                return perguntasRespostas.push({
                    id: result.id_pergunta,
                    pergunta: result.texto_pergunta,
                    respostas: [{
                        id: result.id_resposta,
                        texto: result.texto_resposta,
                        correta: result.correta
                    }]
                })
            }
            return perguntasRespostas.find(pergunta => pergunta.id === result.id_pergunta).respostas.push({
                id: result.id_resposta,
                texto: result.texto_resposta,
                correta: result.correta
            })
        })

        res.json(perguntasRespostas);
    })
});



// Update pergunta
app.put('/editar-pergunta/:id', (req, res) => {
    const idPergunta = Number(req.params.id);
    const { pergunta_texto, respostas } = req.body;
    console.log(req.body);
    if (!pergunta_texto || !respostas || respostas.length !== 4) return res.status(500).json({ error: err.message });

    connection.query('UPDATE pergunta SET texto_pergunta = ? WHERE id_pergunta = ?', [pergunta_texto, idPergunta], (err) => {
        if (err) return res.status(500).json({ error: err.message });

        const query = 'UPDATE resposta SET texto_resposta = ?, correta = ? WHERE id_resposta = ?';

        respostas && respostas.forEach(resposta => {
            connection.query(query, [resposta.texto_resposta, resposta.correta ? 1 : 0, resposta.id_resposta], (err) => {
                if (err) return res.status(500).json({ error: err.message });
            });
        });

        res.json({ success: true });
    });
});

//deletar perguntas
app.delete('/excluir-pergunta/:id', (req, res) => {
    const idPergunta = Number(req.params.id);

    connection.query('DELETE FROM pergunta WHERE id_pergunta = ?', [idPergunta], (err) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ success: true });
    });


});

app.get('/ranking', (req, res) => {
    const sql = `SELECT partida.id_partida, jogador.username, partida.pontuacao_total
    FROM jogador
    JOIN partida
    ON jogador.id_jogador = partida.id_jogador
    ORDER BY partida.pontuacao_total
    LIMIT 10`;

    connection.query(sql, (err,results) => {
        if (err) {
            return res.status(500).json({ error: err.message })
        }
        res.json(results);
    })

})

// Iniciar o servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});