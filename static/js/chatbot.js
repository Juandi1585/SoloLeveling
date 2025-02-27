// 📌 chatbot.js - Comunicación con la IA local (LLM)

// 🔹 Inicializa el chatbot cuando la página se carga
export function initializeChatbot() {
    document.getElementById('send-button').addEventListener('click', sendMessage);
    document.getElementById('chat-input-field').addEventListener('keypress', function(event) {
        if (event.key === 'Enter') sendMessage(); // Permitir envío con Enter
    });
}

// 🔹 Función para enviar mensajes al chatbot
async function sendMessage() {
    const chatbox = document.getElementById('chatbox'); // Caja donde se muestra la conversación
    const inputField = document.getElementById('chat-input-field'); // Campo de entrada de texto
    const userMessage = inputField.value.trim(); // Eliminar espacios en blanco

    if (!userMessage) return; // No hacer nada si el usuario no escribió nada

    // 🔹 Agregar mensaje del usuario en azul
    chatbox.innerHTML += `<div class="user-message">${userMessage}</div>`;
    chatbox.scrollTop = chatbox.scrollHeight; // Desplazar el chat hacia abajo
    inputField.value = ''; // Limpiar el campo de entrada después de enviar

    try {
        // 🔹 Enviar mensaje al backend de Flask que conecta con la IA
        const response = await fetch('http://127.0.0.1:8080/api', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: userMessage }) // Enviar el mensaje como JSON
        });

        const data = await response.json();
        const botResponse = data.response || "Error en la respuesta.";

        // 🔹 Agregar respuesta de la IA en verde
        chatbox.innerHTML += `<div class="bot-message">${botResponse}</div>`;
        chatbox.scrollTop = chatbox.scrollHeight; // Desplazar el chat hacia abajo

    } catch (error) {
        console.error("❌ Error en el chatbot:", error);
        chatbox.innerHTML += `<div class="bot-message error-message">❌ Error al conectar con la IA.</div>`;
    }
}
