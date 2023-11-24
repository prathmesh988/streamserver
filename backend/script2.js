const ffmpeg = require('fluent-ffmpeg');

// Replace the RTMP input URL and output file name as needed
const rtmpInputUrl = 'rtmp://your-rtmp-server-url/your-stream-key';
const outputFileName = 'output.mp4';

ffmpeg()
  .input(rtmpInputUrl)
  .inputFormat('flv')
  .videoCodec('libx264')
  .videoBitrate('1000k')
  .audioCodec('aac')
  .audioBitrate('128k')
  .format('mp4')
  .outputOptions([
    '-preset ultrafast',
    '-tune zerolatency',
    '-vf scale=640:480', // Adjust video resolution as needed
  ])
  .on('end', () => console.log('Video encoding complete'))
  .on('error', (err) => console.error('Error:', err))
  .save(outputFileName);
