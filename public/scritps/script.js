async function fetchUserList() {
    try {
        const response = await fetch(`${APIEndpoint}/users/`);
        const userList = await response.json();

        if (response.ok) {
            return userList;
        } else {
            console.error('Error al cargar la lista de usuarios:', userList.error);
            return [];
        }
    } catch (error) {
        console.error('Error al cargar la lista de usuarios:', error);
        return [];
    }
}

// Función para obtener la lista de votos del usuario actual
async function fetchUserVotes(userId) {
    try {
        const response = await fetch(`${APIEndpoint}/votes/voter/${userId}`);
        const userVotes = await response.json();

        if (response.ok) {
            return userVotes;
        } else {
            console.error('Error al cargar los votos del usuario:', userVotes.error);
            return [];
        }
    } catch (error) {
        console.error('Error al cargar los votos del usuario:', error);
        return [];
    }
}

async function buildUserList() {
    try {
        const userList = await fetchUserList();
        const user = JSON.parse(localStorage.getItem('MasaisData'));
        const userVotes = await fetchUserVotes(user.name);

        // Crear un mapa de votos por nombre de usuario para facilitar la búsqueda
        const userVotesMap = {};
        userVotes.forEach(vote => {
            const targetUser = userList.find(user => user.name === vote.targetUserId);
            if (targetUser) {
                userVotesMap[targetUser.name] = vote._id;
            }
        });

        // Construir la lista de usuarios con información sobre si han sido votados
        const userListWithVotes = userList.map(user => {
           
            return {
                ...user,
                voteId: userVotesMap[user.name] || null
            };
        });

        return userListWithVotes;
    } catch (error) {
        console.error('Error al construir la lista de usuarios:', error);
        return [];
    }
}


document.addEventListener('DOMContentLoaded', async () => {
    APIEndpoint = await getBackendAddress();
    
    const user = JSON.parse(localStorage.getItem('MasaisData'));
    if (user) {
        const userList = await buildUserList();
        await displayUserList(userList);
        document.getElementById('mainContent').style.display = 'block';
        
        await getHeader();        
        loadComments();
    
    } else {
        document.getElementById('loginContainer').style.display = 'block';
    }

    document.querySelector("#voteForUser").addEventListener("click", async () => {
        var votingUser = document.querySelector("#votingUser").innerText;
        var votingComment = document.querySelector("#votingComment").options[document.querySelector("#votingComment").selectedIndex].textContent;
        document.querySelector("#votingComment").selectedIndex = 0;

        await voteForUser(votingUser, votingComment);
    });
});

// Función para mostrar la lista de usuarios en la tabla
async function displayUserList(users) {
    const userListElement = document.getElementById('userList');
    userListElement.innerHTML = ''; // Limpiar la lista existente

    const teamsReponse = await fetch(`${APIEndpoint}/teams/`);
    const teams = await teamsReponse.json();

    users.forEach(user => {
        const row = document.createElement('tr');

        const iconCell = document.createElement('td');
        iconCell.textContent = getTeamName(teams, user.team);
        row.appendChild(iconCell);        

        const jobCell = document.createElement('td');
        jobCell.textContent = getJobEmoji(user.job) + " " + capitalize(user.job);
        row.appendChild(jobCell);        
        const nameCell = document.createElement('td');
        nameCell.textContent = capitalize(user.name);
        row.appendChild(nameCell);

        const actionCell = document.createElement('td');
        const actionButton = document.createElement('button');
        actionButton.textContent = user.voteId ? '🚫' : '👍';
        actionButton.addEventListener('click', async function() {
            // Lógica para votar o eliminar voto
            try {
                if (user.voteId) {
                    deleteVote(user.voteId);
                } else {                    
                    document.querySelector("#votingUser").innerText = user.name;
                    document.querySelector("#voteDialog").showModal();
                }
            } catch (error) {
                console.error('Error al votar o eliminar voto:', error);
            }
        });
        actionCell.appendChild(actionButton);
        row.appendChild(actionCell);

        userListElement.appendChild(row);
    });
}

function getTeamName(teams, id) {
    const foundTeam = teams.find((team) => team._id == id);
    if (foundTeam != null) {
        return foundTeam.name;
    } else {
        return "Sin grupo";
    }
}

function getJobEmoji(job) {
    switch (job) {
        case "BUSINESS ANALYST":
            return "📊";
        case "DEVELOPER":
            return "💻";
        case "TESTER":
            return "🕵️‍♂️";
        case "DIRECTOR/A DE DESARROLLO":
            return "💼💻";
        case "DIRECTOR/A DE MARKETING DE PRODUCTO":
            return "💼📈";
        case "DIRECTOR/A GENERAL":
            return "💼";
        case "PRODUCT OWNER":
            return "🧠";
        case "PROJECT MANAGER":
            return "📅";
        case "SCRUM MASTER":
            return "🔄";
        case "SOFTWARE ARCHITECT":
            return "🏗️";
        case "UX DESIGNER":
            return "🎨";
        case "QA MANAGER":
            return "👨‍💼🕵️‍♂️";            
        default:
            break;
    }
}

document.getElementById('loginForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    //const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;

    try {
        // Verificar si el usuario existe
        const userResponse = await fetch(`${APIEndpoint}/users/login/${email}`);
        const userData = await userResponse.json();

        if (userResponse.ok && userData.length > 0 && userData[0].email === email) {
            // Guardar el usuario en el localStorage
            localStorage.setItem('MasaisData', JSON.stringify(userData[0]));
            //alert('Inicio de sesión exitoso');
            // Redirigir a la página principal o realizar otras acciones
            window.location.href = 'index.html'; // Redirecciona a la página de inicio de sesión
        } else {
            alert('Usuario o email incorrectos');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al iniciar sesión');
    }    
});

// Función para votar por un usuario
async function voteForUser(targetUserId, comment) {
    try {
        const user = JSON.parse(localStorage.getItem('MasaisData'));
        const voterId = user.name;

        const response = await fetch(`${APIEndpoint}/votes/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ voterId, targetUserId, comment })
        });

        if (response.ok) {
            //alert('Votación exitosa');
            // Actualizar la lista de usuarios después de votar
            const updatedUserList = await buildUserList();
            displayUserList(updatedUserList);
        } else {
            const responseBody = await response.json();

            if (response.status != 404) {
                alert(responseBody.error);
            }

            console.error('Error al votar:', response.error);
        }
    } catch (error) {
        console.error('Error al votar:', error);
    }
}

// Función para eliminar el voto por un usuario
async function deleteVote(voteId) {
    try {
        const response = await fetch(`${APIEndpoint}/votes/${voteId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            //alert('Voto eliminado exitosamente');
            // Actualizar la lista de usuarios después de eliminar el voto
            const updatedUserList = await buildUserList();
            displayUserList(updatedUserList);
        } else {
            console.error('Error al eliminar el voto:', response.error);
        }
    } catch (error) {
        console.error('Error al eliminar el voto:', error);
    }
}

async function loadComments() {
    try {
        const response = await fetch(`${APIEndpoint}/comments/`);
        const commentList = await response.json();

        if (response.ok) {
            const commentListContainer = document.querySelector("#votingComment");

            commentList.forEach(comment => {
                const option = document.createElement("option");
                option.value = comment.comment;
                option.innerText = comment.comment;
                
                commentListContainer.appendChild(option);
            });
        } else {
            console.error('Error al cargar la lista de usuarios:', commentList.error);
            return [];
        }        
    } catch (error) {
        console.error('Error obteniendo comentarios:', error);
    }
}

function capitalize(text) {
    let words = text.toLowerCase().split(" ");

    for (let i = 0; i < words.length; i++) {
        if (isNoCapitalizableWord(words[i])) {
            words[i] = words[i].charAt(0).toUpperCase() + words[i].slice(1);
        }
    }

    return words.join(" ");
}

function isNoCapitalizableWord(word) {
    const words = ["de", "del"];

    return !words.includes(word);
}