document.addEventListener('DOMContentLoaded', () => {
    let currentQuestionIndex = 0;
    let score = 0;
    let perguntas = [];

    const container = document.querySelector('.container');
    const scoreElement = document.querySelector('.score');

    const updateScore = () => {
        scoreElement.textContent = `Pontuação: ${score}`;
    };

    const loadQuestion = () => {
        if (currentQuestionIndex >= perguntas.length) {
            container.innerHTML = `<h1>Fim do Quiz! Pontuação Final: ${score}</h1>`;
            // Aqui você pode enviar a pontuação final ao servidor se necessário
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

        perguntaDiv.querySelectorAll('.option').forEach(option => {
            option.addEventListener('click', () => {
                perguntaDiv.querySelectorAll('.option').forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
            });
        });
    };

    fetch('/perguntas')
        .then(response => response.json())
        .then(data => {
            perguntas = data.map(q => ({
                pergunta: q.pergunta,
                respostas: q.respostas
            }));
            loadQuestion();
        })
        .catch(error => console.error('Erro ao carregar perguntas:', error));
});
