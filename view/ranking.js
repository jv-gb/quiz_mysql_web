document.addEventListener('DOMContentLoaded', () => {
    const rankingList = document.getElementById('ranking');

    const loadRanking = () => {
        fetch('/ranking')
            .then(response => response.json())
            .then(ranking => {
                rankingList.innerHTML = `
                    <table class="ranking-table">
                        <thead>
                            <tr>
                                <th>Número da Partida</th>
                                <th>Nome do Jogador</th>
                                <th>Pontuação</th>
                            </tr>
                        </thead>
                        <tbody id="rankingBody">
                        </tbody>
                    </table>
                `;
                
                const rankingBody = document.getElementById('rankingBody');
                ranking.forEach((itemRanking) => {
                    const row = document.createElement('tr');
                    row.id = itemRanking.id_partida;
                    row.innerHTML = `
                        <td>${itemRanking.id_partida}</td>
                        <td>${itemRanking.username}</td>
                        <td>${itemRanking.pontuacao_total}</td>
                    `;
                    rankingBody.appendChild(row);
                });
            })
            .catch(error => console.error('Erro ao carregar ranking:', error));
    };
    
    loadRanking();
});