// 📌 main.js - Carga todos los módulos al iniciar la web

// Importar los módulos
import { loadCalendarEvents } from './calendar.js';
import { loadHeroData } from './hero.js';
import { loadStravaActivities } from './strava.js';
import { initializeChatbot } from './chatbot.js';

// 📌 Cargar todas las secciones cuando la web se carga
document.addEventListener('DOMContentLoaded', async () => {
    await loadCalendarEvents();  // Cargar eventos del calendario 📅
    await loadHeroData();  // Cargar datos del héroe desde Google Drive 📜
    await loadStravaActivities(); // Cargar actividades de Strava 🏃
    initializeChatbot(); // Iniciar chatbot 🤖
});
