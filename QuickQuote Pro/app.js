// Licencia Ilimitada activa por defecto para el cliente comprador
let isPro = true; 

// Cambiar entre pestañas
function switchTab(tab) {
    const tabs = ['crear', 'perfil', 'historial'];
    tabs.forEach(t => {
        document.getElementById(`section-${t}`).classList.add('hidden');
        document.getElementById(`tab-${t}`).className = "flex-1 py-3 px-4 text-center font-medium text-slate-500 hover:text-slate-800 transition";
    });

    document.getElementById(`section-${tab}`).classList.remove('hidden');
    document.getElementById(`tab-${tab}`).className = "flex-1 py-3 px-4 text-center font-semibold text-indigo-600 border-b-2 border-indigo-600 transition";

    if (tab === 'historial') renderHistory();
}

// Previsualizar y procesar Logo cargado por el usuario
function previewLogo(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            companyLogoBase64 = e.target.result;
            const preview = document.getElementById('logo-preview');
            preview.src = companyLogoBase64;
            document.getElementById('logo-preview-container').classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }
}

let companyLogoBase64 = localStorage.getItem('qq_company_logo') || '';

// Guardar datos del Perfil en LocalStorage
function saveCompanyProfile() {
    const name = document.getElementById('company-name').value.trim();
    const sub = document.getElementById('company-sub').value.trim();

    localStorage.setItem('qq_company_name', name);
    localStorage.setItem('qq_company_sub', sub);
    if (companyLogoBase64) {
        localStorage.setItem('qq_company_logo', companyLogoBase64);
    }

    alert('¡Datos de tu empresa guardados con éxito!');
    switchTab('crear');
}

// Cargar datos del Perfil al iniciar
function loadCompanyProfile() {
    const savedName = localStorage.getItem('qq_company_name');
    const savedSub = localStorage.getItem('qq_company_sub');

    if (savedName) document.getElementById('company-name').value = savedName;
    if (savedSub) document.getElementById('company-sub').value = savedSub;
    
    if (companyLogoBase64) {
        const preview = document.getElementById('logo-preview');
        preview.src = companyLogoBase64;
        document.getElementById('logo-preview-container').classList.remove('hidden');
    }
}

loadCompanyProfile();

// Añadir fila de ítem
function addItemRow() {
    const container = document.getElementById('items-container');
    const row = document.createElement('div');
    row.className = "item-row grid grid-cols-12 gap-2 items-center";
    row.innerHTML = `
        <input type="text" placeholder="Descripción del servicio" class="item-desc col-span-6 border border-slate-300 rounded-lg p-2 text-sm outline-none">
        <input type="number" placeholder="Cant" value="1" min="1" oninput="calculateTotal()" class="item-qty col-span-2 border border-slate-300 rounded-lg p-2 text-sm outline-none text-center">
        <input type="number" placeholder="Precio ($)" min="0" oninput="calculateTotal()" class="item-price col-span-3 border border-slate-300 rounded-lg p-2 text-sm outline-none text-right">
        <button onclick="this.parentElement.remove(); calculateTotal();" class="col-span-1 text-red-500 hover:text-red-700 text-center font-bold">×</button>
    `;
    container.appendChild(row);
}

// Calcular Total
function calculateTotal() {
    let total = 0;
    const rows = document.querySelectorAll('.item-row');
    rows.forEach(row => {
        const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
        const price = parseFloat(row.querySelector('.item-price').value) || 0;
        total += qty * price;
    });
    document.getElementById('grand-total').innerText = `$${total.toFixed(2)}`;
    return total;
}

// Generar PDF y WhatsApp (Sin restricciones)
async function generatePDFAndWhatsApp() {
    const clientName = document.getElementById('client-name').value.trim();
    const clientPhone = document.getElementById('client-phone').value.trim();
    const total = calculateTotal();

    if(!clientName || !clientPhone) {
        alert("Por favor ingresa el nombre y teléfono del cliente.");
        return;
    }

    // Configurar encabezado del PDF con los datos de la empresa guardados
    const savedName = localStorage.getItem('qq_company_name') || 'Tu Empresa / Tu Nombre';
    const savedSub = localStorage.getItem('qq_company_sub') || 'Soluciones Profesionales';

    document.getElementById('pdf-company-name').innerText = savedName;
    document.getElementById('pdf-company-sub').innerText = savedSub;

    const pdfLogoImg = document.getElementById('pdf-company-logo');
    if (companyLogoBase64) {
        pdfLogoImg.src = companyLogoBase64;
        pdfLogoImg.classList.remove('hidden');
    } else {
        pdfLogoImg.classList.add('hidden');
    }

    // Llenar datos de cliente y fecha
    document.getElementById('pdf-client').innerText = clientName;
    document.getElementById('pdf-date').innerText = `Fecha: ${new Date().toLocaleDateString()}`;
    document.getElementById('pdf-total').innerText = `$${total.toFixed(2)}`;
    
    // Procesar Notas / Observaciones para el PDF (Añadido limpio)
    const notes = document.getElementById('quote-notes').value.trim();
    const pdfNotesContainer = document.getElementById('pdf-notes-container');
    const pdfNotesText = document.getElementById('pdf-notes-text');

    if (notes) {
        pdfNotesText.innerText = notes;
        pdfNotesContainer.classList.remove('hidden');
    } else {
        pdfNotesContainer.classList.add('hidden');
    }

    const pdfBody = document.getElementById('pdf-items-body');
    pdfBody.innerHTML = '';
    
    const rows = document.querySelectorAll('.item-row');
    rows.forEach(row => {
        const desc = row.querySelector('.item-desc').value || 'Servicio';
        const qty = row.querySelector('.item-qty').value || 1;
        const price = row.querySelector('.item-price').value || 0;
        const subtotal = qty * price;

        const tr = document.createElement('tr');
        tr.className = "border-b text-slate-700";
        tr.innerHTML = `
            <td class="py-2">${desc}</td>
            <td class="py-2 text-center">${qty}</td>
            <td class="py-2 text-right">$${subtotal.toFixed(2)}</td>
        `;
        pdfBody.appendChild(tr);
    });

    // Generar PDF
    const element = document.getElementById('pdf-template');
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 190;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
    
    saveToHistory(clientName, total);

    pdf.save(`Presupuesto_${clientName.replace(/\s+/g, '_')}.pdf`);

    const message = encodeURIComponent(`Hola *${clientName}*, adjunto el presupuesto emitido por *${savedName}* por un total de *$${total.toFixed(2)}*. Quedo atento a tus comentarios.`);
    window.open(`https://wa.me/${clientPhone}?text=${message}`, '_blank');
}

function saveToHistory(client, total) {
    let history = JSON.parse(localStorage.getItem('qq_history') || '[]');
    history.unshift({ client, total: total.toFixed(2), date: new Date().toLocaleDateString() });
    localStorage.setItem('qq_history', JSON.stringify(history));
}

function renderHistory() {
    const list = document.getElementById('history-list');
    let history = JSON.parse(localStorage.getItem('qq_history') || '[]');
    
    if(history.length === 0) {
        list.innerHTML = `<p class="text-sm text-slate-400 italic">No hay presupuestos guardados aún.</p>`;
        return;
    }

    list.innerHTML = history.map(item => `
        <div class="flex justify-between items-center p-3 bg-slate-50 rounded-xl border">
            <div>
                <p class="font-bold text-sm text-slate-800">${item.client}</p>
                <p class="text-xs text-slate-400">${item.date}</p>
            </div>
            <span class="font-black text-indigo-600">$${item.total}</span>
        </div>
    `).join('');
}

// Función para cerrar o salir de la aplicación
function closeApp() {
    if (confirm("¿Deseas cerrar la aplicación?")) {
        window.close();
        setTimeout(() => {
            document.body.innerHTML = `
                <div class="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center space-y-4">
                    <h1 class="text-2xl font-bold">Has cerrado QuickQuote Pro</h1>
                    <p class="text-sm text-slate-400">Puedes cerrar esta pestaña o ventana del navegador de forma segura.</p>
                    <button onclick="location.reload()" class="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold">Volver a abrir</button>
                </div>
            `;
        }, 300);
    }
}