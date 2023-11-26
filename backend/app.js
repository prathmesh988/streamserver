const NodeMediaServer = require('node-media-server');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const{spawn} = require('child_process');

const ffmpegPath = ffmpeg.setFfmpegPath('C:\\Program Files\\ffmpeg-2023-11-22-git-0008e1c5d5-full_build\\bin'); // Path to the bundled ffmpeg
// const ffmpegExecutable = path.basename(ffmpegPath); // Extracting the executable name
const ffmpegExecutablePath = path.join('C:\\Program Files\\ffmpeg-2023-11-22-git-0008e1c5d5-full_build\\bin', 'ffmpeg.exe');
const ffmpegProcessesd = new Map();

console.log('ffmpeg executable path:', ffmpegExecutablePath);

const config = {
  rtmp: {
    port: 1935,
    chunk_size: 60000,
    gop_cache: true,
    ping: 60,
    ping_timeout: 30,
  },
  http: {
    port: 8000,
    mediaroot: './media',
    allow_origin: '*',
  },
};
function startRecording(inputURL, outputFilePath) {
  const ffmpegProcess = spawn(ffmpegExecutablePath, [
    '-i', inputURL,
    '-c:v', 'libx264', // Use H.264 video codec
    '-c:a', 'aac', // Use AAC audio codec
    '-movflags', '+faststart', // Place moov atom at the front of the file

    '-f', 'mp4', // Change format to MP4 file
    outputFilePath,
  ]);

  ffmpegProcess.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
  });

  ffmpegProcess.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
  });

  ffmpegProcess.on('close', (code) => {
    console.log(`Child process exited with code ${code}`);
  });
}
const nms = new NodeMediaServer(config);
// Add a new onConnect hook to handle incoming RTMP streams
nms.on('onConnect', (id, args) => {     
  console.log('hello world who asked?')
  

});

nms.on('onMessage', (id, msg) => {
  console.log(`Received message from client ${id}: ${msg}`);




  // You can respond to the message or perform any other actions here
});

nms.on('preConnect', (id, args) => {
  const streamId = args.stream
  console.log('[NodeEvent on preConnect]:', `id=${id} args=${JSON.stringify(args)}`);
  console.log(`New RTMP stream connected: ${args.app}/${args.stream}`);

  // Set the output file path for saving the encoded stream
  const outputFilePath = `./output/${args.stream}_encoded.mp4`;

  // perform a video encoding after that save that file to the output folder which is present in the current directory using ffmpeg
  // hello world hwho aaksed?
  startRecording
  startRecording(`rtmp://localhost:1935/live/hello`, outputFilePath);

  console.log('stream is sended everytime when the client connects to the server');
  ffmpegProcessesd.set(streamId, startRecording(`rtmp://localhost:1935/live/${streamId}`, outputFilePath));

});
// nms.on('postPublish', (id, streamPath, args) => {
//   console.log(`Stream connected: ${streamPath}`);
//   // Your custom logic after a stream is connected goes here
//   const ffmpegCommand = spawn('ffmpeg', [
//     '-i', `rtmp://localhost:1935${streamPath}`, // input RTMP stream URL
//     '-c', 'copy',
//     '-f', 'flv',
//     'output.flv', // replace with your desired output file name
//   ]);

//   ffmpegCommand.stdout.on('data', (data) => {
//     console.log(`FFmpeg stdout: ${data}`);
//   });

//   ffmpegCommand.stderr.on('data', (data) => {
//     console.error(`FFmpeg stderr: ${data}`);
//   });

//   ffmpegCommand.on('close', (code) => {
//     console.log(`FFmpeg process closed with code ${code}`);
//   });
// });


nms.on('doneConnect', (id, args) => {
  const streamId = args.stream;

  // Retrieve and stop the ffmpeg process using the streamId
  const ffmpegProcess = ffmpegProcesses.get(streamId);
  if (ffmpegProcess) {
    ffmpegProcess.kill('SIGINT'); // Gracefully stop the ffmpeg process
    ffmpegProcesses.delete(streamId); // Remove the process from the map
  }

  console.log(`Stopped recording for stream ${streamId}`);
});


nms.on('onClose', (id, args) => {
  console.log(`RTMP stream ${args.stream} closed`);

  const ffmpegProcess = ffmpegProcesses.get(args.stream);
  if (ffmpegProcess) {
    ffmpegProcess.kill('SIGTERM');
    ffmpegProcesses.delete(args.stream);
  }

  // Additional logic for stream closure can be added here
});

nms.on('onMessage', (id, msg) => {
  console.log(`Received message from client ${id}: ${msg}`);
  // Additional logic for handling messages can be added here
});




nms.on('onClose', (id, args) => {
  if (args.app === 'live' && args.stream === args.stream) {
    console.log(`RTMP stream ${args.stream} closed`);
    ffmpegProcess.kill('SIGTERM'); // Stop ffmpeg process when the stream disconnects

    // Send the recorded video data to the upload server
    const postData = JSON.stringify({ video: videoBuffer.toString('base64') });

    const options = {
      hostname: 'localhost',
      port: 3000,  // Change this to the port of your upload server
      path: '/upload',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': postData.length,
      },
    };

    const uploadRequest = http.request(options, (uploadRes) => {
      let data = '';

      uploadRes.on('data', (chunk) => {
        data += chunk;
      });

      uploadRes.on('end', () => {
        console.log('Upload server response:', data);
      });
    });

    uploadRequest.on('error', (error) => {
      console.error('Error sending data to upload server:', error);
    });

    uploadRequest.write(postData);
    uploadRequest.end();
  }
});
nms.run();
console.log('RTMP server is running on port 1935');
console.log('HTTP server is running on port 8000');
