document.addEventListener('DOMContentLoaded', () => {
    const rankingList = document.getElementById('ranking');

    const loadRanking = () => {
        fetch('/ranking')
            .then(response => response.json())
            .then(ranking => {
                rankingList.innerHTML = '';
                ranking.forEach((itemRanking) => {
                    const itemRankingDiv = document.createElement('div');
                    itemRankingDiv.classList.add('item-ranking');
                    itemRankingDiv.id = itemRanking.id_partida;
                    itemRankingDiv.innerHTML = `
                        <h3>${itemRanking.id_partida} - ${itemRanking.username} - ${itemRanking.pontuacao_total}</h3>
                    `;
                    rankingList.appendChild(itemRankingDiv);
                });
            })
            .catch(error => console.error('Erro ao carregar ranking:', error));
    };
    loadRanking();
});