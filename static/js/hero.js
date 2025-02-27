// 📌 hero.js - Carga datos del héroe desde un archivo Excel en Google Drive

export async function loadHeroData() {
    const fileInfo = document.getElementById("file-info");
    fileInfo.innerHTML = "Cargando datos...";

    try {
        const response = await fetch("http://localhost:8080/load_excel");
        if (!response.ok) throw new Error("Error al obtener el archivo");

        const data = await response.json();
        if (data.error) {
            fileInfo.innerHTML = `<p class='error'>${data.error}</p>`;
            return;
        }

        let formattedData = `<h2>📜 Información del Héroe</h2><table class='hero-table'>`;
        Object.entries(data).forEach(([key, value]) => {
            formattedData += `<tr><td><strong>${key}:</strong></td><td>${value}</td></tr>`;
        });
        formattedData += "</table>";

        fileInfo.innerHTML = formattedData;
    } catch (error) {
        fileInfo.innerHTML = `<p class='error'>Error al cargar el archivo: ${error.message}</p>`;
    }
}
