// 📌 diary.js - Carga datos del diario desde un archivo Excel en Google Drive

export async function loadGameData() {
    console.log("📚 Cargando datos del juego...");
    try {
        await Promise.all([
            loadEnemies(),
            loadRules()
        ]);
        console.log("✅ Datos del juego cargados");
    } catch (error) {
        console.error("❌ Error cargando datos del juego:", error);
    }
}

async function loadEnemies() {
    const enemiesInfo = document.getElementById('enemies-info');
    if (!enemiesInfo) {
        console.error('No se encontró el elemento enemies-info');
        return;
    }

    enemiesInfo.innerHTML = 'Cargando enemigos...';

    try {
        const response = await fetch('http://localhost:8080/load_enemies');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const enemies = await response.json();
        console.log('Enemigos cargados:', enemies); // Debug

        if (!Array.isArray(enemies) || enemies.length === 0) {
            enemiesInfo.innerHTML = 'No hay enemigos registrados.';
            return;
        }

        let tableHTML = `
            <table class="enemies-table">
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Nivel</th>
                        <th>Tipo</th>
                        <th>Descripción</th>
                    </tr>
                </thead>
                <tbody>
        `;

        enemies.forEach(enemy => {
            tableHTML += `
                <tr>
                    <td>${enemy.Nombre || '-'}</td>
                    <td>${enemy.Nivel || '-'}</td>
                    <td>${enemy.Tipo || '-'}</td>
                    <td>${enemy.Descripcion || '-'}</td>
                </tr>
            `;
        });

        tableHTML += '</tbody></table>';
        enemiesInfo.innerHTML = tableHTML;

    } catch (error) {
        console.error('Error al cargar enemigos:', error);
        enemiesInfo.innerHTML = `<p class="error">❌ Error al cargar los enemigos: ${error.message}</p>`;
    }
}

async function loadRules() {
    const rulesInfo = document.getElementById('rules-info');
    if (!rulesInfo) {
        console.error('No se encontró el elemento rules-info');
        return;
    }

    rulesInfo.innerHTML = 'Cargando reglas...';

    try {
        const response = await fetch('http://localhost:8080/load_rules');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const rules = await response.json();
        console.log('Reglas cargadas:', rules); // Debug

        if (!Array.isArray(rules) || rules.length === 0) {
            rulesInfo.innerHTML = 'No hay reglas registradas.';
            return;
        }
        
        let rulesHTML = '<div class="rules-container">';
        rules.forEach(rule => {
            rulesHTML += `
                <div class="rule-card">
                    <h3>${rule.Categoria || 'Sin categoría'}</h3>
                    <p>${rule.Descripcion || 'Sin descripción'}</p>
                </div>
            `;
        });
        rulesHTML += '</div>';
        
        rulesInfo.innerHTML = rulesHTML;

    } catch (error) {
        console.error('Error al cargar reglas:', error);
        rulesInfo.innerHTML = `<p class="error">❌ Error al cargar las reglas: ${error.message}</p>`;
    }
}

