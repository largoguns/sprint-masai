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
    
    const responseConfig = await fetch(`${APIEndpoint}/config/votingLimit`);
    const newButton = document.createElement("button");

    config = await responseConfig.json();

    if (config.votingLimit == -1) {
        newButton.innerText = "Voto único";
        
        newButton.addEventListener('click', async function() {
            await updateConfig(1);
        });
    } else {
        newButton.innerText = "Voto libre";
        
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
    
    await addLimitConfigButton();

    const deleteVotesButton = document.getElementById('deleteVotesButton');

    deleteVotesButton.addEventListener('click', () => {
        const confirmation = confirm('¿Estás seguro de que quieres eliminar todas las votaciones?');

        if (confirmation) {
            deleteAllVotes();
        }
    });    
});

async function getBackendAddress() {
    // Hacer una solicitud para obtener la configuración del endpoint
    return fetch('/endpoint.config')
    .then(response => response.json())
    .then(data => {
        // Configurar una variable global con la URL del endpoint
        return `${data.endpoint}/api`;
    })
    .catch(error => {
        console.error('Error:', error);
        return null;
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