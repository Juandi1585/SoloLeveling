// 📌 calendar.js - Carga eventos del calendario

export async function loadCalendarEvents() {
    console.log('⚡ INICIO: Carga de eventos del calendario');
    
    // Verificar que estamos en la sección correcta
    if (!document.getElementById('stats-section').classList.contains('active')) {
        console.log('📊 Sección de estadísticas no activa, esperando...');
        return;
    }

    const calendarContent = document.getElementById('calendar-content');
    if (!calendarContent) {
        console.error('❌ ERROR: Elemento calendar-content no encontrado en el DOM');
        return;
    }

    calendarContent.innerHTML = '<h2>📅 Eventos del Calendario</h2><p>Cargando eventos...</p>';

    try {
        console.log('🚀 Realizando petición a Calendar API...');
        const response = await fetch('http://localhost:8080/events');
        console.log('📡 Estado de la respuesta:', response.status);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const events = await response.json();
        console.log('📦 Eventos recibidos:', events);

        if (!events || events.length === 0) {
            calendarContent.innerHTML = '<h2>📅 Eventos del Calendario</h2><p>No hay eventos próximos.</p>';
            return;
        }

        let eventsHTML = '<h2>📅 Eventos del Calendario</h2>';
        events.forEach(event => {
            const start = new Date(event.start.dateTime || event.start.date);
            eventsHTML += `
                <div class="event">
                    <h3>${event.summary}</h3>
                    <p>📅 ${start.toLocaleString()}</p>
                    ${event.description ? `<p>${event.description}</p>` : ''}
                </div>
            `;
        });

        calendarContent.innerHTML = eventsHTML;
        console.log('✅ Eventos del calendario mostrados correctamente');

    } catch (error) {
        console.error('❌ Error cargando eventos:', error);
        calendarContent.innerHTML = `
            <h2>📅 Eventos del Calendario</h2>
            <p class="error">Error al cargar los eventos: ${error.message}</p>
        `;
    }
}

// Eliminar cualquier otro event listener que pudiera existir
