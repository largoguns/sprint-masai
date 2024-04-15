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

async function addConfigButtons() {
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
    await getHeader();
    await loadUsersData();
    addNewMasaiHandler();
});

function addNewMasaiHandler() {
    const addNew = document.getElementById('addNew');

    addNew.addEventListener('click', async () => {
        const popup = document.getElementById("addNewMasai");    
        popup.style.display = "block";

        addNewMasaiSubmit.addEventListener("click", async () => {
            const name = document.querySelector("#name").value;
            const email = document.querySelector("#email").value;
            const job = document.querySelector("#job").value;

            if (name != null && email != null) {
                const response = await fetch(`${APIEndpoint}/users/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ name, email, job })
                });
            
                if (response.ok) {
                    const popup = document.getElementById("addNewMasai");    
                    popup.style.display = "none";
                    await loadUsersData();
                } else {
                    console.error('Error al crear el nuevo masai:', response.error);
                }
            }
        });


    });    
}

async function loadUsersData() {
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
                const deleteUser = document.createElement("span");
                deleteUser.innerText = "❌";
                deleteUser.className = "deleteUser"
                deleteUser.addEventListener('click', async () => handleDeleteMasai(user.name, user._id));

                const spanTeam = document.createElement("span");
                spanTeam.className = "userTeam"
                spanTeam.innerText = getTeamName(teams, user.team) || "Sin grupo";
                spanTeam.addEventListener('click', () => mostrarPopup(user._id));
                
                li.appendChild(spanTeam);
                li.appendChild(deleteUser);
                masailistElement.appendChild(li);

            });
        }
    } catch (error) {
        console.error('Error al cargar los resultados de votaciones:', error);
    }
}

async function handleDeleteMasai(masaiName, masaiId) {

    const confirmation = confirm(`¿Quieres que al masai <${masaiName}> se lo coma el león?`);

    if (confirmation) {
        const deleteResponse = await fetch(`${APIEndpoint}/users/${masaiId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        }); 
    
        if (deleteResponse.ok) {
            await loadUsersData();
        }
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

function mostrarPopup(user) {
    var teamSelectList = document.querySelector("#teamSelectList");
    teamSelectList.attributes["userId"] = user;
    var popup = document.getElementById("teamPopup");    
    popup.style.display = "block";
}

function cerrarPopup(popupName) {
    var popup = document.querySelector(`#${popupName}`);
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
        await loadUsersData();
        cerrarPopup("teamPopup");
    } else {
        console.error('Error al actualizar al usuario:', response.error);
    }

}