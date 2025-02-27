// 📌 strava.js - Carga las últimas actividades de Strava

export async function loadStravaActivities() {
    const stravaContent = document.getElementById('strava-content');

    try {
        const response = await fetch('http://127.0.0.1:8080/strava/activities');
        if (!response.ok) throw new Error('No se pudieron obtener las actividades');

        const data = await response.json();
        console.log("🏃 Actividades de Strava recibidas:", data);

        stravaContent.innerHTML = "<h2>🏃 Últimas Actividades de Strava</h2>";

        if (data.length > 0) {
            data.forEach(activity => {
                let activityHTML = `<div class="activity">
                    <h3>${activity.name}</h3>
                    <p>📅 Fecha: ${new Date(activity.start_date).toLocaleDateString()}</p>
                    <p>🕒 Duración: ${Math.round(activity.moving_time / 60)} min</p>
                    <p>📏 Distancia: ${(activity.distance / 1000).toFixed(2)} km</p>
                </div>`;
                stravaContent.innerHTML += activityHTML;
            });
        } else {
            stravaContent.innerHTML += "<p>No hay actividades recientes.</p>";
        }
    } catch (error) {
        console.error("❌ Error al obtener datos de Strava:", error);
        stravaContent.innerHTML = "<p style='color: red;'>❌ No se pudieron cargar las actividades.</p>";
    }
}
