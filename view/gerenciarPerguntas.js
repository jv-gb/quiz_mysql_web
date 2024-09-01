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
                <input type="text" name="resposta-${i}" id=${resposta.id} value="${resposta.texto}" required>
                <label>
                    <input type="radio" name="correta" value="${resposta.id}" ${resposta.correta ? 'checked' : ''}> Verdadeira
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
                const respostaId = editForm.querySelector(`[name="resposta-${i}"]`).id;
                const textoResposta = editForm.querySelector(`[name="resposta-${i}"]`).value;
                novasRespostas.push({
                    id_resposta: Number(respostaId),
                    texto_resposta: textoResposta,
                    correta: i == corretaIndex
                });
            }

            const data = {
                pergunta_id: questionIndex,
                pergunta_texto: novaPergunta,
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

const handleDelete = (event)=> {
    const questionIndex = event.target.dataset.id;
    const confirmacao = confirm("Você tem certeza que deseja excluir esta pergunta?");
    
    if (confirmacao) {
        // Se o usuário confirmar, envia uma requisição DELETE
        fetch(`/excluir-pergunta/${questionIndex}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert("Pergunta excluída com sucesso!");
                loadQuestions();
            } else {
                alert("Ocorreu um erro ao excluir a pergunta.");
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            alert("Ocorreu um erro ao excluir a pergunta.");
        });
    } else {
        // A exclusão foi cancelada
        alert("Exclusão cancelada.");
    }};


    loadQuestions();
});
