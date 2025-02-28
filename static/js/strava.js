// 📌 strava.js - Carga las últimas actividades de Strava

export async function loadStravaActivities() {
    const stravaContent = document.getElementById('strava-content');
    if (!stravaContent) return;

    try {
        const response = await fetch('http://localhost:8080/strava/activities');
        if (!response.ok) throw new Error('Error al cargar actividades');

        const activities = await response.json();
        
        // Limpiar contenido anterior
        stravaContent.innerHTML = '<h2>🏃 Actividades Recientes</h2>';

        if (activities.length === 0) {
            stravaContent.innerHTML += '<p>No hay actividades recientes.</p>';
            return;
        }

        activities.forEach(activity => {
            const date = new Date(activity.start_date).toLocaleDateString();
            const distance = (activity.distance / 1000).toFixed(2);
            const duration = Math.floor(activity.moving_time / 60);

            const activityHTML = `
                <div class="activity">
                    <h3>${activity.name}</h3>
                    <p>📅 ${date}</p>
                    <p>📏 ${distance} km</p>
                    <p>⏱️ ${duration} minutos</p>
                </div>
            `;
            stravaContent.innerHTML += activityHTML;
        });

    } catch (error) {
        console.error('Error al cargar actividades:', error);
        stravaContent.innerHTML = '<p class="error">❌ Error al cargar las actividades</p>';
    }
}
