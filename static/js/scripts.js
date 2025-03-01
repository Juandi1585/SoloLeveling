// // scripts.js - Archivo de scripts para la funcionalidad del frontend

// // 📌 FUNCIÓN PARA CARGAR EVENTOS DEL CALENDARIO Y MOSTRARLOS EN LA WEB
// document.addEventListener('DOMContentLoaded', async () => {
//     const calendarContent = document.getElementById('calendar-content');

//     try {
//         // 🔹 Hacer petición a Flask para obtener eventos
//         const response = await fetch('http://127.0.0.1:8080/events');
//         if (!response.ok) throw new Error('No se pudieron obtener los eventos');

//         const data = await response.json();
//         console.log("📅 Eventos recibidos:", data);  // 🔎 DEBUG: Ver eventos en la consola

//         // 🔹 Limpia el contenido antes de agregar eventos
//         calendarContent.innerHTML = '';

//         if (data.length > 0) {
//             let todayEvents = "<h2>📅 Eventos para Hoy:</h2>";
//             let tomorrowEvents = "<h2>📅 Eventos para Mañana:</h2>";

//             // 🔹 Obtener la fecha actual
//             const today = new Date();
//             today.setHours(0, 0, 0, 0); // Eliminar horas, minutos, segundos
//             const tomorrow = new Date(today);
//             tomorrow.setDate(today.getDate() + 1); // Día siguiente

//             data.forEach(event => {
//                 let startTime = new Date(event.start.dateTime);
//                 let endTime = new Date(event.end.dateTime);

//                 // 🔹 Formatear fecha y hora
//                 let formattedStart = startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
//                 let formattedEnd = endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
//                 let eventDuration = ((endTime - startTime) / 3600000).toFixed(1); // Duración en horas

//                 let eventHTML = `<div class="event">
//                     <h3>${event.summary}</h3>
//                     <p>🕒 ${formattedStart} - ${formattedEnd} (${eventDuration}h)</p>
//                     <p>📍 ${event.location || "Ubicación no especificada"}</p>
//                     <p>📜 ${event.description || "Sin descripción"}</p>
//                 </div>`;

//                 // 🔹 Clasificar eventos en HOY o MAÑANA
//                 if (startTime.toDateString() === today.toDateString()) {
//                     todayEvents += eventHTML;
//                 } else if (startTime.toDateString() === tomorrow.toDateString()) {
//                     tomorrowEvents += eventHTML;
//                 }
//             });

//             // 🔹 Agregar eventos a la web
//             if (todayEvents !== "<h2>📅 Eventos para Hoy:</h2>") {
//                 calendarContent.innerHTML += todayEvents;
//             } else {
//                 calendarContent.innerHTML += "<p>No hay eventos programados para hoy.</p>";
//             }

//             if (tomorrowEvents !== "<h2>📅 Eventos para Mañana:</h2>") {
//                 calendarContent.innerHTML += tomorrowEvents;
//             } else {
//                 calendarContent.innerHTML += "<p>No hay eventos programados para mañana.</p>";
//             }
//         } else {
//             calendarContent.innerHTML = "<p>No hay eventos programados.</p>";
//         }

//     } catch (error) {
//         console.error("❌ Error al obtener eventos:", error);
//         calendarContent.innerHTML = "<p style='color: red;'>❌ No se pudieron cargar los eventos.</p>";
//     }
// });


// // 📌 FUNCIÓN PARA CARGAR ARCHIVO DESDE GOOGLE DRIVE Y MOSTRAR DATOS EN EL CUADRO DE TEXTO
// async function loadExcel() {
//     const fileInfo = document.getElementById("file-info");
//     fileInfo.innerHTML = "Cargando datos...";
    
//     try {
//         const response = await fetch("http://localhost:8080/load_excel"); // Solicitud a Flask
//         if (!response.ok) throw new Error("Error al obtener el archivo");
        
//         const data = await response.json();
//         if (data.error) {
//             fileInfo.innerHTML = `<p class='error'>${data.error}</p>`;
//             return;
//         }
        
//         fileInfo.innerHTML = "";
//         for (const [key, value] of Object.entries(data)) {
//             fileInfo.innerHTML += `<p><strong>${key}:</strong> ${value}</p>`;
//         }
//     } catch (error) {
//         fileInfo.innerHTML = `<p class='error'>Error al cargar el archivo: ${error.message}</p>`;
//     }
// }

// // 📌 EVENTO PARA EL BOTÓN "CARGAR ARCHIVO"
// document.getElementById('upload-button').addEventListener('click', async () => {
//     const fileInfo = document.getElementById('file-info');  // Asegurar que usamos un <div>

//     try {
//         const response = await fetch('http://127.0.0.1:8080/load_excel');
//         if (!response.ok) throw new Error('No se pudo cargar el archivo.');

//         const data = await response.json();
//         console.log("📜 Datos del héroe recibidos:", data);  // 🔎 DEBUG: Ver los datos en consola

//         if (data.error) {
//             fileInfo.innerHTML = `<p style="color:red;">❌ ${data.error}</p>`;
//             return;
//         }

//         // 🔹 Construir tabla con los datos
//         let formattedData = `<h2>📜 Información del Héroe</h2><table class='hero-table'>`;
//         Object.entries(data).forEach(([key, value]) => {
//             formattedData += `<tr><td><strong>${key}:</strong></td><td>${value}</td></tr>`;
//         });
//         formattedData += "</table>";

//         fileInfo.innerHTML = formattedData;  // 🔹 Mostrar en la interfaz con formato HTML

//     } catch (error) {
//         console.error("❌ Error al obtener datos del archivo:", error);
//         fileInfo.innerHTML = `<p style="color: red;">❌ Error al cargar el archivo.</p>`;
//     }
// });

// // 🔹 Función para enviar mensajes al chatbot
// document.getElementById('send-button').addEventListener('click', sendMessage);
// document.getElementById('chat-input-field').addEventListener('keypress', function(event) {
//     if (event.key === 'Enter') sendMessage();
// });

// async function sendMessage() {
//     const chatbox = document.getElementById('chatbox');
//     const inputField = document.getElementById('chat-input-field');
//     const userMessage = inputField.value.trim();

//     if (!userMessage) return;

//     // 🔹 Agregar mensaje del usuario en azul
//     chatbox.innerHTML += `<div class="user-message">${userMessage}</div>`;
//     chatbox.scrollTop = chatbox.scrollHeight;
//     inputField.value = '';

//     try {
//         const response = await fetch('http://127.0.0.1:8080/api', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ message: userMessage })
//         });

//         const data = await response.json();
//         const botResponse = data.response || "Error en la respuesta.";

//         // 🔹 Agregar respuesta del bot en verde
//         chatbox.innerHTML += `<div class="bot-message">${botResponse}</div>`;
//         chatbox.scrollTop = chatbox.scrollHeight;

//     } catch (error) {
//         console.error("❌ Error en el chatbot:", error);
//         chatbox.innerHTML += `<div class="bot-message error-message">❌ Error al conectar con la IA.</div>`;
//     }
// }