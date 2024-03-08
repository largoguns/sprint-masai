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
    await loadTeamData();
});

async function loadTeamData() {
    APIEndpoint = await getBackendAddress();

    const teamsReponse = await fetch(`${APIEndpoint}/teams/`);
    const teams = await teamsReponse.json();

    console.log(teams);

    const teamSelectList = document.querySelector("#teamSelectList");
    teamSelectList.innerHTML = "";

    teams.forEach(team => {
        const teamOption = document.createElement("li");
        teamOption.attributes["teamId"] = team._id
        teamOption.innerText = team.name;
        teamOption.addEventListener('click', (team) => 
            setUserTeam(team.target.attributes["teamId"])
        );
        
        teamSelectList.appendChild(teamOption);
    });

    const masailistElement = document.getElementById('masailist');
    masailistElement.innerHTML = "";

    try {

        const usersResponse = await fetch(`${APIEndpoint}/users/`);
        const users = await usersResponse.json();

        if (usersResponse.ok) {
            users.forEach(user => {
                const li = document.createElement('li');
                li.textContent = `${user.name}`;
                
                const spanTeam = document.createElement("span");
                spanTeam.className = "userTeam"
                spanTeam.innerText = getTeamName(teams, user.team) || "Sin grupo";
                spanTeam.addEventListener('click', () => mostrarPopup(user._id));
                
                li.appendChild(spanTeam);
                masailistElement.appendChild(li);

            });
        }
    } catch (error) {
        console.error('Error al cargar los resultados de votaciones:', error);
    }
}

function getTeamName(teams, id) {
    const foundTeam = teams.find((team) => team._id == id);
    if (foundTeam != null) {
        return foundTeam.name;
    } else {
        return "Sin grupo";
    }
}

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

function mostrarPopup(user) {
    var teamSelectList = document.querySelector("#teamSelectList");
    teamSelectList.attributes["userId"] = user;
    var popup = document.getElementById("teamPopup");    
    popup.style.display = "block";
}

function cerrarPopup() {
    var popup = document.querySelector("#teamPopup");
    popup.style.display = "none";
}

async function setUserTeam(valor) {
    var teamSelectList = document.querySelector("#teamSelectList");
    var userId = teamSelectList.attributes["userId"];

    const response = await fetch(`${APIEndpoint}/users/${userId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ team: valor })
    });

    if (response.ok) {
        await loadTeamData();
        cerrarPopup();
    } else {
        console.error('Error al actualizar al usuario:', response.error);
    }

}