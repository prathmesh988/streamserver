const NodeMediaServer = require('node-media-server');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');

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

const nms = new NodeMediaServer(config);
// Add a new onConnect hook to handle incoming RTMP streams

nms.on('onMessage', (id, msg) => {
  console.log(`Received message from client ${id}: ${msg}`);




  // You can respond to the message or perform any other actions here
});

nms.on('onConnect', (id, args) => {
  console.log('RTMP server is running on port 1935');
  console.log(`New RTMP stream connected: ${args.app}/${args.stream}`);

  // Set the output file path for saving the encoded stream
  const outputFilePath = `./output/${args.stream}_encoded.mp4`;

  // Perform video encoding for the incoming stream
  const ffmpegProcess = ffmpeg()
    .input(`rtmp://localhost:1935/${args.app}/${args.stream}`)
    .inputFormat('flv')
    .videoCodec('libx264')
    .audioCodec('aac')
    .format('flv') // Keep the output format as FLV for RTMP streaming
    .outputOptions([
      '-preset ultrafast',
      '-tune zerolatency',
    ])
    .output(outputFilePath)
    .on('end', () => console.log(`Video encoding for stream ${args.stream} complete`))
    .on('error', (err) => console.error(`Error for stream ${args.stream}:`, err))
    .run();

  // Add cleanup logic when the connection ends
  nms.on('onClose', (id, args) => {
    if (args.app === 'live' && args.stream === args.stream) {
      console.log(`RTMP stream ${args.stream} closed`);
      ffmpegProcess.kill('SIGTERM'); // Stop ffmpeg process when the stream disconnects
    }
  });

  nms.on('onMessage', (id, msg) => { 
    console.log(`Received message from client ${id}: ${msg}`);
    // You can respond to the message or perform any other actions here
  } );
});

nms.run();

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

console.log('RTMP server is running on port 1935');
console.log('HTTP server is running on port 8000');
