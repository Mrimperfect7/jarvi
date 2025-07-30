const outputBox = document.getElementById('output');
const statusBox = document.getElementById('status');

const synth = window.speechSynthesis;
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();

recognition.continuous = true;
recognition.lang = 'en-US';
recognition.interimResults = false;

const remindersKey = 'jarvis-reminders';

// Voice response
function speak(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.1;
  utterance.pitch = 1.0;
  synth.speak(utterance);
}

// Append response to UI
function appendOutput(text) {
  const p = document.createElement('p');
  p.textContent = text;
  outputBox.appendChild(p);
  outputBox.scrollTop = outputBox.scrollHeight;
}

function getLocationWeather() {
  navigator.geolocation.getCurrentPosition(async (pos) => {
    const lat = pos.coords.latitude;
    const lon = pos.coords.longitude;

    const response = await fetch(`https://api.weatherapi.com/v1/current.json?key=80f52081a3af17ab88cf4cb1d093ec1b&q=${lat},${lon}`);
    const data = await response.json();
    const weather = `The weather in ${data.location.name} is ${data.current.condition.text} with ${data.current.temp_c}°C.`;
    appendOutput(weather);
    speak(weather);
  });
}

function handleReminders() {
  const saved = localStorage.getItem(remindersKey);
  if (saved) {
    const reminders = JSON.parse(saved);
    const today = new Date().toISOString().slice(0, 10);
    const reminder = reminders.find(r => r.date === today);
    if (reminder) {
      speak(`Reminder: ${reminder.text}`);
      appendOutput(`Reminder: ${reminder.text}`);
    }
  }
}

async function processCommand(command) {
  appendOutput("You: " + command.toLowerCase());

  if (command.includes('weather')) {
    getLocationWeather();
  } else if (command.includes('play music')) {
    speak("Playing music now.");
    window.open("https://open.spotify.com/", '_blank');
  } else if (command.startsWith("remind me to")) {
    const text = command.replace("remind me to", "").trim();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const formatted = tomorrow.toISOString().slice(0, 10);

    const reminders = JSON.parse(localStorage.getItem(remindersKey) || "[]");
    reminders.push({ date: formatted, text });
    localStorage.setItem(remindersKey, JSON.stringify(reminders));

    speak(`Reminder set for tomorrow: ${text}`);
    appendOutput(`Reminder saved for tomorrow: ${text}`);
  } else {
    const response = await getAIResponse(command);
    speak(response);
    appendOutput("Jarvis: " + response);
  }
}

async function getAIResponse(prompt) {
  const response = await fetch("https://api.openai.com/v1/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer YOUR_OPENAI_API_KEY"
    },
    body: JSON.stringify({
      model: "text-davinci-003",
      prompt: prompt,
      max_tokens: 100
    })
  });

  const data = await response.json();
  return data.choices[0].text.trim();
}

recognition.onresult = (event) => {
  const last = event.results.length - 1;
  const transcript = event.results[last][0].transcript.trim();
  processCommand(transcript.toLowerCase());
};

recognition.onstart = () => statusBox.textContent = "🎙️ Jarvis is listening...";
recognition.onend = () => {
  statusBox.textContent = "🔁 Restarting listener...";
  recognition.start();
};

window.onload = () => {
  speak("Hello, I'm Jarvis. How can I assist you?");
  handleReminders();
  recognition.start();
};
