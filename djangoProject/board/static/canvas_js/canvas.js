var mouseDown = 0; // Zmienna potrzebna by erasy nie były bez kliknięcia
document.body.onmousedown = function () {
    ++mouseDown;
}
document.body.onmouseup = function () {
    --mouseDown;
}

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
    var h = document.documentElement.offsetHeight;
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
    canvas.getObjects().forEach(object => {
        lockObject(object, option);
    });
}

const endDrawingMode = (mode) => {
    if (mode === modes.drawing) {
        return
    } else {
        currentMode = ''
        canvas.isDrawingMode = false
        canvas.renderAll()
    }
}

const endMovindMode = (mode) => {
    if (mode === modes.move) {
        return
    } else {
        canObjectsMove = false
    }
}

const eraseHandler = (e) => {
    if (currentMode === modes.erase) {
        canvas.setCursor('default') // TODO i tak nie działa
        if (mouseDown) {
            canvas.remove(e.target)
        }
        canvas.requestRenderAll()
    }
}

const endErasingMode = (mode) => {
    if (mode === modes.erase) {
        return
    } else {
        console.log("ending erasing mode")
        canvas.setCursor('default')
        canvas.off('mouse:over', eraseHandler)
    }
}
const highlightButton = (mode) => {
    $('#mode-buttons').children().each(function () {
        var innerDivId = $(this).attr('id');
        console.log(innerDivId)
        if (innerDivId === mode) {
            $(this).addClass('active')
//            document.getElementById(innerDivId).focus();
//            document.getElementById(innerDivId).style.background('')
            console.log("Highlight - Kliknąłeś w: " + innerDivId)
        } else {
            $(this).removeClass('active')
            // document.getElementById(innerDivId).style.background='#F21314';
            console.log("Highlight - Nie kliknąłeś w: " + innerDivId);
        }
    });
}

const toggleMode = (mode) => {
    endDrawingMode(mode)
    endMovindMode(mode)
    endErasingMode(mode)
    highlightButton(mode)
    currentMode = mode
    if (mode === modes.pan) {
        lockAllObjects(true);
        canvas.renderAll()
    } else if (mode === modes.drawing) {
        canObjectsMove = false
        canvas.isDrawingMode = true
        canvas.renderAll()
    } else if (mode === modes.move) {
        lockAllObjects(false);
        canObjectsMove = true
    } else if (mode === modes.erase) {
        // TODO dodać kursor
        canvas.setCursor('grab')
        console.log("Erase mode on!\n");
        canvas.on("mouse:over", eraseHandler)
    }
}

// fabric.Object.prototype.controls.deleteControl = new fabric.Control({
//     x: 0.5,
//     y: -0.5,
//     offsetY: -16,
//     offsetX: 16,
//     cursorStyle: 'pointer',
//     mouseUpHandler: deleteObject,
//     render: renderIcon(deleteImg),
//     cornerSize: 24
// });

// function deleteObject(eventData, transform) {
//     var target = transform.target;
//     var canvas = target.canvas;
//         canvas.remove(target);
//     canvas.requestRenderAll();
// }


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
        console.log("Mouse down!")
        mousePressed = true;
        if (currentMode === modes.pan) {
            canvas.setCursor('grab')
            canvas.renderAll()
        } else if (currentMode === modes.erase) {
            console.log("Clicked during erase mode!")
            // canvas.remove(event.target) // TODO ogólnie to ta linijka sprawia, że po kliknięciu na obiekt jest usuwany.
            // canvas.requestRenderAll()                   // Jest to fajna opcja ale nie umiem zrobić tak, by kursor nie był typu 'change size' podczas
                                                           // najeżdżania. Może więc warto to usunąć
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
        delta /= 3 // Ta linijka zmniejsza tempo scrollowania
        var zoom = canvas.getZoom();
        zoom *= 0.97 ** delta;
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
// Jest git :) //
const setBrushSizeListener = () => {
    const brushSize = document.getElementById('brushSize')
    brushSize.addEventListener('change', (event) => {
        console.log("setBrushSizeListener" + event.target.value)
        canvas.freeDrawingBrush.width = parseInt(event.target.value, 10)
        canvas.requestRenderAll()
    })
}

const clearCanvas = (canvas, state) => {
    state.val = canvas.toJSON()
    canvas.getObjects().forEach((o) => {
        if (o !== canvas.backgroundImage) {
            canvas.remove(o)
        }
    })
}

const restoreCanvas = (canvas, state, bgUrl) => {
    if (state.val) {
        canvas.loadFromJSON(state.val)
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
        clearCanvas(canvas, JSONState)
        canvas.add(group.val)
        canvas.requestRenderAll()
    } else {
        group.val.destroy()
        let oldGroup = group.val.getObjects()
        clearCanvas(canvas, JSONState)
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
const JSONState = {}
let mousePressed = false
let color = '#000000'
const group = {}
const bgUrl = 'https://cdn.pixabay.com/photo/2017/03/17/19/37/sky-2152463_960_720.jpg'

let currentMode;

const modes = {
    pan: 'pan',
    drawing: 'drawing',
    move: 'move',
    erase: 'erase'
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