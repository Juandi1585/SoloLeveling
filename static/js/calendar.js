// 📌 calendar.js - Carga eventos del calendario

export async function loadCalendarEvents() {
    const calendarContent = document.getElementById('calendar-content');

    try {
        const response = await fetch('http://127.0.0.1:8080/events');
        if (!response.ok) throw new Error('No se pudieron obtener los eventos');

        const data = await response.json();
        console.log("📅 Eventos recibidos:", data);

        calendarContent.innerHTML = '';

        if (data.length > 0) {
            let todayEvents = "<h2>📅 Eventos para Hoy:</h2>";
            let tomorrowEvents = "<h2>📅 Eventos para Mañana:</h2>";

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);

            data.forEach(event => {
                let startTime = new Date(event.start.dateTime);
                let endTime = new Date(event.end.dateTime);
                let formattedStart = startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                let formattedEnd = endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                let eventDuration = ((endTime - startTime) / 3600000).toFixed(1);

                let eventHTML = `<div class="event">
                    <h3>${event.summary}</h3>
                    <p>🕒 ${formattedStart} - ${formattedEnd} (${eventDuration}h)</p>
                    <p>📍 ${event.location || "Ubicación no especificada"}</p>
                    <p>📜 ${event.description || "Sin descripción"}</p>
                </div>`;

                if (startTime.toDateString() === today.toDateString()) {
                    todayEvents += eventHTML;
                } else if (startTime.toDateString() === tomorrow.toDateString()) {
                    tomorrowEvents += eventHTML;
                }
            });

            calendarContent.innerHTML += todayEvents !== "<h2>📅 Eventos para Hoy:</h2>" ? todayEvents : "<p>No hay eventos programados para hoy.</p>";
            calendarContent.innerHTML += tomorrowEvents !== "<h2>📅 Eventos para Mañana:</h2>" ? tomorrowEvents : "<p>No hay eventos programados para mañana.</p>";
        } else {
            calendarContent.innerHTML = "<p>No hay eventos programados.</p>";
        }
    } catch (error) {
        console.error("❌ Error al obtener eventos:", error);
        calendarContent.innerHTML = "<p style='color: red;'>❌ No se pudieron cargar los eventos.</p>";
    }
}
