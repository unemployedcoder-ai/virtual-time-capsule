// Section toggle
function showSection(section) {
  document.querySelector('.landing-container').style.display = 'none';
  document.getElementById(`${section}-section`).classList.add('active');
}

function backToLanding() {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelector('.landing-container').style.display = 'flex';
}

// Theme toggle
function applyTheme(checkbox) {
  if (checkbox.checked) {
    document.body.classList.add('dark-theme');
    localStorage.setItem('theme', 'dark');
  } else {
    document.body.classList.remove('dark-theme');
    localStorage.setItem('theme', 'light');
  }
}

const themeSwitch = document.getElementById('themeSwitch');
const themeSwitchView = document.getElementById('themeSwitchView');
themeSwitch.addEventListener('change', () => applyTheme(themeSwitch));
themeSwitchView.addEventListener('change', () => applyTheme(themeSwitchView));

// Load saved theme
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
  themeSwitch.checked = true;
  themeSwitchView.checked = true;
  document.body.classList.add('dark-theme');
}

// Display current date and time
function updateCurrentTime() {
  const now = new Date();
  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  };
  const timeString = `Current Time: ${now.toLocaleString('en-US', options)}`;
  document.getElementById('currentTime').innerText = timeString;
  document.getElementById('currentTimeView').innerText = timeString;
}
updateCurrentTime();
setInterval(updateCurrentTime, 1000);

// Handle form submission
document.getElementById('capsuleForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const message = document.getElementById('message').value;
  const unlockDateTime = document.getElementById('unlockDateTime').value;
  const password = document.getElementById('password').value;
  const image = document.getElementById('image').files[0];
  const video = document.getElementById('video').files[0];
  const pdf = document.getElementById('pdf').files[0];

  const formData = new FormData();
  formData.append('message', message);
  formData.append('unlockDateTime', unlockDateTime);
  formData.append('password', password);
  if (image) formData.append('image', image);
  if (video) formData.append('video', video);
  if (pdf) formData.append('pdf', pdf);

  try {
    const response = await fetch('/api/capsules', {
      method: 'POST',
      body: formData
    });
    const result = await response.json();
    if (result.error) {
      alert(result.error);
    } else {
      alert(`Capsule created! Your Capsule ID is: ${result.id}. Save this ID and password to view your capsule later.`);
      document.getElementById('capsuleForm').reset();
      backToLanding();
    }
  } catch (error) {
    alert('Error creating capsule: ' + error.message);
  }
});

// View capsule
async function viewCapsule() {
  const capsuleId = document.getElementById('capsuleId').value;
  const password = document.getElementById('viewPassword').value;
  const resultDiv = document.getElementById('capsuleResult');
  if (!capsuleId || !password) {
    resultDiv.innerText = 'Please enter both Capsule ID and Password.';
    return;
  }

  try {
    const response = await fetch(`/api/capsules/${capsuleId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    const result = await response.json();
    if (result.error) {
      resultDiv.innerText = result.error;
    } else {
      const today = new Date();
      const unlockDateTime = new Date(result.unlockDateTime);
      resultDiv.innerHTML = '';
      if (today >= unlockDateTime) {
        resultDiv.innerHTML += `<p><strong>Capsule Contents:</strong> ${result.message}</p>`;
        if (result.files.image) {
          resultDiv.innerHTML += `<img src="${result.files.image}" alt="Capsule Image">`;
        }
        if (result.files.video) {
          resultDiv.innerHTML += `<video controls><source src="${result.files.video}" type="video/mp4"></video>`;
        }
        if (result.files.pdf) {
          resultDiv.innerHTML += `<embed src="${result.files.pdf}" type="application/pdf" width="100%" height="600px">`;
        }
      } else {
        resultDiv.innerHTML = `This capsule is locked until ${unlockDateTime.toLocaleString('en-US')}.`;
      }
    }
  } catch (error) {
    resultDiv.innerText = 'Error retrieving capsule: ' + error.message;
  }
}