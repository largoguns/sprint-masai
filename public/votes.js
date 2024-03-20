var APIEndpoint = "";

var teamListData;

async function updateConfig(value) {

    const confirmation = confirm('Cambiar el tipo de voto eliminará todas las votaciones actuales. ¿Quieres continuar?');

    if (confirmation) {
        try {
            const response = await fetch(`${APIEndpoint}/config/votingLimit`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ votingLimit: value })
            });
    
            if (response.ok) {
                window.location.href = 'votes.html';
            } else {
                console.error('Error al actualizar la configuración:', response.error);
            }
        } catch (error) {
            console.error('Error actualizar la configuración votar:', error);
        }
    }
}

async function addLimitConfigButton() {
    const limitContainer = document.getElementById("limits");
    const votingMode = document.getElementById("votingMode");
    const responseConfig = await fetch(`${APIEndpoint}/config/votingLimit`);
    const newButton = document.createElement("button");

    config = await responseConfig.json();

    if (config.votingLimit == -1) {
        newButton.innerText = "Voto único";
        votingMode.innerText = "Resultados de Votaciones - Voto libre";
        newButton.addEventListener('click', async function() {
            await updateConfig(1);
        });
    } else {
        newButton.innerText = "Voto libre";
        votingMode.innerText = "Resultados de Votaciones - Voto único";
        newButton.addEventListener('click', async function() {
            await updateConfig(-1);
        });        
    }

    limitContainer.appendChild(newButton);

}

async function getTeams() {
    APIEndpoint = await getBackendAddress();

    const teamsReponse = await fetch(`${APIEndpoint}/teams/`);
    var data = await teamsReponse.json();

    for (let index = 0; index < data.length; index++) {
        data[index]["votesIn"] = 0;
        data[index]["votesOut"] = 0;
    }

    return data;
}

function addTeamVote(teamId, type) {
    if (teamListData.find((team) => team._id == teamId) != null) {
        if (type == "in") {
            teamListData.find((team) => team._id == teamId).votesIn += 1; 
        }
    
        if (type == "out") {
            teamListData.find((team) => team._id == teamId).votesOut += 1; 
        }    
    }
}

function getUserTeam(users, userName) {
    var foundUser = users.find((user) => user.name == userName);

    if (foundUser != null) {
        return foundUser.team ?? null;
    }

    return null;
}

function showTeamVotes() {
    var teamVotes = document.querySelector("#teamVotes");

    teamListData.forEach(team => {
        const liItem = document.createElement("tr");

        const teamName = document.createElement('td');
        teamName.textContent = team.name;

        const votesIn = document.createElement('td');
        votesIn.textContent = `Votos internos ${team.votesIn}`

        const votesOut = document.createElement('td');
        votesOut.textContent = `Votos externos ${team.votesOut}`

        
        liItem.appendChild(teamName);
        liItem.appendChild(votesIn);
        liItem.appendChild(votesOut);


        teamVotes.appendChild(liItem);
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    APIEndpoint = await getBackendAddress();
    teamListData = await getTeams();
    
    const votingResultsElement = document.getElementById('votingResults');

    
    let votesData = {
        labels: [],
        data: [],
        backgroundColors: []
    };
    
    const masaiList = [];
    
    const selfVotes = [];
    
    try {
        const response = await fetch(`${APIEndpoint}/votes/`);
        const votes = await response.json();

        if (response.ok) {
            // Obtener información de los usuarios
            const usersResponse = await fetch(`${APIEndpoint}/users/`);
            const users = await usersResponse.json();

            const votingCount = [];

            // Contar los votos para cada usuario
            votes.forEach(vote => {
                
                const targetUserId = vote.targetUserId;

                if (votingCount.find((user) => user.name == targetUserId) == null) {
                    votingCount.push({name: targetUserId, votesIn: 0, votesOut: 0, votes: 0, selfVotes: 0, comments: []});
                }

                if (vote.targetUserId === vote.voterId) {
                    votingCount.find((user) => user.name == targetUserId).selfVotes++;
                }

                if (getUserTeam(users, vote.voterId) == getUserTeam(users, vote.targetUserId)) {
                    addTeamVote(getUserTeam(users, vote.targetUserId), "in");
                    votingCount.find((user) => user.name == targetUserId).votesIn++;
                } else {
                    addTeamVote(getUserTeam(users, vote.targetUserId), "out");
                    votingCount.find((user) => user.name == targetUserId).votesOut++;
                }

                votingCount.find((user) => user.name == targetUserId).votes++;
                if (vote.comment != null) {
                    votingCount.find((user) => user.name == targetUserId).comments.push(vote.comment);
                }
            });

            votingCount.sort(function(a, b) {
                return b.votes - a.votes;
            });            

            if (usersResponse.ok) {
                // Encontrar al usuario más votado
                let maxVotesUser = [];
                let maxVotes = 0;

                votingCount.forEach(userVoted => {
                    const votesReceived = userVoted.votes;
                    if (votesReceived >= maxVotes) {
                        maxVotes = votesReceived;
                        maxVotesUser.push(userVoted.name);
                    }
                });

                // Mostrar los resultados de las votaciones
                votingCount.forEach(user => {
                    const votesReceived = user.votes || 0;
                    
                    const tr = document.createElement('tr');
                    const td1 = document.createElement('td');
                    td1.textContent = `${user.name}`;

                    const td2 = document.createElement('td');
                    td2.textContent = `${votesReceived}`;

                    const td3 = document.createElement('td');
                    td3.textContent = `${user.votesIn}`;
                    
                    const td4 = document.createElement('td');
                    td4.textContent = `${user.votesOut}`;    
                    
                    const td5 = document.createElement('td');
                    td5.textContent = user.selfVotes == 1 ? "✌️" : "";

                    tr.appendChild(td1);
                    tr.appendChild(td2);
                    tr.appendChild(td3);
                    tr.appendChild(td4);
                    tr.appendChild(td5);

                    votesData.labels.push(user.name);
                    votesData.data.push(votesReceived);
                    votesData.backgroundColors.push(generateRandomColor());

                    if (maxVotesUser.indexOf(user.name) > -1) {
                        tr.classList.add('most-voted'); // Agregar clase de estilo para resaltar
                        masaiList.push({ name: user.name, comments: user.comments });
                    }
                    votingResultsElement.appendChild(tr);
                });


            } else {
                console.error('Error al obtener la lista de usuarios:', users.error);
            }
        } else {
            console.error('Error al obtener los votos:', votes.error);
        }
    } catch (error) {
        console.error('Error al cargar los resultados de votaciones:', error);
    }

    masaiList.forEach(masai => {
        const liItem = document.createElement("li");

        const masaiIcon = document.createElement("img");
        masaiIcon.src = "resources/masai.png";

        const masaiName = document.createElement('span');
        masaiName.textContent = masai.name;

        const marquee = document.createElement('div');
        marquee.className = "marquee";

        const marqueeContent = document.createElement('div');
        marqueeContent.className = "marquee-content";        

        const userComments = masai.comments.reduce((comments, comment) => {
            const foundComment = comments.find((objeto) => {
                return objeto.comment === comment;
            });
        
            if (foundComment) {
                foundComment.count++;
            } else {
                comments.push({ comment: comment, count: 1 });
            }
        
            return comments;
        }, []);

        userComments.forEach(comment => {
            const tagComment = document.createElement("span");
            tagComment.innerText = comment.comment;
            tagComment.style.fontSize = `${comment.count * 10}px`;
            tagComment.title = `${comment.count} ${comment.count > 1 ? "veces": "vez"}`;
            marqueeContent.appendChild(tagComment);
        });

        marquee.appendChild(marqueeContent);

        liItem.appendChild(masaiIcon);
        liItem.appendChild(masaiName);
        liItem.appendChild(marquee);


        document.querySelector("#masainame").appendChild(liItem);
    });

    //showSelfVotes(selfVotes);

    showTeamVotes();

    populateChart(votesData);
});

function showSelfVotes(selfVotes) {
    selfVotes.forEach(user => {                    
        const selfVote = document.createElement('li');
        selfVote.textContent = `${user}`;
        document.querySelector("#selfvote").appendChild(selfVote);
    });
}

async function deleteAllVotes() {
    try {
        const response = await fetch(`${APIEndpoint}/votes/all`, {
            method: 'DELETE'
        });

        if (response.ok) {
            alert('Todas las votaciones han sido eliminadas correctamente');
            window.location.href = 'votes.html'
        } else {
            console.error('Error al eliminar votaciones:', response.error);
            alert('Hubo un error al eliminar las votaciones');
        }
    } catch (error) {
        console.error('Error al eliminar votaciones:', error);
        alert('Hubo un error al eliminar las votaciones');
    }
}

function populateChart(votesData) {
    const ctx = document.getElementById('votesChart');

    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: votesData.labels,
        datasets: [{
          label: 'Total de votos',
          data: votesData.data,
          backgroundColor: [
            'rgba(255, 99, 132, 0.8)',
            'rgba(255, 159, 64, 0.8)',
            'rgba(255, 205, 86, 0.8)',
            'rgba(75, 192, 192, 0.8)',
            'rgba(54, 162, 235, 0.8)',
            'rgba(153, 102, 255, 0.8)',
            'rgba(201, 203, 207, 0.8)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
}

function generateRandomColor() {
    var red = Math.floor(Math.random() * 256);
    var green = Math.floor(Math.random() * 256);
    var blue = Math.floor(Math.random() * 256);
    var alpha = Math.random().toFixed(1); // Transparency value between 0 and 1

    var randomColor = 'rgba(' + red + ',' + green + ',' + blue + ',' + alpha + ')';
    
    return randomColor;
}

