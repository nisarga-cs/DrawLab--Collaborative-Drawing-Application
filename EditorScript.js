//const { io } = require("socket.io-client");

//import rough from 'C:\Users\Admin\node_modules\roughjs';
console.log('ScriptJS - stylesheet');
const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');

const previewCanvas = document.getElementById('previewCanvas');
const previewCtx = previewCanvas.getContext('2d');

const cursorCanvas = document.getElementById('cursorCanvas');
const cursorCtx = cursorCanvas.getContext('2d');

const socket = io();

sprayDensity=6;//set default 
brushSize=6;
let textSize = 14;
let isDrawing = false;
let x = 0;
let y = 0;
let colorPicked = 'black';
let lineWidth = 2;
let tool = 'pencil';
let eraserSize = 10;
let canvasText ='';
let undoStack = [];
let redoStack = [];
let textFont = 'Arial';

let cursors = {}; // Store cursor positions for all the users

function drawCursor(x, y, name, emit) {
    const radius = 10;  
  cursorCtx.beginPath();
  cursorCtx.arc(x, y, radius, 0, Math.PI * 2, false);
  cursorCtx.strokeStyle = 'black';
  cursorCtx.stroke();
  cursorCtx.textAlign = 'center';
  cursorCtx.textBaseline = 'middle';
  cursorCtx.font = 'bold 12px Arial';
  cursorCtx.fillStyle = 'black';
  cursorCtx.fillText(name, x, y);

  if(emit){
    const cursorData = {
      type: 'cursor',
      x1: x,
      y1: y,
      name: name
    };
    emitDrawData(cursorData);
  }

}

function drawCursors() {
  //console.log("Cursors ", Object.keys(cursors).length," ", Object.keys(cursors)[0],", ",Object.keys(cursors)[1],",",Object.keys(cursors)[2]);
  cursorCtx.clearRect(0, 0, ctx.width, ctx.height);
  for (const userId in cursors) {
    const cursor = cursors[userId];
    //Alter the 3 argument if required to add a name
    drawCursor(cursor.x, cursor.y, socket.id.slice(-4), true);
  }
}

function saveCanvasState() {
  console.log("Saving the canvas state");
  const canvasData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  if (undoStack.length > 0 && areImageDataEqual(canvasData, undoStack[undoStack.length - 1])) {
    console.log("Current state is the same as the top of the undo stack");
    return; 
  }
  undoStack.push(canvasData);
  redoStack = []; // to clear redo stack
  console.log("Undo stack- ",undoStack);
  console.log("Undo stack[0] ",undoStack[0]);
}

function areImageDataEqual(imageData1, imageData2) {
  if (imageData1.width !== imageData2.width || imageData1.height !== imageData2.height) {
    return false; // Different dimensions
  }
  const data1 = imageData1.data;
  const data2 = imageData2.data;
  if (data1.length !== data2.length) {
    return false; // Different data lengths
  }
  for (let i = 0; i < data1.length; i++) {
    if (data1[i] !== data2[i]) {
      return false; // Pixel values differ
    }
  }
  return true; // All pixels match
}


function undo(emit) {
  if (undoStack.length > 0) {
    redoStack.push(undoStack.pop());
    const state = undoStack[undoStack.length - 1];
    ctx.putImageData(state, 0, 0);

    if(emit){
    const undoData ={
      type: 'undo',
      };
    emitDrawData(undoData);
    }
  }
}

function redo(emit) {
  if (redoStack.length > 0) {
    console.log("Executimg redo opereation");
    undoStack.push(redoStack.pop());
    const state = undoStack[undoStack.length - 1];
    ctx.putImageData(state, 0, 0);

    if(emit){
    const redoData ={
      type: 'redo',
    };
    emitDrawData(redoData);
  }
  }
}

canvas.addEventListener('mousedown', (e) => {
  isDrawing = true;
  x = e.offsetX;
  y = e.offsetY;

  if (tool === 'line' || tool === 'rectangle' || tool === 'circle' || tool=== 'applyText') {
    shapeStartX = x;
    shapeStartY = y;
  }
});

canvas.addEventListener('mousemove', (e) => {
  if (isDrawing) {
    if (tool === 'pencil') {
        drawLine(e.offsetX, e.offsetY,true);
      } else if (tool === 'eraser') {
        drawEraser(e.offsetX, e.offsetY,true);
      } else if (tool === 'brush') {
        drawBrush(e.offsetX, e.offsetY, true);
      } else if (tool === 'spray') {
        drawSpray(e.offsetX, e.offsetY,true);
      } else if (tool === 'line' || tool === 'rectangle' || tool === 'circle' || tool=== 'applyText') {
        drawShapePreview(e.offsetX, e.offsetY, tool);
      }

  }
  cursorCtx.clearRect(0, 0, canvas.width, canvas.height);
  //console.log("Moving cursor- ",socket.id);
  cursors[socket.id] = {x:e.offsetX, y:e.offsetY};
  drawCursors();

});

canvas.addEventListener('mouseup', (e) => {
    
    if (tool === 'line' || tool === 'rectangle' || tool === 'circle' || tool=== 'applyText') {
      drawShape(e.offsetX, e.offsetY, tool);
    }
    saveCanvasState();
    isDrawing = false;
    previewCtx.clearRect(0, 0, canvas.width, canvas.height);
  });

//Code to send drawn data to the server
function emitDrawData(data) {
  var sessionId = socket.id; 
  socket.emit('draw', data, sessionId);
  //console.log('Sent draw data:', data);
}
///RECIEVE BROADCAST MESSAGE
socket.on('draw', (data) => {
  // Handle incoming draw data
  switch (data.type) {
    case 'line':
      console.log('Recieved message to broadcast line data');
      drawLine1(data.x1,data.y1, data.x2, data.y2, false);
      break;
    case 'rectangle':
      console.log('Recieved message to broadcast rectangle data');
      drawRect(ctx,data.x1,data.y1,data.x2,data.y2,false);
      break;

    case 'circle':
      drawCircle(ctx,data.x1,data.y1,data.x2,data.y2,false);
      console.log('DrawCircle function called');
      break;

    case 'freeLine':
      drawLine(data.x1,data.y1,false);
      break;

    case 'eraser':
      drawEraser(data.x1,data.y1,false);
      break;

    case 'brush':
      drawBrush(data.x1,data.y1,false);
      break;

    case 'spray':
      drawSpray(data.x1,data.y1,false);
      break;

    case 'cursor':
      drawCursor(data.x1,data.y1,data.name,false);
      break;
    case 'applyText':
      console.log('emitting text data');
      applyText(ctx,data.x1,data.y1,data.text,data.size,data.font,false);
      break;
    case 'undo':
      console.log("performing undo op");
      undo(false);
      break;

    case 'redo':
      console.log("performing redo op");
      redo(false);
      break;
  
    default:
      console.log('Unknown shape type');
  }
  if(data.type != 'cursor')
  saveCanvasState();
});


function drawLine(x1, y1,emit) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x1, y1);
  ctx.strokeStyle = colorPicked;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
  x = x1;
  y = y1;

  if (emit){
    const lineData ={
    type : 'freeLine',
    x1 : x1,
    y1 : y1,
  };
  emitDrawData(lineData);
  }

  //saveCanvasState();
}

function drawEraser(x, y, emit) {
  ctx.beginPath();
  ctx.arc(x, y, eraserSize*2, 0, Math.PI * 2);
  ctx.fillStyle = 'white';
  ctx.fill();

  if(emit){
    const eraserData ={
    type : 'eraser',
    x1 : x,
    y1 : y,
  };
  emitDrawData(eraserData);
  }

  //saveCanvasState();
}

function drawBrush(x, y,emit) {
  // Implement brush logic here
  ctx.color = colorPicked;
  ctx.beginPath();
  ctx.moveTo(x, y);

  const stepSize = brushSize / 10; // Adjust step size for brush density
  for (let i = 0; i < brushSize * 2; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = brushSize * 0.5 + Math.random() * brushSize * 1;
    const xOffset = radius * Math.cos(angle);
    const yOffset = radius * Math.sin(angle);
    ctx.lineTo(x + xOffset, y + yOffset);
  }

  ctx.strokeStyle = colorPicked;
  ctx.lineWidth = brushSize;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round'; // Smoother corners
  ctx.globalAlpha = 0.8; // Adjust opacity
  
  ctx.stroke();
  ctx.globalAlpha = 1
  ctx.stroke();

  if (emit){
    const BrushData ={
    type : 'brush',
    x1 : x,
    y1 : y,
  };
  emitDrawData(BrushData);
  }

}

function drawSpray(x, y,emit) {
  console.log("Spraying..");
  const density = Math.random() * brushSize+50; // Adjust range as needed
  const radius = Math.random() * brushSize+10; // Adjust range as needed

  for (let i = 0; i < sprayDensity; i++) {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * radius;
    const size = Math.random() * 3 + 1; // Vary dot size
    const opacity = Math.random() * 0.5 + 0.5; // Vary opacity

    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance;

    ctx.beginPath();
    ctx.arc(x + dx, y + dy, size, 0, Math.PI * 2);
    ctx.fillStyle = colorPicked;
    ctx.globalAlpha = opacity;
    ctx.fill();
  }
  ctx.globalAlpha = 1; // Reset globalAlpha

  if (emit){
    const sprayData ={
    type : 'spray',
    x1 : x,
    y1 : y,
  };
  emitDrawData(sprayData);
  }
}
///// Set Buttons and their relevant activities
//BUTTON ACTIVITIES
{

const pencilButton = document.getElementById('pencil');
pencilButton.addEventListener('click', () => {
  tool = 'pencil';
  color= 'colorPicked';
});

const eraserButton = document.getElementById('eraser');
eraserButton.addEventListener('click', () => {
  tool = 'eraser';
  color = 'white';
});

const brushButton = document.getElementById('brush');
brushButton.addEventListener('click', () => {
  tool = 'brush';
  color= 'colorPicked';
});

const sprayButton = document.getElementById('spray');
sprayButton.addEventListener('click', () => {
  tool = 'spray';
  color ='colorPicked';
});

const lineButton = document.getElementById('line');
lineButton.addEventListener('click', () => {
  tool = 'line';
  color ='colorPicked';
});

const rectangleButton = document.getElementById('rectangle');
rectangleButton.addEventListener('click', () => {
  tool = 'rectangle';
  color ='colorPicked';
  console.log('Clicked on rectangle button');
});

const circleButton = document.getElementById('circle');
circleButton.addEventListener('click', () => {
  tool = 'circle';
  color ='colorPicked';
});

const clearButton = document.getElementById('clear');
clearButton.addEventListener('click', () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  undoStack = [];
  redoStack = [];
});

const undoButton = document.getElementById('undo');
undoButton.addEventListener('click', () => {
  undo(true);
});

const redoButton = document.getElementById('redo');
redoButton.addEventListener('click', () => {
   redo(true);
});

const textInput = document.getElementById('textInput');
textInput.addEventListener('input', () => {
canvasText =textInput.value;
});

/*const fontSizeSlider = document.getElementById('fontSizeSlider');
fontSizeSlider.addEventListener('input', () => {
textSize = fontSizeSlider.value;
});*/
const fontSizeSelect = document.getElementById('fontSizeSelect');
fontSizeSelect.addEventListener('change', () => {
  textSize = fontSizeSelect.value;
  console.log('Selected font size:', selectedFontSize);
});
const fontSelect = document.getElementById('fontSelect');
      const fonts = [
      'Arial', 'Times New Roman', 'Verdana', 'Helvetica', 'Courier New',
      'Georgia', 'Palatino', 'Garamond', 'Trebuchet MS', 'Tahoma',
      'Impact', 'Comic Sans MS', 'Lucida Sans Unicode', 'Lucida Sans',
      'Lucida Console', 'Monaco', 'Consolas', 'Andale Mono',
      'Arial Black', 'Book Antiqua', 'Century Gothic', 'Franklin Gothic Medium',
      'Gill Sans MT', 'Open Sans', 'Roboto', 'Montserrat', 'Poppins'
    ];
    fonts.forEach((font) => {
      const option = document.createElement('option');
      option.value = font;
      option.text = font;
      option.style.fontFamily = font;
      fontSelect.appendChild(option);
    });

    fontSelect.addEventListener('change', () => {
      textFont = fontSelect.value;
      console.log('Selected font:', textFont);
      
    });

const applyText = document.getElementById('applyText');
applyText.addEventListener('click', () => {
  console.log("Clicked on write text");
  tool = 'applyText';
  color ='colorPicked';
});


const sizeSlider = document.getElementById('sizeSlider');
sizeSlider.addEventListener('input', () => {
  lineWidth = sizeSlider.value;
  eraserSize = sizeSlider.value;
  brushSize = sizeSlider.value;
  sprayDensity = sizeSlider.value;
});

//end
}
///Implementing shape panel
 shapePanel = document.getElementById('shapePanel');
let selectedShape = '';

shapePanel.addEventListener('click', (e) => {
  selectedShape = e.target.id;
});

let shapeStartX, shapeStartY;

function drawShape(x, y,selectedShape) {
  switch (selectedShape) {
    case 'line':
      drawLine1(ctx,shapeStartX, shapeStartY, x, y,true);
      break;
    case 'rectangle':
      drawRect(ctx,shapeStartX, shapeStartY, x, y,true);
      break;
    case 'circle':
      drawCircle(ctx,shapeStartX, shapeStartY, x, y,true);
      break;
    case 'applyText':
      console.log("drawing write text");
      applyText(ctx,x, y,canvasText,textSize,textFont, true);
      break;
    default:
      break;
  }
}

function drawLine1(ctx,x1, y1, x2, y2, emit) {
    color = colorPicked;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    const diffX = x2 - x1;
    const diffY = y2 - y1;
    ctx.lineTo(x1 + diffX, y1 + diffY);
    ctx.strokeStyle = colorPicked; // Set the drawing color
    ctx.lineWidth = lineWidth;
    ctx.stroke();
     
  
  if(emit){
    const lineData = {
      type: 'line',
      x1: x1,
      y1: y1,
      x2: x2, 
      y2: y2, 
      color: colorPicked,
      lineWidth: lineWidth,
    };
    console.log('Emiting line data');
    emitDrawData(lineData);
  }
  
    
}

function drawRect(ctx,x1, y1, x2, y2,emit) {
  //console.log('Drawing rectangle - ',x1,y1,' ',x2,y2);
  color= colorPicked;
  const width = Math.abs(x2 - x1);
  const height = Math.abs(y2 - y1);
  const x = Math.min(x1, x2);
  const y = Math.min(y1, y2);

  ctx.beginPath();
  ctx.rect(x, y, width, height);
  ctx.strokeStyle = colorPicked;
  ctx.lineWidth = lineWidth;
  //ctx.fill= 'white';
  ctx.stroke();

    if(emit){
      const rectData = {
        type: 'rectangle',
        x1: x1,
        y1: y1, 
        x2: x2,
        y2: y2,
        color: colorPicked,
        lineWidth: lineWidth,
      };  
      console.log('Emiting rectangle ',x1,y1,' ',x1,y2);
      emitDrawData(rectData);
    }
}

function drawCircle(ctx,x1, y1, x2, y2,emit) {
    console.log('Drawing circle for co-ordinates ',x1,' ',y1,' ',x2,' ',y1,colorPicked);
    color= colorPicked;
    const radius = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    ctx.beginPath();
    ctx.arc(x1, y1, radius, 0, Math.PI * 2);
    ctx.strokeStyle = colorPicked;
    ctx.lineWidth = lineWidth;
    ctx.stroke();

    if(emit){
      var circleData = {
        type: 'circle',
        x1: x1,
        y1: y1, 
        x2: x2,
        y2: y2,
        radius: radius,
        color: colorPicked,
        lineWidth: lineWidth
      };
      
      emitDrawData(circleData);
      //emitCircle( x1, y1, radius, colorPicked );
    }

    //saveCanvasState();
}

function drawShapePreview(x, y, shapeType) {
    previewCtx.clearRect(0, 0, canvas.width, canvas.height); // Clear previous preview
    // Redraw other elements (if needed)
    switch (shapeType) {
      case 'line':
        drawLine1(previewCtx,shapeStartX, shapeStartY, x, y,false);

        break;
      case 'rectangle':
        drawRect(previewCtx,shapeStartX, shapeStartY, x, y,false);
        break;
      case 'circle':
        drawCircle(previewCtx,shapeStartX, shapeStartY, x, y,false);
        break;
      case 'applyText':
        applyText(previewCtx,x, y,canvasText,textSize,textFont,false);
        break;
      default:
        break;
    }
  }


//Color pane
const colorPicker = document.getElementById('colorPicker');
colorPicker.addEventListener('input', () => {
  colorPicked = colorPicker.value;
});


function applyText(ctx,x,y,canvasText,textSize,textFont,emit) {

  console.log("apply text function ", canvasText," ",textFont);

  const text = canvasText;
  ctx.font = `${textSize}px ${textFont}`;
  ctx.fillStyle = colorPicked;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);

  if(emit){
    const textData = {
      type : 'applyText',
      x1 : x,
      y1 : y,
      text: canvasText,
      size: textSize,
      font: textFont,
    };
    emitDrawData(textData);
  }

}