// 📌 main.js - Carga todos los módulos al iniciar la web

// Importar los módulos
import { loadCalendarEvents } from './calendar.js';
import { loadHeroData } from './hero.js';
import { loadStravaActivities } from './strava.js';  // Volver al nombre original
import { initializeChatbot } from './chatbot.js';
import { initializeDungeon3D } from './dungeon3d.js';
//import { initializeDungeon } from './dungeon.js';

function showSection(sectionId) {
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => section.classList.remove('active'));
    const activeSection = document.getElementById(sectionId);
    activeSection.classList.add('active');

    // Recargar datos si es la sección de estadísticas
    if (sectionId === 'stats-section') {
        console.log('🔄 Recargando datos de estadísticas...');
        loadCalendarEvents();
        loadStravaActivities();
    }
}

// Variable para rastrear el progreso de la carga
let loadDataPromises = [];

// Función para reproducir el video de carga sin esperar a que termine
function setupLoadingVideo() {
    const video = document.getElementById('loading-video');
    video.src = '/static/videos/loading_scene_largo.mp4';
    video.removeAttribute('loop'); // Evitar que se repita

    // Cuando el video esté listo para reproducirse, iniciarlo
    video.addEventListener('canplaythrough', () => {
        video.play().catch((error) => {
            console.error('Error al reproducir el video:', error);
        });
    });

    // En caso de error al cargar el video
    video.addEventListener('error', () => {
        console.error('Error loading video');
    });
}

// Función para cargar datos
async function loadData() {
    try {
        console.log('🎮 Iniciando carga de datos...');
        
        // Iniciar la carga del video
        const videoPromise = setupLoadingVideo();

        // Cargar Strava de manera más simple
        try {
            console.log('🏃‍♂️ Intentando cargar datos de Strava...');
            await loadStravaActivities();
            console.log('✅ Carga de Strava completada');
        } catch (stravaError) {
            console.error('❌ Error cargando Strava:', stravaError);
        }

        // Cargar calendario de manera independiente
        try {
            console.log('📅 Intentando cargar eventos del calendario...');
            await loadCalendarEvents();
            console.log('✅ Eventos del calendario cargados correctamente');
        } catch (calendarError) {
            console.error('❌ Error cargando calendario:', calendarError);
        }

        // Resto de cargas
        const dataPromises = [
            loadHeroData(),
            initializeChatbot(),
            initializeDungeon3D()
            //initializeDungeon()
        ];

        // Esperar a que tanto el video como los datos estén listos
        await Promise.all([videoPromise, ...dataPromises]);
        // Una vez cargados los módulos, si el video sigue reproduciéndose, detenerlo
        const video = document.getElementById('loading-video');
        if (video && !video.paused) {
            video.pause();
            video.currentTime = 0; // Opcional: reiniciar el video si se desea
        }
        // Mostrar el contenido principal
        showMainContent();
    } catch (error) {
        console.error('❌ Error general en loadData:', error);

        // En caso de error, mostrar el contenido principal de todos modos
        showMainContent();
    }
}

// Función para ocultar la pantalla de carga y mostrar el contenido principal
function showMainContent() {
    const loadingScreen = document.getElementById('loading-screen');
    const mainContent = document.getElementById('main-content');

    // Detener el video si aún está reproduciéndose
    const video = document.getElementById('loading-video');
    if (video) {
        video.pause(); // Detener el video
        video.currentTime = 0; // Reiniciar el tiempo del video
        video.removeAttribute('loop'); // Asegurarse de que no entre en bucle
    }

    // Ocultar la pantalla de carga y mostrar el contenido principal
    loadingScreen.classList.add('hidden');
    mainContent.classList.remove('hidden');
}

// Iniciar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    loadData();

    const navButtons = document.querySelectorAll('.nav-button');
    navButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const sectionId = e.target.getAttribute('onclick').match(/'([^']+)'/)[1];
            showSection(sectionId);
        });
    });
});