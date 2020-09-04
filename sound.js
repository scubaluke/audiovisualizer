import { hslToRgb } from './utils';

const width = 1500;
const height = 1500;
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');
canvas.width = width;
canvas.height = height;
let analyzer;
let bufferLength;

function handleError(err) {
  alert('you must give access to your mic in order to proceed');
}

async function getAudio() {
  const stream = await navigator.mediaDevices
    .getUserMedia({ audio: true })
    .catch(handleError);
  const audioCtx = new AudioContext();
  analyzer = audioCtx.createAnalyser();
  const source = audioCtx.createMediaStreamSource(stream);
  source.connect(analyzer);
  // how much data should we collect
  analyzer.fftSize = 2 ** 10;
  // pull data off the audio
  // how many pieces of data are there?
  bufferLength = analyzer.frequencyBinCount;
  const timeData = new Uint8Array(bufferLength);
  const frequencyData = new Uint8Array(bufferLength);
  drawTimeData(timeData);
  drawFrequency(frequencyData);
}

function drawTimeData(timeData) {
  // inject time data into timeData array
  analyzer.getByteTimeDomainData(timeData);
  // now we have the data lets make it something visual
  // 1. clear canvas
  ctx.clearRect(0, 0, width, height);
  // 2. set up canvas drawing
  ctx.lineWidth = 10;
  ctx.strokeStyle = '#fc036f';
  ctx.beginPath();
  const sliceWidth = width / bufferLength;
  let x = 0;
  timeData.forEach((data, i) => {
    const v = data / 128;
    const y = (v * height) / 2;
    // draw our lines
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
    x += sliceWidth;
  });
  ctx.stroke();
  // console.log(timeData);
  // call itself as soon as possible
  requestAnimationFrame(() => drawTimeData(timeData));
}

function drawFrequency(frequencyData) {
  // get frequency data into our frequecydata array
  analyzer.getByteFrequencyData(frequencyData);
  // figure out bar width
  const barWidth = (width / bufferLength) * 2.5;
  let x = 0;
  frequencyData.forEach(amount => {
    // 0 - 255 so what hight?
    const percent = amount / 255;
    const [h, s, l] = [360 / (percent * 360) - 0.5, 0.8, 0.5];

    const barHeight = (height * percent) / 1.1;
    // convert to hsl
    const [r, g, b] = hslToRgb(h, s, l);
    ctx.fillStyle = `rgb(${r},${g},${b}, 0.5)`;
    ctx.fillRect(x, height - barHeight, barWidth, barHeight);
    x += barWidth + 2;
  });
  // console.log(barWidth);
  // console.log(frequencyData);
  requestAnimationFrame(() => drawFrequency(frequencyData));
}
getAudio();
