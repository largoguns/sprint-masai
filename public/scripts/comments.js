var APIEndpoint = "";

document.addEventListener('DOMContentLoaded', async () => {
    getHeader();
    const addNew = document.getElementById('addNew');

    addNew.addEventListener('click', async () => {
        const value = prompt('Indica el nuevo comentario');
        if (value != null) {
            const response = await fetch(`${APIEndpoint}/comments/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ comment: value })
            });
        
            if (response.ok) {
                await loadCommentsData();
            } else {
                console.error('Error al crear el comentario:', response.error);
            }
        }
    });

    await loadCommentsData();
});

async function loadCommentsData() {
    sessionStorage.setItem("scrollPosition", window.scrollY);
    APIEndpoint = await getBackendAddress();

    const commentsList = document.getElementById('commentsList');
    commentsList.innerHTML = "";

    try {

        const commentsResponse = await fetch(`${APIEndpoint}/comments/`);
        const comments = await commentsResponse.json();

        if (commentsResponse.ok) {
            comments.forEach(comment => {
                const li = document.createElement('li');
                li.textContent = `${comment.comment}`;

                const actionButton = document.createElement('span');
                actionButton.textContent = '🚫';
                actionButton.className = "deleteComment";

                actionButton.addEventListener('click', async function() {
                    deleteComment(comment);
                });                

                li.appendChild(actionButton);
                
                commentsList.appendChild(li);

            });
        }
    } catch (error) {
        console.error('Error al cargar los equipos:', error);
    }

    if (sessionStorage.getItem("scrollPosition")) {
        window.scrollTo(0, sessionStorage.getItem("scrollPosition"));
        sessionStorage.removeItem("scrollPosition");
    }
}

async function deleteComment(commentId) {

    const confirmation = confirm('Eliminiar un comentario lo eliminará también de las votaciones, ¿deséa continuar?');

    if (confirmation) {
        try {
            const responseDeleteUsersTeam = await fetch(`${APIEndpoint}/votes/comment/${commentId.comment}`, {
                method: 'DELETE'
            });

            const responseDeleteTeam = await fetch(`${APIEndpoint}/comments/${commentId._id}`, {
                method: 'DELETE'
            });

            if (responseDeleteTeam.ok && responseDeleteUsersTeam.ok) {
                await loadCommentsData();
            } else {
                console.error('Error:', response.error, responseDeleteUsersTeam.error);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }
}