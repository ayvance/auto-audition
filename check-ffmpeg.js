const ffmpeg = require('ffmpeg-static');
const ffprobe = require('ffprobe-static');
const fs = require('fs');

console.log('ffmpeg path:', ffmpeg);
console.log('ffmpeg exists:', fs.existsSync(ffmpeg));

console.log('ffprobe path:', ffprobe.path);
console.log('ffprobe exists:', fs.existsSync(ffprobe.path));
