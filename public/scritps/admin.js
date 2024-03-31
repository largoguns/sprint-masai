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
                window.location.href = 'admin.html';
            } else {
                console.error('Error al actualizar la configuración:', response.error);
            }
        } catch (error) {
            console.error('Error actualizar la configuración votar:', error);
        }
    }
}

async function votingStatus(value, dateTime) {
    try {
        let response2 = { ok: true, error: null };
        const response = await fetch(`${APIEndpoint}/config/votingStatus`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ votingStatus: value })
        });

        if (value == "open" && dateTime != null) {
            response2 = await fetch(`${APIEndpoint}/config/programVotingEnd`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ date: dateTime.split(" ")[0], time: dateTime.split(" ")[1] })
            });
        }

        if (value == "closed") {            
            response2 = await fetch(`${APIEndpoint}/config/programVotingEnd`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });            
        }

        if (response.ok && response2.ok) {
            window.location.href = 'admin.html';
        } else {
            console.error('Error al actualizar la configuración:', response.error, response2.error);
        }
    } catch (error) {
        console.error('Error actualizar la configuración votar:', error);
    }
}

async function addConfigButtons() {
    const limitContainer = document.getElementById("limits");
    
    const responseConfig = await fetch(`${APIEndpoint}/config`);
    const votingLimitButton = document.createElement("button");
    const configStatusButton = document.createElement("button");

    config = await responseConfig.json();

    if (config.votingLimit == -1) {
        votingLimitButton.innerText = "1️⃣ Voto único";
        
        votingLimitButton.addEventListener('click', async function() {
            await updateConfig(1);
        });
    } else {
        votingLimitButton.innerText = "♾️ Voto libre";
        
        votingLimitButton.addEventListener('click', async function() {
            await updateConfig(-1);
        });        
    }

    if (config.votingStatus == "closed") {
        configStatusButton.innerText = "🔓 Abrir votaciones";
        
        configStatusButton.addEventListener('click', async function() {
            document.getElementById("endVotingDateTimePicker").style.display = "block";            
        });
    } else {
        configStatusButton.innerText = "🔒 Cerrar votaciones";
        
        configStatusButton.addEventListener('click', async function() {            
            await votingStatus("closed");
        });
    }    

    limitContainer.appendChild(votingLimitButton);
    limitContainer.appendChild(configStatusButton);

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
    await getHeader();
    APIEndpoint = await getBackendAddress();
    teamListData = await getTeams();
    
    await addConfigButtons();

    const deleteVotesButton = document.getElementById('deleteVotesButton');

    deleteVotesButton.addEventListener('click', () => {
        const confirmation = confirm('¿Estás seguro de que quieres eliminar todas las votaciones?');

        if (confirmation) {
            deleteAllVotes();
        }
    });    

    dateTimePickerInit();
});

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

function dateTimePickerInit() {    
    flatpickr("#endVoting", {
        enableTime: true,
        dateFormat: "Y-m-d H:i",
        time_24hr: true,
        minDate: "today",
        "locale": {
            "firstDayOfWeek": 1
        }
    });


    document.querySelector(".datetime-modal-content").addEventListener("click", (ev) => {
        ev.stopPropagation();
        ev.preventDefault();
    });

    document.querySelector(".datetime-modal").addEventListener("click", (ev) => {
        document.getElementById("endVotingDateTimePicker").style.display = "none";
    });

    document.querySelector("#confirmCloseVoting").addEventListener("click", async () => {
        if (document.querySelector("#endVoting").value != "") {
            await votingStatus("open", document.querySelector("#endVoting").value);
            document.getElementById("endVotingDateTimePicker").style.display = "none";
        } else {
            alert("Debes indicar una fecha/hora de finalización de las votaciones");
        }
    });
}
