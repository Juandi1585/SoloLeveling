// 📌 strava.js - Carga las últimas actividades de Strava
// Versión: ${new Date().toISOString()}
export async function loadStravaActivities() {
    console.log('⚡ INICIO: Carga de actividades Strava - Nueva versión sin límite de tiempo');
    
    const stravaContent = document.getElementById('strava-content');
    if (!stravaContent) {
        console.error('❌ ERROR: Elemento strava-content no encontrado');
        return;
    }

    stravaContent.innerHTML = '<h2>🏃 Actividades</h2><p>Cargando datos...</p>';

    try {
        console.log('🚀 Solicitando datos a Strava API...');
        const response = await fetch('http://localhost:8080/strava/activities');
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const activities = await response.json();
        console.log(`📊 Recibidas ${activities.length} actividades`);

        if (!activities || activities.length === 0) {
            stravaContent.innerHTML = '<h2>🏃 Actividades</h2><p>No hay actividades disponibles.</p>';
            return;
        }

        // Ordenar actividades por fecha (más recientes primero)
        activities.sort((a, b) => new Date(b.start_date) - new Date(a.start_date));

        stravaContent.innerHTML = `<h2>🏃 Actividades Totales (${activities.length})</h2>`;
        
        activities.forEach((activity) => {
            const date = new Date(activity.start_date).toLocaleString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            // Añadimos un console.log para debug
            console.log('🎯 Renderizando actividad:', activity.name);

            const activityHTML = `
                <div class="activity">
                    <h3>TEST - ${activity.name} • ${activity.average_temp ? activity.average_temp.toFixed(1) : 'N/A'}°C</h3>
                    <div class="activity-details">
                        <div class="activity-detail">
                            <span class="label">📅 Fecha:</span>
                            <span class="value">${date}</span>
                        </div>
                        <div class="activity-detail">
                            <span class="label">📏 Distancia:</span>
                            <span class="value">${(activity.distance / 1000).toFixed(2)} km</span>
                        </div>
                        <div class="activity-detail">
                            <span class="label">⏱️ Tiempo:</span>
                            <span class="value">${Math.floor(activity.moving_time / 60)} min</span>
                        </div>
                        <div class="activity-detail">
                            <span class="label">🏃 Velocidad:</span>
                            <span class="value">${(activity.average_speed * 3.6).toFixed(2)} km/h</span>
                        </div>
                        ${activity.average_heartrate ? `
                        <div class="activity-detail">
                            <span class="label">💗 Pulsaciones:</span>
                            <span class="value">${Math.round(activity.average_heartrate)} ppm</span>
                        </div>
                        ` : ''}
                        ${activity.total_elevation_gain ? `
                        <div class="activity-detail">
                            <span class="label">⬆️ Desnivel:</span>
                            <span class="value">${Math.round(activity.total_elevation_gain)} m</span>
                        </div>
                        ` : ''}
                        ${activity.total_elevation_loss ? `
                        <div class="activity-detail">
                            <span class="label">⬇️ Desnivel:</span>
                            <span class="value">${Math.round(activity.total_elevation_loss)} m</span>
                        </div>
                        ` : ''}
                        ${activity.achievement_count ? `
                        <div class="activity-detail achievements">
                            <span class="label">🏆 Logros:</span>
                            <span class="value">${activity.achievement_count}</span>
                        </div>
                        ` : ''}
                    </div>
                </div>
            `;
            stravaContent.innerHTML += activityHTML;
        });

        console.log('✅ Datos mostrados correctamente');

    } catch (error) {
        console.error('❌ Error detallado:', error);
        stravaContent.innerHTML = `
            <h2>🏃 Actividades</h2>
            <p class="error">Error al cargar las actividades: ${error.message}</p>
        `;
    }
}

// function initializeMap(activity) {
//     const mapContainer = document.getElementById(`map-${activity.id}`);
//     if (!mapContainer) return;

//     const map = new google.maps.Map(mapContainer, {
//         zoom: 12,
//         center: { lat: activity.start_latlng[0], lng: activity.start_latlng[1] },
//         mapTypeId: 'terrain'
//     });

//     const activityPath = new google.maps.Polyline({
//         path: activity.map.summary_polyline,
//         geodesic: true,
//         strokeColor: '#FF0000',
//         strokeOpacity: 1.0,
//         strokeWeight: 2
//     });

//     activityPath.setMap(map);
// }
