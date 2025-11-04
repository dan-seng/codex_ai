import bot from './assets/bot.svg';
import user from './assets/user.svg';

const form = document.querySelector('form');
const chatContainer = document.getElementById('chat_container');
const submitButton = document.querySelector('button[type="submit"]');
const buttonImg = submitButton.querySelector('img');

let loadInterval;
let abortController = null;
let isResponding = false;
 function loader(element){
    element.textContent = '';
    loadInterval = setInterval(() =>{
        element.textContent += '.';
        if(element.textContent === '....'){
            element.textContent = '';
        }
    }, 300)
 }

function typeText(element, text){
    let index = 0;
    let interval = setInterval(() =>{
        if(index < text.length){
            element.innerHTML += text.charAt(index);
            index ++;
        } else{
            clearInterval(interval);
            // Change back to send button when typing is done
            toggleButton(false);
        }
    }, 20)
}

 function generateUniqueId(){
    const timestamp = Date.now();
    const randomNumber = Math.random();
    const hexadecimalString = randomNumber.toString(16);
    return `id-${timestamp}-${hexadecimalString}`; 
 }

function chatStripe (isAi, value, uniqueId){
   return (
    `
     <div class="wrapper ${isAi && 'ai'}">
        <div class="chat">
        <div class="profile">
        <img
         src="${isAi? bot: user}"
         alt="${isAi? "bot": "user"}"
         />
        </div>
        <div class="message" id=${uniqueId}>
         ${value}
        </div>
        </div>
     </div>
    `
   )
}

const toggleButton = (responding) => {
    isResponding = responding;
    if (responding) {
        // Change to stop button
        buttonImg.style.transform = 'rotate(0deg)';
        buttonImg.style.width = '0.75rem';
        buttonImg.style.height = '0.75rem';
        submitButton.style.background = '#000000';
        submitButton.innerHTML = '<svg width="12" height="12" viewBox="0 0 12 12" fill="white" xmlns="http://www.w3.org/2000/svg"><rect width="12" height="12" rx="2"/></svg>';
    } else {
        // Change back to send button
        submitButton.style.background = '#000000';
        submitButton.innerHTML = '<img src="./assets/send.svg" alt="Send" />';
    }
};

const stopResponse = () => {
    if (abortController) {
        abortController.abort();
        abortController = null;
    }
    if (loadInterval) {
        clearInterval(loadInterval);
    }
    toggleButton(false);
};

const handleSubmit = async (e) =>{
    e.preventDefault();
    
    // If already responding, stop it
    if (isResponding) {
        stopResponse();
        return;
    }
    
    const data = new FormData(form);
    const prompt = data.get('prompt');
    
    if (!prompt.trim()) return;

    chatContainer.innerHTML += chatStripe(false, prompt);
    form.reset();

    const uniqueId = generateUniqueId();
    chatContainer.innerHTML += chatStripe(true, " ", uniqueId);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    const messageDiv = document.getElementById(uniqueId);
    loader(messageDiv);
    
    // Change to stop button
    toggleButton(true);
    
    // Create new AbortController for this request
    abortController = new AbortController();

    try {
        // Fetch data from the server -> bot's response
        const response = await fetch('http://localhost:5000/', {
            method: 'POST',
            headers: {
                'Content-type': 'application/json'
            },
            body: JSON.stringify({
                prompt: prompt
            }),
            signal: abortController.signal
        });

        clearInterval(loadInterval);
        messageDiv.innerHTML = '';

        if (response.ok) {
            const data = await response.json();
            const parsedData = data.bot.trim();

            typeText(messageDiv, parsedData);
        } else {
            const err = await response.text();
            messageDiv.innerHTML = "Something went wrong!!!";
            alert(err);
        }
    } catch (error) {
        clearInterval(loadInterval);
        if (error.name === 'AbortError') {
            messageDiv.innerHTML = 'Response stopped by user.';
        } else {
            messageDiv.innerHTML = "Something went wrong!!!";
            console.error('Error:', error);
        }
    } finally {
        // Change back to send button
        toggleButton(false);
        abortController = null;
    }

}
    form.addEventListener('submit', handleSubmit);
    form.addEventListener('keyup', (e) =>{
        if(e.keyCode===13){
            handleSubmit(e);
        }
})





