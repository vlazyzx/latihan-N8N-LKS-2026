const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');  
const chatForm = document.getElementById('chat-form');
const typingIndicator = document.getElementById('typing-indicator');
const settingsButton = document.getElementById('settings-button');
const webhookUrlInput = document.getElementById('webhook-url');

window.onload = () => {
    const saveUrl = localStorage.getItem('webhookUrl');
    if (saveUrl) {
        n8nWebhookUrl = saveUrl;
        webhookUrlInput.value = saveUrl;
    } else {
        setTimeout(ToggleSettings, 500);
    }
}