const sessionId = Math.random().toString(36).substring(2, 15);
let n8nWebhookUrl = '';

const chatContainer = document.getElementById('messages');
const userInput = document.getElementById('inp');
const sendButton = document.getElementById('send');
const chatForm = document.getElementById('form');
const typingIndicator = document.getElementById('typing');
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
        typingIndicator.style.display = 'flex';
    }
    scrollToBottom();
}

function hideTyping() {
    if (typingIndicator) {
        typingIndicator.style.display = 'none';
    }
}

function addMessageToUI(sender, text, type) {
    const row = document.createElement('div');
    
    if (type === 'user') {
        row.className = 'row user-row';
        const bubble = document.createElement('div');
        bubble.className = 'bubble user';
        bubble.textContent = escapeHTML(text);
        
        const avatar = document.createElement('div');
        avatar.className = 'mini-avatar user';
        avatar.textContent = '👤';
        
        row.appendChild(bubble);
        row.appendChild(avatar);
    } else {
        row.className = 'row bot-row';
        
        const avatar = document.createElement('div');
        avatar.className = 'mini-avatar bot';
        const img = document.createElement('img');
        img.src = 'ypippilogo.jpeg';
        img.style.cssText = 'width:100%;height:100%;object-fit:contain;';
        img.alt = 'YP IPPI';
        avatar.appendChild(img);
        
        const bubble = document.createElement('div');
        bubble.className = 'bubble bot';
        if (type === 'system') {
            bubble.className = 'bubble system';
        }
        const formattedText = formatBotResponse(text);
        bubble.innerHTML = formattedText;
        
        row.appendChild(avatar);
        row.appendChild(bubble);
    }

    chatContainer.appendChild(row);
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
    
    // Format bold
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Format italic
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Format code blocks
    formatted = formatted.replace(/```(.*?)```/gs, '<pre><code>$1</code></pre>');
    
    // Format inline code
    formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Convert newlines to proper formatting
    let lines = formatted.split('\n');
    let inList = false;
    let listItems = [];
    let result = [];
    
    for (let line of lines) {
        line = line.trim();
        if (!line) continue;
        
        // Check if line is a list item (numbered or bulleted)
        if (/^(\d+\.|•|-|\*)\s/.test(line)) {
            if (!inList) {
                inList = true;
                listItems = [];
            }
            // Remove list marker and keep content
            let content = line.replace(/^(\d+\.|•|-|\*)\s+/, '');
            listItems.push(`<li>${content}</li>`);
        } else {
            if (inList) {
                result.push(`<ol>${listItems.join('')}</ol>`);
                inList = false;
                listItems = [];
            }
            if (line) {
                result.push(`<p>${line}</p>`);
            }
        }
    }
    
    if (inList) {
        result.push(`<ol>${listItems.join('')}</ol>`);
    }
    
    return result.join('') || formatted;
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

            

            

