let videoElement = document.getElementById('video');
let recordBtn = document.getElementById('recordBtn');
let mediaRecorder;

recordBtn.addEventListener('click', async function () {
    let stream = await navigator.mediaDevices.getDisplayMedia({
        video: true
    });

    const mime = MediaRecorder.isTypeSupported("video/webm; codecs=vp9")
        ? "video/webm; codecs=vp9"
        : "video/webm";

    mediaRecorder = new MediaRecorder(stream, {
        mimeType: mime
    });

    let chunks = [];
    mediaRecorder.addEventListener('dataavailable', function (e) {
        if (e.data.size > 0) {
            chunks.push(e.data);
        }
    });

    mediaRecorder.addEventListener('stop', function () {
        let blob = new Blob(chunks, {
            type: chunks[0].type
        });

        // Display recorded video in the video element
        videoElement.src = URL.createObjectURL(blob);

        // Send the recorded video to the RTMP server using flv.js
        sendToRTMPServer(blob);

        chunks = [];
    });

    mediaRecorder.start();
});

function sendToRTMPServer(blob) {
    let flvOptions = {
        type: 'flv',
        url: 'rtmp://localhost:1935/live/hello'  // Replace with your RTMP server URL
    };

    let flvPlayer = flvjs.createPlayer(flvOptions);
    flvPlayer.attachMediaElement(videoElement);
    flvPlayer.load();
    flvPlayer.play();

    // Create a new FormData object to send the video blob to the server
    let formData = new FormData();
    formData.append('video', blob, 'video.webm');

    // Send the FormData to the server using a fetch request
    fetch('http://localhost:3000', {
        method: 'POST',
        body: formData,
    })
    .then(response => response.json())
    .then(data => console.log(data))
    .catch(error => console.error('Error:', error));
}
