let createupdateClickHandler;

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
    flatpickr("#birthday", {
        dateFormat: "d/m",
        shorthand: true,
        altInput: true,
        altFormat: "d/m",
        "locale": {
            "firstDayOfWeek": 1
        }
    });

    await getHeader();
    await loadTeamsData();
    addNewMasaiHandler();
});

async function createMasai() {
    const name = document.querySelector("#name").value;
    const email = document.querySelector("#email").value;
    const job = document.querySelector("#job").value;
    const team = document.querySelector("#teamList").value;
    const birthday = document.querySelector("#birthday").value;

    if (name != null && email != null) {
        const response = await fetch(`${APIEndpoint}/users/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, job, team, birthday})
        });
    
        if (response.ok) {
            cerrarPopup("addNewMasai");
            await loadTeamsData();
        } else {
            console.error('Error al crear el nuevo masai:', response.error);
        }
    }
}

function addNewMasaiHandler() {
    const addNew = document.getElementById('addNew');

    addNew.addEventListener('click', async () => {
        document.querySelector("#newMasaiH3").innerText = "Nuevo Masai";
        document.querySelector("#_id").value = "";
        document.querySelector("#name").value = "";
        document.querySelector("#email").value = "";
        document.querySelector("#job").value = "";
        document.querySelector("#teamList").value = "";
        document.querySelector("#birthday").value = "";
    
        addNewMasaiSubmit.innerText = "Crear nuevo Masái";

        const popup = document.getElementById("addNewMasai");    
        popup.style.display = "block";
                
        addNewMasaiSubmit.addEventListener("click", createMasai);
    });    
}

async function editMasai() {
    const id = document.querySelector("#_id").value;
    const name = document.querySelector("#name").value;
    const email = document.querySelector("#email").value;
    const job = document.querySelector("#job").value;
    const team = document.querySelector("#teamList").value;
    const birthday = document.querySelector("#birthday").value;

    if (name != null && email != null) {
        const userData = {name, email, job, team, birthday};
        const response = await fetch(`${APIEndpoint}/users/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });
    
        if (response.ok) {
            cerrarPopup("addNewMasai");
            await loadTeamsData();
        } else {
            console.error('Error al crear el nuevo masai:', response.error);
        }
    }
}

function handleEditMasai(user) {
    const popup = document.getElementById("addNewMasai");    
    document.querySelector("#newMasaiH3").innerText = "Modificar datos de Masái";
    document.querySelector("#_id").value = user._id;
    document.querySelector("#name").value = user.name;
    document.querySelector("#email").value = user.email;
    document.querySelector("#job").value = user.job;
    document.querySelector("#teamList").value = user.team;
    document.querySelector("#birthday").value = user.birthday;
    document.querySelector(".form-control.input").value = (user.birthday == undefined ? "" : user.birthday);

    popup.style.display = "block";

    addNewMasaiSubmit.innerText = "Modificar datos de Masái";
        
    addNewMasaiSubmit.addEventListener("click", editMasai);
}

async function loadTeamsData() {
    sessionStorage.setItem("scrollPosition", window.scrollY);

    APIEndpoint = await getBackendAddress();

    const teamsReponse = await fetch(`${APIEndpoint}/teams/`);
    const teams = await teamsReponse.json();

    
    const teamList = document.querySelector("#teamList");
    teamList.innerHTML = "";

    teams.forEach(team => {
        const teamOption = document.createElement("option");
        teamOption.value = team._id
        teamOption.text = team.name;
        
        teamList.appendChild(teamOption);
    });


    // const teamSelectList = document.querySelector("#teamSelectList");
    // teamSelectList.innerHTML = "";

    // teams.forEach(team => {
    //     const teamOption = document.createElement("li");
    //     teamOption.attributes["teamId"] = team._id
    //     teamOption.innerText = team.name;
    //     teamOption.addEventListener('click', (team) => 
    //         setUserTeam(team.target.attributes["teamId"])
    //     );
        
    //     teamSelectList.appendChild(teamOption);
    // });

    const masailistElement = document.getElementById('masailist');
    masailistElement.innerHTML = "";

    try {

        const usersResponse = await fetch(`${APIEndpoint}/users/`);
        const users = await usersResponse.json();

        if (usersResponse.ok) {
            users.forEach(user => {
                const tr = document.createElement('tr');
                const td1 = document.createElement('td');

                const deleteUser = document.createElement("span");
                deleteUser.innerText = "❌";
                deleteUser.className = "deleteUser"
                deleteUser.addEventListener('click', async () => handleDeleteMasai(user.name, user._id));

                const editUser = document.createElement("span");
                editUser.innerText = "✏️";
                editUser.className = "deleteUser"
                editUser.addEventListener('click', async () => handleEditMasai(user));

                td1.appendChild(deleteUser);
                td1.appendChild(editUser);

                const td2 = document.createElement('td');
                td2.innerText = user.name;


                const td3 = document.createElement('td');
                

                const spanTeam = document.createElement("span");
                spanTeam.className = "userTeam"
                spanTeam.innerText = getTeamName(teams, user.team) || "Sin grupo";
                td3.appendChild(spanTeam);

                tr.appendChild(td1);
                tr.appendChild(td2);
                tr.appendChild(td3);

                masailistElement.appendChild(tr);

                
                // const li = document.createElement('li');
                // li.textContent = `${user.name}`;
                // const deleteUser = document.createElement("span");
                // deleteUser.innerText = "❌";
                // deleteUser.className = "deleteUser"
                // deleteUser.addEventListener('click', async () => handleDeleteMasai(user.name, user._id));

                // const spanTeam = document.createElement("span");
                // spanTeam.className = "userTeam"
                // spanTeam.innerText = getTeamName(teams, user.team) || "Sin grupo";
                // spanTeam.addEventListener('click', () => mostrarPopup(user._id));
                
                // li.appendChild(spanTeam);
                // li.appendChild(deleteUser);
                // masailistElement.appendChild(li);

            });
        }
    } catch (error) {
        console.error('Error al cargar los resultados de votaciones:', error);
    }

    if (sessionStorage.getItem("scrollPosition")) {
        window.scrollTo(0, sessionStorage.getItem("scrollPosition"));
        sessionStorage.removeItem("scrollPosition");
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
            await loadTeamsData();
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
    addNewMasaiSubmit.removeEventListener("click", editMasai);
    addNewMasaiSubmit.removeEventListener("click", createMasai);
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
        await loadTeamsData();
        cerrarPopup("teamPopup");        
    } else {
        console.error('Error al actualizar al usuario:', response.error);
    }

}