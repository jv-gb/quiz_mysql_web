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

app.get('/acessar-jogador',(req, res)=>{
    const nomeJogador = req.query['nome-jogador'];
    const senhaJogador = req.query['senha'];
    const sql = 'SELECT username FROM jogador WHERE username = (?) and senha = (?)';

    console.log(sql);

    connection.query(sql,[nomeJogador,senhaJogador],(err,response) => {
        if (err) {
            console.error('Usuário ou senha incorretos:', err);
            res.status(500).send('Usuário ou senha incorretos');
            return;
        }
        if(response.length === 0){
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

    connection.query(sql, [nomeJogador,senhaJogador], (err) => {
        if (err) {
            console.log('teste');
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
    const sql = `SELECT p.ID_pergunta, p.Texto_pergunta, r.ID_resposta, r.Texto_Resposta, r.correta 
                 FROM pergunta p
                 JOIN resposta r ON p.ID_pergunta = r.ID_pergunta`;

    connection.query(sql, (err, results) => {
        if (err) {
            console.error('Erro ao obter perguntas:', err);
            res.status(500).send('Erro ao obter perguntas');
            return;
        }

        const perguntasMap = new Map();

        results.forEach(result => {
            if (!perguntasMap.has(result.ID_pergunta)) {
                perguntasMap.set(result.ID_pergunta, {
                    ID_pergunta: result.ID_pergunta,
                    Texto_pergunta: result.Texto_pergunta,
                    respostas: []
                });
            }
            perguntasMap.get(result.ID_pergunta).respostas.push({
                ID_resposta: result.ID_resposta,
                texto: result.Texto_Resposta,
                correta: result.correta
            });
        });

        res.json(Array.from(perguntasMap.values()));
    });
});



// Update pergunta
app.put('/api/pergunta/:id', (req, res) => {
    const idPergunta = req.params.id;
    const { texto_pergunta, respostas } = req.body;

    connection.query('UPDATE pergunta SET texto_pergunta = ? WHERE id_pergunta = ?', [texto_pergunta, idPergunta], (err) => {
        if (err) return res.status(500).json({ error: err.message });

        const query = 'UPDATE resposta SET texto_resposta = ?, correta = ? WHERE id_resposta = ?';
        respostas.forEach(resposta => {
            connection.query(query, [resposta.texto_resposta, resposta.correta ? 1 : 0, resposta.id_resposta], (err) => {
                if (err) return res.status(500).json({ error: err.message });
            });
        });

        res.json({ success: true });
    });
});

// Adicionar pergunta
app.post('/api/pergunta', (req, res) => {
    const { texto_pergunta } = req.body;

    connection.query('INSERT INTO pergunta (texto_pergunta) VALUES (?)', [texto_pergunta], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        res.json({ success: true });
    });
});
// Iniciar o servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});