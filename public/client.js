// Theme toggle
const themeSwitch = document.getElementById('themeSwitch');
function applyTheme() {
  if (themeSwitch.checked) {
    document.body.classList.add('dark-theme');
    localStorage.setItem('theme', 'dark');
  } else {
    document.body.classList.remove('dark-theme');
    localStorage.setItem('theme', 'light');
  }
}
themeSwitch.addEventListener('change', applyTheme);
// Load saved theme
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
  themeSwitch.checked = true;
  document.body.classList.add('dark-theme');
}

// Display current date and time
function updateCurrentTime() {
  const now = new Date();
  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'vien2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  };
  document.getElementById('currentTime').innerText = `Current Time: ${now.toLocaleString('en-US', options)}`;
}
updateCurrentTime();
setInterval(updateCurrentTime, 1000);

// Handle form submission
document.getElementById('capsuleForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const message = document.getElementById('message').value;
  const unlockDateTime = document.getElementById('unlockDateTime').value;
  const image = document.getElementById('image').files[0];
  const video = document.getElementById('video').files[0];
  const pdf = document.getElementById('pdf').files[0];

  const formData = new FormData();
  formData.append('message', message);
  formData.append('unlockDateTime', unlockDateTime);
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
      alert(`Capsule created! Your Capsule ID is: ${result.id}. Save this ID to view your capsule later.`);
      document.getElementById('capsuleForm').reset();
    }
  } catch (error) {
    alert('Error creating capsule: ' + error.message);
  }
});

// View capsule
async function viewCapsule() {
  const capsuleId = document.getElementById('capsuleId').value;
  const resultDiv = document.getElementById('capsuleResult');
  if (!capsuleId) {
    resultDiv.innerText = 'Please enter a Capsule ID.';
    return;
  }

  try {
    const response = await fetch(`/api/capsules/${capsuleId}`);
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