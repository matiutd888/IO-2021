const initCanvas = (id) => {
    var w = document.documentElement.clientWidth;
    var h = document.documentElement.clientHeight;
    return new fabric.Canvas(id, {
        width: w,
        height: h - 150,
        selection: false
    });
}

setCanvasSize = () => {
    var w = document.documentElement.clientWidth;
    var h = document.documentElement.clientHeight;
    canvas.setDimensions({
	width: w,
	height: h - 150
    });
    canvas.renderAll();
    console.log("Expected width " + w + " Expected height " + h);
}


const setBackground = (url, canvas) => {
    fabric.Image.fromURL(url, (img) => {
        canvas.backgroundImage = img
        canvas.renderAll()
    })
}


const lockObject = (object, option) => {
	object.lockMovementX = object.lockMovementY = option;
	object.hasBorders = object.hasControls = !option;
}

const lockAllObjects = (option) => {
	canvas.getObjects().forEach(object => { lockObject(object, option); });
}

const toggleMode = (mode) => {
    if (mode === modes.pan) {
        if (currentMode === modes.pan) {
            currentMode = ''
        } else {
	    lockAllObjects(true);
	    canObjectsMove = false
            currentMode = modes.pan
            canvas.isDrawingMode = false
            canvas.renderAll()
        }
    } else if (mode === modes.drawing) {
        if (currentMode === modes.drawing) {
            currentMode = ''
            canvas.isDrawingMode = false
            canvas.renderAll()
        } else {
	    canObjectsMove = false
            currentMode = modes.drawing
            canvas.isDrawingMode = true
            canvas.renderAll()
        }      
    } else if (mode === modes.move) {
	if (currentMode == modes.move) {
	    currentMode = ''
	} else {
	    lockAllObjects(false);
	    canObjectsMove = true
	    currentMode = modes.move
	    canvas.isDrawingMode = false
	    
	}
    }
}

const setPanEvents = (canvas) => {
    canvas.on('mouse:move', (event) => {
        // console.log(event)
        if (mousePressed && currentMode === modes.pan) {
            canvas.setCursor('grab')
            canvas.renderAll()
            const mEvent = event.e
            const delta = new fabric.Point(mEvent.movementX, mEvent.movementY)
            canvas.relativePan(delta)
        }
    })
    // keep track of mouse down/up
    canvas.on('mouse:down', (event) => {
        mousePressed = true;
        if (currentMode === modes.pan) {
            canvas.setCursor('grab')
            canvas.renderAll()
        }
    })
    canvas.on('mouse:up', (event) => {
        mousePressed = false
        canvas.setCursor('default')
        canvas.renderAll()
    })
    // zoom in and out of canvas
    canvas.on('mouse:wheel', (event) => {
	var delta = event.e.deltaY;
	var zoom = canvas.getZoom();
	zoom *= 0.999 ** delta;
	if (zoom > 20) zoom = 20;
	if (zoom < 0.01) zoom = 0.01;
	canvas.setZoom(zoom);
	event.e.preventDefault();
	event.e.stopPropagation();
    })
}


const setColorListener = () => {
    const picker = document.getElementById('colorPicker')
    picker.addEventListener('change', (event) => {
        console.log("setColorListener " + event.target.value)
        canvas.freeDrawingBrush.color = event.target.value
        canvas.requestRenderAll()
    })
}

// Moze jakos inaczej nazwac ten event - nie znam konwencji :/
const setBrushSizeListener = () => {
     const brushSize = document.getElementById('brushSize')
     brushSize.addEventListener('change', (event) => {
        console.log("setBrushSizeListener" + event.target.value)
        canvas.freeDrawingBrush.width = parseInt(event.target.value, 10)
	canvas.requestRenderAll()
     })
}

const clearCanvas = (canvas, state) => {
    state.val = canvas.toSVG()
    canvas.getObjects().forEach((o) => {
        if(o !== canvas.backgroundImage) {
            canvas.remove(o)
        }
    })
}

const restoreCanvas = (canvas, state, bgUrl) => {
    if (state.val) {
        fabric.loadSVGFromString(state.val, objects => {
            console.log(objects)
            objects = objects.filter(o => o['xlink:href'] !== bgUrl)
            canvas.add(...objects)
            canvas.requestRenderAll()
        })
    }
}



const createRect = (canvas) => {
    console.log("rect")
    const canvCenter = canvas.getCenter()
    rect = new fabric.Rect({
        width: 100,
        height: 100,
        fill: 'green',
        left: canvCenter.left,
        top: canvCenter.top,
        originX: 'center',
        originY: 'center',
        cornerColor: 'white'
    })
    canvas.add(rect)
    
    // rect.animate('top', canvCenter.top, {
    //     onChange: canvas.renderAll.bind(canvas)
    // });
    rect.on('selected', () => {
        rect.set('fill', 'white')
        canvas.renderAll()
    })
    rect.on('deselected', () => {
        rect.set('fill', 'green')
        canvas.renderAll()
    })
    // canvas.renderAll();
}

const createCirc = (canvas) => {
    console.log("circ")
    const canvCenter = canvas.getCenter()
    circle = new fabric.Circle({
        radius: 50,
        fill: 'orange',
        left: canvCenter.left,
        top: canvCenter.top,
        originX: 'center',
        originY: 'center',
        cornerColor: 'white'
    })
    canvas.add(circle)
    canvas.renderAll()
    circle.on('selected', () => {
        circle.set('fill', 'white')
        canvas.requestRenderAll()
    })
    circle.on('deselected', () => {
        circle.set('fill', 'orange')
        canvas.requestRenderAll()
    })
}

const groupObjects = (canvas, group, shouldGroup) => {
    if (shouldGroup) {
        const objects = canvas.getObjects()
        group.val = new fabric.Group(objects, {cornerColor: 'white'})
        clearCanvas(canvas, svgState)
        canvas.add(group.val)
        canvas.requestRenderAll()
    } else {
        group.val.destroy()
        let oldGroup = group.val.getObjects()
        clearCanvas(canvas, svgState)
        canvas.add(...oldGroup)
        group.val = null
        canvas.requestRenderAll()
    }
}

const imgAdded = (e) => {
    console.log(e)
    const inputElem = document.getElementById('myImg')
    const file = inputElem.files[0];
    reader.readAsDataURL(file)
}



const canvas = initCanvas('canvas')
const svgState = {}
let mousePressed = false
let color = '#000000'
const group = {}
const bgUrl = 'https://cdn.pixabay.com/photo/2017/03/17/19/37/sky-2152463_960_720.jpg'

let currentMode;

const modes = {
    pan: 'pan',
    drawing: 'drawing',
    move: 'move'
}
const reader = new FileReader()

setColorListener()
setBrushSizeListener()
setBackground(bgUrl, canvas)
setPanEvents(canvas)
window.addEventListener("resize", setCanvasSize);

const inputFile = document.getElementById('myImg');
inputFile.addEventListener('change', imgAdded)

reader.addEventListener("load", () => {
    fabric.Image.fromURL(reader.result, img => {
        canvas.add(img)
        canvas.requestRenderAll()
    })
})

