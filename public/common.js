async function getBackendAddress() {
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