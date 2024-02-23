var APIEndpoint = "";

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

document.addEventListener('DOMContentLoaded', async () => {
    APIEndpoint = await getBackendAddress();
    
    await addLimitConfigButton();

    const votingResultsElement = document.getElementById('votingResults');

    const deleteVotesButton = document.getElementById('deleteVotesButton');

    deleteVotesButton.addEventListener('click', () => {
        const confirmation = confirm('¿Estás seguro de que quieres eliminar todas las votaciones?');

        if (confirmation) {
            deleteAllVotes();
        }
    });

    try {
        const response = await fetch(`${APIEndpoint}/votes/`);
        const votes = await response.json();

        if (response.ok) {
            const votingCount = {};

            // Contar los votos para cada usuario
            votes.forEach(vote => {
                const targetUserId = vote.targetUserId;
                if (votingCount[targetUserId]) {
                    votingCount[targetUserId]++;
                } else {
                    votingCount[targetUserId] = 1;
                }
            });

            let sortedVotes = [];
            for (var vote in votingCount) {
                sortedVotes.push({name: vote, votes: votingCount[vote]});
            }
            
            sortedVotes.sort(function(a, b) {
                return b.votes - a.votes;
            });
            
            // Obtener información de los usuarios
            const usersResponse = await fetch(`${APIEndpoint}/users/`);
            const users = await usersResponse.json();

            if (usersResponse.ok) {
                // Encontrar al usuario más votado
                let maxVotesUser = [];
                let maxVotes = 0;

                sortedVotes.forEach(userVoted => {
                    const votesReceived = userVoted.votes;
                    if (votesReceived >= maxVotes) {
                        maxVotes = votesReceived;
                        maxVotesUser.push(userVoted.name);
                    }
                });

                // Mostrar los resultados de las votaciones
                sortedVotes.forEach(user => {
                    const votesReceived = votingCount[user.name] || 0;
                    const li = document.createElement('li');
                    li.textContent = `${user.name}: ${votesReceived} votos`;
                    if (maxVotesUser.indexOf(user.name) > -1) {
                        li.classList.add('most-voted'); // Agregar clase de estilo para resaltar
                    }
                    votingResultsElement.appendChild(li);
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
