document.addEventListener('DOMContentLoaded', () => {
  const urlInput = document.getElementById('urlInput');
  urlInput.addEventListener('input', debounce(previewVideo, 500));

  // Setup circular progress bar
  const circle = document.querySelector('.progress-ring__circle');
  const radius = circle.r.baseVal.value;
  const circumference = 2 * Math.PI * radius;
  circle.style.strokeDasharray = `${circumference} ${circumference}`;
  circle.style.strokeDashoffset = circumference;
});

// ✅ Use local backend for now
const BACKEND_URL = 'http://127.0.0.1:5000';
console.log("Using backend URL:", BACKEND_URL);

function debounce(func, delay) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

async function previewVideo() {
  const url = document.getElementById('urlInput').value.trim();
  const preview = document.getElementById('preview');
  const status = document.getElementById('status');

  if (!url || (!url.includes('youtube.com') && !url.includes('youtu.be'))) {
    preview.innerHTML = '';
    status.innerText = 'Please enter a valid YouTube URL.';
    return;
  }

  status.innerText = 'Fetching video info...';

  try {
    const res = await fetch(`${BACKEND_URL}/api/info`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });

    if (res.ok) {
      const data = await res.json();
      preview.innerHTML = `
        <h3>${data.title}</h3>
        <img src="${data.thumbnail}" alt="Thumbnail" width="320" />
      `;
      status.innerText = '';
    } else {
      const error = await res.json();
      status.innerText = 'Error: ' + error.error;
      preview.innerHTML = '';
    }
  } catch (err) {
    status.innerText = 'Fetch error. Backend might not be running.';
    preview.innerHTML = '';
  }
}

async function downloadVideo() {
  const url = document.getElementById('urlInput').value.trim();
  const quality = document.getElementById('qualitySelect').value;
  const status = document.getElementById('status');
  const progressWrapper = document.querySelector('.progress-wrapper');
  const circle = document.querySelector('.progress-ring__circle');
  const radius = circle.r.baseVal.value;
  const circumference = 2 * Math.PI * radius;

  function setProgress(percent) {
    const offset = circumference - (percent / 100) * circumference;
    circle.style.strokeDashoffset = offset;
  }

  if (!url) {
    status.innerText = 'Please enter a URL.';
    return;
  }

  progressWrapper.style.display = 'block';
  setProgress(0);
  status.innerText = 'Processing...';

  try {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 1;
      setProgress(progress);
      if (progress >= 90) clearInterval(interval); // simulate progress
    }, 200);

    const res = await fetch(`${BACKEND_URL}/api/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, quality })
    });

    clearInterval(interval);
    setProgress(100);

    if (res.ok) {
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `video_${quality}p.mp4`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      status.innerText = 'Download started!';
    } else {
      const error = await res.json();
      status.innerText = 'Error: ' + error.error;
    }
  } catch (err) {
    status.innerText = 'Fetch error. Backend might not be running.';
  }

  setTimeout(() => {
    progressWrapper.style.display = 'none';
    setProgress(0);
  }, 2000);
}
