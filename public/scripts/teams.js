document.addEventListener('DOMContentLoaded', async () => {
    await getHeader();
    const addNewTeam = document.getElementById('addNewTeam');

    addNewTeam.addEventListener('click', async () => {
        const value = prompt('Indica el nombre del nuevo equipo');
        if (value != null) {
            const response = await fetch(`${APIEndpoint}/teams/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name: value })
            });
        
            if (response.ok) {
                await loadUsersData();
                cerrarPopup();
            } else {
                console.error('Error al crear el equipo:', response.error);
            }
        }
    });

    await loadUsersData();
});

async function loadUsersData() {
    APIEndpoint = await getBackendAddress();

    const teamList = document.getElementById('teamList');
    teamList.innerHTML = "";

    try {

        const teamsReponse = await fetch(`${APIEndpoint}/teams/`);
        const teams = await teamsReponse.json();

        if (teamsReponse.ok) {
            teams.forEach(team => {
                const li = document.createElement('li');
                li.textContent = `${team.name}`;

                const actionButton = document.createElement('span');
                actionButton.textContent = '🚫';
                actionButton.className = "deleteTeam";

                actionButton.addEventListener('click', async function() {
                    deleteComment(team._id);
                });                

                li.appendChild(actionButton);
                
                teamList.appendChild(li);

            });
        }
    } catch (error) {
        console.error('Error al cargar los equipos:', error);
    }
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

    console.log(`Valor seleccionado para el ${userId} es ${valor}`);

    const response = await fetch(`${APIEndpoint}/users/${userId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ team: valor })
    });

    if (response.ok) {
        await loadUsersData();
        cerrarPopup();
    } else {
        console.error('Error al actualizar al usuario:', response.error);
    }

}

async function deleteComment(teamId) {

    const confirmation = confirm('Eliminar un grupo eliminará la asignación de dicho grupo a sus usuarios. Tendrá que volver a asociar los usuarios a un grupo. ¿Quieres continuar?');

    if (confirmation) {
        try {
            const responseDeleteUsersTeam = await fetch(`${APIEndpoint}/users/team/${teamId}`, {
                method: 'DELETE'
            });

            const responseDeleteTeam = await fetch(`${APIEndpoint}/teams/${teamId}`, {
                method: 'DELETE'
            });

            if (responseDeleteTeam.ok && responseDeleteUsersTeam.ok) {
                await loadUsersData();
            } else {
                console.error('Error:', response.error, responseDeleteUsersTeam.error);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }
}