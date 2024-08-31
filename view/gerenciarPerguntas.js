document.addEventListener('DOMContentLoaded', () => {
    const questionsList = document.getElementById('questions-list');
    let listaPerguntas;

    const loadQuestions = () => {
        fetch('/obter-perguntas')
            .then(response => response.json())
            .then(perguntas => {
                listaPerguntas = perguntas;
                questionsList.innerHTML = '';
                perguntas.forEach((pergunta) => {
                    const perguntaDiv = document.createElement('div');
                    perguntaDiv.classList.add('pergunta-item');
                    perguntaDiv.id = pergunta.id;
                    perguntaDiv.innerHTML = `
                        <h3>${pergunta.id}. ${pergunta.pergunta}</h3>
                        ${pergunta.respostas.map((resposta) => `
                            <p class="resposta" id="${resposta.id}">
                                <span>${resposta.texto} ${resposta.correta ? '(Verdadeira)' : ''}</span>
                            </p>
                        `).join('')}
                        <button class="btn editar" data-id="${pergunta.id}">Editar</button>
                        <button class="btn excluir" data-id="${pergunta.id}">Excluir</button>
                    `;
                    questionsList.appendChild(perguntaDiv);
                });

                // Adicionar eventos de clique para editar e excluir
                document.querySelectorAll('.editar').forEach(btn => {
                    btn.addEventListener('click', handleEdit);
                });
                document.querySelectorAll('.excluir').forEach(btn => {
                    btn.addEventListener('click', handleDelete);
                });
            })
            .catch(error => console.error('Erro ao carregar perguntas:', error));
    };

    const handleEdit = (event) => {
        const questionIndex = event.target.dataset.id;
        const questionData = listaPerguntas.find(pergunta => Number(pergunta.id) === Number(questionIndex));

        const editForm = document.createElement('form');
        editForm.classList.add('edit-form');
        console.log(questionData);


        editForm.innerHTML = `
            <input type="text" name="nova-pergunta" value="${questionData.pergunta}" required>
            ${questionData.respostas.map((resposta, i) => `
                <input type="text" name="resposta-${i}" value="${resposta.texto}" required>
                <label>
                    <input type="radio" name="correta" value="${i}" ${resposta.correta ? 'checked' : ''}> Verdadeira
                </label>
            `).join('')}
            <button type="submit" class="btn salvar">Salvar</button>
            <button type="button" class="btn cancelar">Cancelar</button>
        `;

        event.target.closest('.pergunta-item').appendChild(editForm);

        editForm.querySelector('.cancelar').addEventListener('click', () => {
            editForm.remove();
        });

        editForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const novaPergunta = editForm.querySelector('[name="nova-pergunta"]').value;
            const novasRespostas = [];
            const corretaIndex = editForm.querySelector('[name="correta"]:checked').value;

            for (let i = 0; i < questionData.respostas.length; i++) {
                novasRespostas.push({
                    texto: editForm.querySelector(`[name="resposta-${i}"]`).value,
                    correta: i == corretaIndex
                });
            }

            const data = {
                pergunta: novaPergunta,
                respostas: novasRespostas
            };
            console.log(data);

            fetch(`/editar-pergunta/${questionData.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })
                .then(() => loadQuestions())
                .catch(error => console.error('Erro ao salvar alteração:', error));
        });
    };

    const handleDelete = (event) => {
        const questionIndex = event.target.dataset.id;
        const questionData = perguntas[questionIndex];

        fetch(`/excluir-pergunta/${questionData.id}`, {
            method: 'DELETE'
        })
            .then(() => loadQuestions())
            .catch(error => console.error('Erro ao excluir pergunta:', error));
    };

    loadQuestions();
});
