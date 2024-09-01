document.addEventListener('DOMContentLoaded', () => {
    let currentQuestionIndex = 0;
    let score = 0;
    let perguntas = [];
    let jogadorNome = ''; // Nome do jogador
    let jogadorId = window.location.search.split("=")[1]; // ID do jogador (certifique-se de definir isso corretamente)
    
    const container = document.querySelector('.container');
    const scoreElement = document.querySelector('.score');
    const pontuacaoForm = document.getElementById('pontuacao-form');
    const nomeJogadorInput = document.getElementById('nome-jogador-form');
    const pontuacaoInput = document.getElementById('pontuacao-form');
    const idJogadorInput = document.createElement('input');
    idJogadorInput.type = 'hidden';
    idJogadorInput.name = 'id';
    idJogadorInput.id = 'id-jogador-form';
    pontuacaoForm.appendChild(idJogadorInput);

    const updateScore = () => {
        scoreElement.textContent = `Pontuação: ${score}`;
    };

    const loadQuestion = () => {
        if (currentQuestionIndex >= perguntas.length) {
            // Preenche o formulário com o nome do jogador, ID e a pontuação
            nomeJogadorInput.value = jogadorNome;
            pontuacaoInput.value = score;
            idJogadorInput.value = jogadorId;

            // Exibe o botão "Jogar Novamente"
            container.innerHTML = `
                <h1>Fim do Quiz! Pontuação Final: ${score}</h1>
                <a href="../index.html" class="btn">Jogar Novamente</a>
                <button id="salvar-pontuacao" class="btn">Salvar Pontuação</button>
            `;
            document.getElementById('salvar-pontuacao').addEventListener('click', () => {
                const data = {
                    id: jogadorId,
                    pontuacao: score,
                }
                fetch(`/salvar-pontuacao`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                })
                    .then(() => window.location.replace("/ranking.html"))
                    .catch(error => console.error('Erro ao salvar alteração:', error));
            });

            return;
        }

        const pergunta = perguntas[currentQuestionIndex];
        container.innerHTML = '';

        const perguntaDiv = document.createElement('div');
        perguntaDiv.classList.add('pergunta');

        const perguntaText = document.createElement('p');
        perguntaText.textContent = pergunta.pergunta;
        perguntaDiv.appendChild(perguntaText);

        pergunta.respostas.forEach(resposta => {
            const label = document.createElement('label');
            label.classList.add('option');

            const input = document.createElement('input');
            input.type = 'radio';
            input.name = 'resposta';
            input.value = resposta.texto;
            input.id = resposta.texto;
            label.appendChild(input);

            const texto = document.createTextNode(resposta.texto);
            label.appendChild(texto);

            perguntaDiv.appendChild(label);
        });

        const nextButton = document.createElement('button');
        nextButton.type = 'button';
        nextButton.classList.add('btn');
        nextButton.textContent = 'Responder';
        nextButton.addEventListener('click', () => {
            const selectedOption = document.querySelector('input[name="resposta"]:checked');
            if (selectedOption) {
                if (selectedOption.value === pergunta.respostas.find(r => r.correta).texto) {
                    score += 10; // Cada pergunta vale 10 pontos
                }
                currentQuestionIndex++;
                updateScore();
                loadQuestion();
            } else {
                alert('Por favor, selecione uma resposta!');
            }
        });

        container.appendChild(perguntaDiv);
        container.appendChild(nextButton);

        // Adiciona o evento de clique para destacar a opção selecionada
        perguntaDiv.querySelectorAll('.option').forEach(option => {
            option.addEventListener('click', () => {
                perguntaDiv.querySelectorAll('.option').forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
            });
        });
    };

    // Carregar as perguntas da API
    fetch('/perguntas')
        .then(response => response.json())
        .then(data => {
            perguntas = data.map(q => ({
                pergunta: q.pergunta,
                respostas: q.respostas
            }));
            jogadorNome = new URLSearchParams(window.location.search).get('nome-jogador') || '';
            jogadorId = new URLSearchParams(window.location.search).get('id-jogador') || ''; // Defina corretamente o ID do jogador
            loadQuestion();
        })
        .catch(error => console.error('Erro ao carregar perguntas:', error));
});
