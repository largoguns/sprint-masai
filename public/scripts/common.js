
var APIEndpoint = "";
var votingLimitHandler;

function getBackendAddress() {
    return window.location.origin + "/api";
    // Hacer una solicitud para obtener la configuración del endpoint
    // return fetch('/endpoint.config')
    // .then(response => response.json())
    // .then(data => {
    //     // Configurar una variable global con la URL del endpoint
    //     return `${data.endpoint}/api`;
    // })
    // .catch(error => {
    //     console.error('Error:', error);
    //     return null;
    // });
}

async function getHeader() {
    APIEndpoint = getBackendAddress();
    if (window.location.href.split("/").pop().indexOf("Report") == -1) {
        const user = JSON.parse(localStorage.getItem('MasaisData'));
        
        if (user.role == "ADMIN") {
            await getAdminHeader();
        } else {
            await getUserHeader();
        }

        await getVotingPeriodStatus();

        await privacityButton();
        await logoutButton();
        await welcomeUser();
    }
    
}

async function privacityButton() {
    const userData = JSON.parse(localStorage.getItem('MasaisData'));
    if (document.getElementById('privacity') != null) {
        if (userData.privateVote != null) {
            if (userData.privateVote == true) {
                document.querySelector("#privacity").textContent = "🔏 Voto privado";
            } else {
                document.querySelector("#privacity").textContent = "👁️ Voto público";
            }
        } else {
            document.querySelector("#privacity").textContent = "👁️ Voto público";
        }

        document.getElementById('privacity').addEventListener('click', function() {
            togglePrivacity();
        }); 
    }
   
}

async function getAdminHeader() {

    const header = document.querySelector("#header");

    return fetch('header.html')
    .then(response => {
        if (!response.ok) {
            throw new Error('Error al cargar la cabecera');
        }
        return response.text();
    })
    .then(data => {
        header.innerHTML = data;
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

async function getUserHeader() {
    const header = document.querySelector("#header");

    return fetch('userheader.html')
    .then(response => {
        if (!response.ok) {
            throw new Error('Error al cargar la cabecera');
        }
        return response.text();
    })
    .then(data => {
        header.innerHTML = data;
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function logout() {
    localStorage.removeItem('MasaisData');
    window.location.href = 'index.html';
}

async function logoutButton() {
    document.getElementById('logoutButton').addEventListener('click', function() {
        logout();
    });    
}

async function togglePrivacity() {
    const userData = JSON.parse(localStorage.getItem('MasaisData'));

    if (userData.privateVote != null) {
        if (userData.privateVote == true) {
            userData.privateVote = false;
        } else {
            userData.privateVote = true;
        }
    } else {
        userData.privateVote = true;
    }

    const response = await fetch(`${APIEndpoint}/users/${userData._id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
    });

    if (response.ok) {
        localStorage.setItem('MasaisData', JSON.stringify(userData));
        location.reload();
    } else {
        console.error('Error al crear el nuevo masai:', response.error);
    }
}

async function welcomeUser() {
    const user = JSON.parse(localStorage.getItem('MasaisData'));
    document.getElementById('loggedInUsername').textContent = user.name;
}

async function getVotingPeriodStatus() {
    const response = await fetch(`${APIEndpoint}/config/`);
    const configData = await response.json();

    if (configData.votingStatus == "open") {                
        votingLimitHandler = setInterval(function() {
            getRemainigDateTime(configData.votingLimit);
        }, 1000);        
    } else {
        if (document.getElementById('privacity') != null) {
            document.getElementById('privacity').classList.add("hidden");
        }
    }

}


function getRemainigDateTime(votingLimitDateTime) {
    const votingLimitDateTimeDateObject = new Date(votingLimitDateTime);

    const currentDate = new Date();

    if (votingLimitDateTimeDateObject <= currentDate) {
        document.getElementById('votingPeriodStatus').classList.remove("heartbeat");
        document.getElementById('votingPeriodStatus').innerHTML = "PERIODO DE VOTACIÓN FINALIZADO 🎉";
        clearInterval(votingLimitHandler);
    } else {

        const difference = votingLimitDateTimeDateObject - currentDate;

        const dias = Math.floor(difference / (1000 * 60 * 60 * 24));
        const horas = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutos = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const segundos = Math.floor((difference % (1000 * 60)) / 1000);
    
        let timeRemaining = "Fin del periodo de votación en ";
    
        if (dias > 0) {
            timeRemaining = `${timeRemaining} ${dias} ${(dias > 1 ? "días" : "día")}`;
        }
    
        if (horas > 0) {
            timeRemaining = `${timeRemaining} ${horas} ${(horas > 1 ? "horas" : "hora")}`;
        }
    
        if (minutos > 0) {
            timeRemaining = `${timeRemaining} ${minutos} ${(minutos > 1 ? "minutos" : "minuto")}`;
        }
    
        if (segundos > 0) {
            timeRemaining = `${timeRemaining} ${segundos} ${(segundos > 1 ? "segundos" : "segundo")}`;
        }

        if (dias == 0 && horas == 0 && minutos == 0 && segundos < 15) {
            document.getElementById('votingPeriodStatus').classList.add("heartbeat");
        }
    
        document.getElementById('votingPeriodStatus').innerHTML = timeRemaining;
    }

  }

  function pdfReport() {
    window.open("votesReport.html", "_blank");
  }
