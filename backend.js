const sessionId = Math.random().toString(36).substring(2, 15);
let n8nWebhookUrl = '';

const chatContainer = document.getElementById('messages');
const userInput = document.getElementById('inp');
const sendButton = document.getElementById('send');
const chatForm = document.getElementById('form');
const typingIndicator = document.getElementById('typing-indicator');
const settingModal = document.getElementById('overlay');
const webhookUrlInput = document.getElementById('wh-url');

window.onload = () => {
    const saveUrl = localStorage.getItem('n8n_webhook_url');
    if (saveUrl) {
        n8nWebhookUrl = saveUrl;
        webhookUrlInput.value = saveUrl;
    } else {
        setTimeout(toggleSettings, 500);
    }
}

function toggleSettings() {
    settingModal.classList.toggle('open');
}

function saveSettings() {
    const url = webhookUrlInput.value.trim();

    if (!url) {
        addMessageToUI('Sistem', 'Peringatan: URL Webhook tidak boleh kosong!', 'bot');
        return;
    }

    try {
        new URL(url);

    } catch (e) {
        addMessageToUI('Sistem', 'Peringatan: URL Webhook tidak valid!', 'bot');
        return;
    }

    n8nWebhookUrl = url;
    localStorage.setItem('n8n_webhook_url', n8nWebhookUrl);
    addMessageToUI('Sistem', 'URL Webhook berhasil disimpan!', 'bot');
    toggleSettings();
}

function scrollToBottom() {
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function showTyping() {
    if (typingIndicator) {
        typingIndicator.classList.remove('hidden');
    }
    scrollToBottom();
}

function hideTyping() {
    if (typingIndicator) {
        typingIndicator.classList.add('hidden');
    }
}

function addMessageToUI(sender, text, type) {
    const messageDiv = document.createElement('div');

    if (type === 'user') {
        messageDiv.className = 'flex gap-2 justify-end';
        messageDiv.innerHTML = `
            <div class="bg-blue-600 text-white p-3 rounded-2xl rounded-tr">${escapeHTML(text)}</div>`;
    } else {
        const formattedText = formatBotResponse(text);
        messageDiv.className = 'flex gap-2';
        messageDiv.innerHTML = `
            <div class="w-8 h-8 rounded-full bg-blue-100"></div>
            <div class="bg-white border border-gray-200 rounded-2xl p-3">${formattedText}</div>`;
    }

    chatContainer.appendChild(messageDiv);
    scrollToBottom();
}

function escapeHTML(str) {
    return str.replace(/[&<>"']/g, tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[tag]));
}
    
function formatBotResponse(text) {
    let formatted = escapeHTML(text);
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    return formatted;
}

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userMessage = userInput.value.trim();
    if (!userMessage) return;

    addMessageToUI('Anda', userMessage, 'user');
    userInput.value = '';

    if (!n8nWebhookUrl) {
        addMessageToUI('Sistem', 'Peringatan: URL Webhook belum disetel! Klik tombol pengaturan untuk menyetel.', 'bot');
        return;
    }

    showTyping();
    userInput.disabled = true;
    sendButton.disabled = true;

    try {
        const response = await fetch(n8nWebhookUrl, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json' 
            },
            body: JSON.stringify({ 
                sessionId: sessionId,
                message: userMessage, 
                timestamp: new Date().toISOString() 
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        let botReply = data.output || data.reply || data.message || data.text || 'Maaf, saya tidak bisa memberikan jawaban saat ini.';
        if (typeof data === 'string') botReply = data;
            else if (Array.isArray(data) && data.length > 0 && data[0].output)
                botReply = data[0].output;
            hideTyping();
            addMessageToUI('Bot', botReply, 'bot');

    } catch (error) {
        console.error("Webhook error:", error);
        hideTyping();
        addMessageToUI('Sistem', 'Terjadi kesalahan saat menghubungi webhook: ' + error.message, 'bot');

    } finally {
        userInput.disabled = false;
        sendButton.disabled = false;
        userInput.focus();
    }
});

            

            

