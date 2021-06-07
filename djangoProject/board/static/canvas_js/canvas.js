const boardPK = JSON.parse(document.getElementById('board-pk').textContent);
const username = JSON.parse(document.getElementById("username").textContent);

console.log("boardPK = " + boardPK)
console.log("username = " + username)

const boardSocket = new WebSocket(
    'ws://'
    + window.location.host
    + '/ws/board/'
    + boardPK
    + '/'
);


// const emitAdd = (obj) => {
//     console.log("emitAdd: Sending obj ")
//     console.log(obj)
//     // we include the name of the event we're emitting, and a data object
//     boardSocket.send(JSON.stringify({
//         'data_json': obj,
//         'data_type': 'object-added'
//     }))
// }
// const emitModify = (obj) => {
//     console.log("emitModify: Sending obj ")
//     console.log(obj)
//     // we include the name of the event we're emitting, and a data object
//     boardSocket.send(JSON.stringify({
//         'data_json': obj,
//         'data_type': 'object-modified'
//     }))
// }

// Ogarnianie websocketów.

let pointer;        // Zmienna przechowująca aktualne współrzędne kursora
var mouseDown = 0; // Zmienna potrzebna by erasy nie były bez kliknięcia
document.body.onmousedown = function () {
    ++mouseDown;
}
document.body.onmouseup = function () {
    --mouseDown;
}

// Funkcje wywoływane przy załadowaniu canvasa
const initCanvas = (id) => {
    var sizes = document.getElementById('canvas-content');

    var w = sizes.clientWidth;
    var h = sizes.offsetHeight;


    console.log("Expected width " + w + " Expected height " + h);
    return new fabric.Canvas(id, {
        width: w,
        height: h,
        selection: false
    });
}

const setCanvasSize = () => {
    var sizes = document.getElementById('canvas-content');

    var w = sizes.clientWidth;
    var h = sizes.clientHeight;

    canvas.setDimensions({
        width: w,
        height: h,
    });

    canvas.renderAll();

    console.log("Expected width " + w + " Expected height " + h);
}

const setBackground = (url, canvas) => {
    fabric.Image.fromURL(url, (img) => {
        canvas.backgroundColor = 'white'
        canvas.backgroundImage = img
        canvas.renderAll()
    }, {crossOrigin: "Anonymous"})
}

// Blokowanie obiektów w czasie przesuwania całego canvasa (move pan)
const lockObject = (object, option) => {
    object.lockMovementX = object.lockMovementY = option;
    object.hasBorders = object.hasControls = !option;
}

const lockAddedObjectListener = (e) => {
    lockObject(e.target, true);
}
const lockAllObjects = (option) => {
    canvas.getObjects().forEach(object => {
        lockObject(object, option);
    });

    if (option) {
        canvas.on('object:added', lockAddedObjectListener)
    } else {
        canvas.off('object:added', lockAddedObjectListener)
    }
}

// Wywoływane funkcje które kończą każdy z trybów
// wywoływane przez toggleMode
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

// Ustawia podświetlanie ostatnio klikniętego guzika
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

// Ustawia nowy tryb,
// wywoływane przez używtkownika w board_detail.html
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

class KatexTextbox extends fabric.Textbox {

}

/*canvas.selectionColor = 'rgba(0,255,0,0.3)';
canvas.selectionBorderColor = 'red';
canvas.selectionLineWidth = 5;*/

// Obsługa myszki
const setPanEvents = (canvas) => {
    canvas.on('mouse:move', (event) => {
        // console.log(event)
        pointer = canvas.getPointer(event.e);
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

        /*if (currentMode === modes.move) {
            console.log("Move!");

            canvas.discardActiveObject();
            var sel = new fabric.ActiveSelection(canvas.getObjects(), {
              canvas: canvas,
            });
            canvas.setActiveObject(sel);
            canvas.requestRenderAll();
            /!*if (!canvas.getActiveObject()) {
                console.log("Pierwszy if")
                return;
            }
            if (canvas.getActiveObject().type !== 'activeSelection') {
                console.log("Drugi if")
                return;
            }
            console.log("Żodyn if")
            canvas.getActiveObject().toGroup();
            canvas.requestRenderAll();*!/
        } else*/ if (currentMode === modes.pan) {
            canvas.setCursor('grab')
            canvas.renderAll()
        } else if (currentMode === modes.erase) {
            console.log("Clicked during erase mode!")
            canvas.remove(event.target)
            // TODO ogólnie to ta linijka sprawia, że po kliknięciu na obiekt jest usuwany.
            // canvas.requestRenderAll()
            // Jest to fajna opcja ale nie umiem zrobić tak, by kursor nie był typu 'change size' podczas
            // najeżdżania. Może więc warto to usunąć
        } else if (currentMode === modes.rectangle) {
            console.log("Create rectangle!")
            createRect(canvas)
        } else if (currentMode === modes.circle) {
            console.log("Create circle!")
            createCirc(canvas)
        } else if (currentMode === modes.text) {
            console.log("Create textbox!")
            createTextbox(canvas)
        } else if (currentMode === modes.katex) {
	    console.log("Create Katex!")
	    createKatex(canvas, pointer.x, pointer.y) 
	}
    })
    canvas.on('mouse:up', (event) => {
        mousePressed = false
        canvas.setCursor('default')
        canvas.renderAll()

        console.log("Move!")
        if (currentMode === modes.move) {
            if (!canvas.getActiveObject()) {
                console.log("Pierwszy if")
                return;
            }
            if (canvas.getActiveObject().type !== 'activeSelection') {
                console.log("Drugi if")
                return;
            }
            console.log("Żodyn if")
            canvas.getActiveObject().toGroup();
            canvas.requestRenderAll();
        }
    })
    // zoom in and out of canvas
    canvas.on('mouse:wheel', (event) => {
        console.log("scrollowanko");
        var delta = event.e.deltaY;
        delta /= 3 // Ta linijka zmniejsza tempo scrollowania
        var zoom = canvas.getZoom();
        zoom *= 0.97 ** delta;
        if (zoom > 20) zoom = 20;
        if (zoom < 0.01) zoom = 0.01;
        canvas.zoomToPoint({x: event.e.offsetX, y: event.e.offsetY}, zoom);
        event.e.preventDefault();
        event.e.stopPropagation();
        canvas.renderAll();
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
    state.val = canvas.toJSON(propertiesToInclude)
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

// Funkcje wywoływane, kiedy user wybierze, że chce coś dodać na canvasie
const changeRectMode = () => {
    currentMode = modes.rectangle
}

const changeCircMode = () => {
    currentMode = modes.circle
}

const changeTextMode = () => {
    currentMode = modes.text
}

const changeKatexMode = () => {
    currentMode = modes.katex
}

// Fukncje wywoływane, kiedy user kliknie gdzieś na canvasie, kiedy chce coś dodać
const createRect = (canvas, left = pointer.x, top = pointer.y) => {
    console.log("rect")

    const canvCenter = canvas.getCenter()
    rect = new fabric.Rect({
        width: 100,
        height: 100,
        fill: 'green',
        //left: canvCenter.left,
        left: left,
        // top: canvCenter.top,
        top: top,
        originX: 'center',
        originY: 'center',
        cornerColor: 'white'
    })
    canvas.add(rect)
    canvas.renderAll()
    toggleMode(modes.move)
}

const createCirc = (canvas, left = pointer.x, top = pointer.y) => {
    console.log("circ")
    const canvCenter = canvas.getCenter()
    circle = new fabric.Circle({
        radius: 50,
        fill: 'orange',
        //left: canvCenter.left,
        left: left,
        // top: canvCenter.top,
        top: top,
        originX: 'center',
        originY: 'center',
        cornerColor: 'white'
    })
    canvas.add(circle)
    canvas.renderAll()
    toggleMode(modes.move)
}

const createKatex = (canvas, left = pointer.x, top = pointer.y) => {
    console.log("katex")
    const canvCenter = canvas.getCenter()
    katex = new	KatexTextbox('KaTeX textbox', {
	    left: left,
	    top: top,
	    width: 100,
	    height: 100,
	    originX: 'center',
	    originY: 'center',
	    fill: '#000000'
    })
    canvas.add(katex)
    canvas.renderAll()
    toggleMode(modes.move)
}

const createTextbox = (canvas, text = 'Type here', left = pointer.x, top = pointer.y) => {
    console.log("text")
    const canvCenter = canvas.getCenter()
    textbox = new fabric.Textbox(text, {
        //left: canvCenter.left,
        left: left,
        // top: canvCenter.top,
        top: top,
        width: 100,
        height: 100,
        originX: 'center',
        originY: 'center',
        fill: '#000000'
    })
    canvas.add(textbox)
    canvas.renderAll()
    toggleMode(modes.move)
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
    file = inputElem.files[0];
    file.crossOrigin = "anonymous"
    reader.readAsDataURL(file)
}

const operationTypes = {
    modify: 'M', add: 'A', remove: 'R'
}

document.addEventListener('keydown', function (e) {
    console.log("You pressed" + e.key);
    if (e.ctrlKey && e.key === 'z') {
        undo()
        console.log("ctrl z pressed!\n");
    } else if (e.ctrlKey && e.key === 'y') {
        console.log("ctrl y pressed!\n")
        redo();
    }
})

document.addEventListener('paste', (event) => {
    var items = (event.clipboardData  || event.originalEvent.clipboardData).items;
    console.log(JSON.stringify(items));
    // find pasted image among pasted items
    var blob = null;
    for (var i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") === 0) {
            blob = items[i].getAsFile();
        }
    }
    // load image if there is a pasted image
    if (blob !== null) {
        reader.onload = function(event) {
            console.log(event.target.result); // data url!
        };
        reader.readAsDataURL(blob);
    }
    else {
        let text = (event.clipboardData || window.clipboardData).getData(event.clipboardData.items[0].type);
        createTextbox(canvas, text);
    }

    event.preventDefault();
});

const changeEmptyBackground = () => {
	console.log("empty");
	canvas.backgroundColor = 0;
	canvas.renderAll();
}

const changeLinesBackground = () => {
	console.log("lines");
	canvas.setBackgroundColor({ source: 'https://img.pngio.com/png-lined-paper-transparent-lined-paperpng-images-pluspng-notebook-paper-template-png-420_315.png', repeat: 'repeat'}, function() {canvas.renderAll();});
}

const changeCheckeredBackground = () => {
	console.log("checkered");
	canvas.setBackgroundColor({ source: 'https://media.istockphoto.com/vectors/checkered-notebook-paper-vector-seamless-pattern-vector-id838296134', repeat: 'repeat'}, function() {canvas.renderAll();});

	canvas.renderAll();
}


    function tex(text, callback) {
        // Create a script element with the LaTeX code
        var div = document.createElement("div");
        div.style.position = "absolute";
        div.style.left = "-1000px";
        document.body.appendChild(div);
        var se = document.createElement("script");
        se.setAttribute("type", "math/tex");
        se.innerHTML = text;
        div.appendChild(se);
        MathJax.Hub.Process(se, function() {
            // When processing is done, remove from the DOM
            // Wait some time before doing tht because MathJax calls this function before
            // actually displaying the output
            var display = function() {
                // Get the frame where the current Math is displayed
                var frame = document.getElementById(se.id + "-Frame");
                if(!frame) {
		    setTimeout(display, 500);
                    return;
                }

                // Load the SVG
                var svg = frame.getElementsByTagName("svg")[0];
                svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
                svg.setAttribute("version", "1.1");
                var height = svg.parentNode.offsetHeight;
                var width = svg.parentNode.offsetWidth;
                svg.setAttribute("height", height);
                svg.setAttribute("width", width);
                svg.removeAttribute("style");

                // Embed the global MathJAX elements to it
                var mathJaxGlobal = document.getElementById("MathJax_SVG_glyphs");
                svg.appendChild(mathJaxGlobal.cloneNode(true));

                // Create a data URL
                var svgSource = '<?xml version="1.0" encoding="UTF-8"?>' + "\n" + '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">' + "\n" + svg.outerHTML;
                var retval = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgSource)));


                // Remove the temporary elements
                document.body.removeChild(div);

                // Invoke the user callback
                callback(retval, width, height);
            };
		setTimeout(display, 1000);
        });
    }



const loadLatex = (latexSource) => {
	console.log("latex source: " + latexSource)
	tex(latexSource, function(svg, width, height) {
          fabric.Image.fromURL(svg, function(img) {
              img.height = height;
              img.width = width;
              canvas.add(img);
          },
              {crossOrigin: "Anonymous"});
      });
}

const canvas = initCanvas('canvas')

const JSONState = {}
let mousePressed = false
let color = '#000000'
const group = {}
const bgUrl = 'https://cdn.pixabay.com/photo/2017/03/17/19/37/sky-2152463_960_720.jpg'

let currentMode;

const propertiesToInclude = ['id', 'removed']

const eventTypes = {
    added: 'object-added',
    removed: 'object-removed',
    modified: 'object-modified',
}


const modes = {
    pan: 'pan',
    drawing: 'drawing',
    move: 'move',
    erase: 'erase',
    text: 'text',
    rectangle: 'rectangle',
    circle: 'circle',
    katex: 'katex'
}
toggleMode(modes.move) // default mode

const reader = new FileReader()

const objToVersion = new Map();

function checkVersion(obj) {
    if (!obj) {
        return false;
    }
    if (!objToVersion.has(obj.id)) {
        return true;
    }
    let version = objToVersion.get(obj.id);
    console.log("do cofania");
    console.log(obj);
//    return obj.owner == username && obj.owner == version[0] && obj.generation == version[1];
    let oldObj = getObjectFromId(canvas, obj.id);
    if (oldObj === null) {
        return true;
    }
    return Math.abs(obj.generation - oldObj.generation) < 2 && oldObj.owner == username;
}

function setVersion(obj) {
    // let last = -1;
    // if (objToVersion.has(obj.id)) {
    //     last = objToVersion.get(obj.id)[1];
    // }
    // if (last < obj.generation) {
        objToVersion.set(obj.id, [obj.owner, obj.generation]);
    // }
}

class EraseCommand {
    constructor(target) {
        this.target = target
        this.type = operationTypes.remove
    }

    undo(canvas) {
        if (!checkVersion)
        canvas.add(this.target)
        canvas.requestRenderAll()
    }

    execute(canvas) {
        canvas.remove(this.target)
        canvas.requestRenderAll()
    }
}

class AddCommand {
    constructor(target) {
        this.target = target
        this.type = operationTypes.add
    }

    undo(canvas) {
        canvas.remove(this.target)
        canvas.requestRenderAll()
    }

    execute(canvas) {
        canvas.add(this.target)
        canvas.requestRenderAll()
    }
}

class ModifyCommand {
    constructor(target) {
        this.target = target
        this.type = operationTypes.modify
    }

    undo(canvas) {
//        canvas.modify(this.target)
        let oldObj = getObjectFromId(canvas, this.target.id);
        console.log("witam witam");
        console.log(this.target);
        console.log(oldObj);
        console.log("zegnam zegnam");
        Object.assign(oldObj, this.target);
        console.log("teraz");
        console.log(oldObj);
        console.log(canvas.getObjects());
        this.target = oldObj;
        onModify(this);
        canvas.requestRenderAll();
    }

    execute(canvas) {
//        canvas.modify(this.target)
        console.log("gotow?");
        console.log(this.target);
        console.log(canvas.getObjects());
        let oldObj = getObjectFromId(canvas, this.target.id);
        if (this.target === null) {
            console.log("jam jest problem");
        }
        if (oldObj === null) {
            console.log("jam");
        }
        Object.assign(oldObj, this.target);
        this.target = oldObj;
        onModify(this);
        canvas.requestRenderAll()
    }
}

var undo_stack = []
var redo_stack = []
var is_redoing = false
var should_push = true
/*
function exportToPNG() {
	document.getElementById("canvas").toBlob(function(blob) {
		saveAs(blob, "my_canvas.png");
	});
}
*/
function undo() {
    let op = null;
    if (undo_stack.length === 0) {
        return;
    }
    while (undo_stack.length !== 0) {
        op = undo_stack.pop();
        if (checkVersion(op.target)) {
            break;
        }
    }
    if (!checkVersion(op.target)) {
        return;
    }
    console.log(undo_stack);
    if (op.type == operationTypes.modify) {
        let newObj = Object.assign({}, copies.get(op.target.id));
        redo_stack.push(new ModifyCommand(newObj));
    }
    else {
        redo_stack.push(op)
    }
    should_push = false
    op.undo(canvas)
    should_push = true

}

function redo() {
    is_redoing = true
    if (redo_stack.length === 0)
        return
    let op = null;
    while (redo_stack.length !== 0) {
        op = redo_stack.pop();
        if (checkVersion(op.target)) {
            break;
        }
    }
    if (!checkVersion(op.target)) {
        return;
    }

    op.execute(canvas)
}

function getObjectFromId(ctx, id) {
    console.log("getObjectsFromID" + id)
    console.log("ctx.getObjects")
    console.log(ctx.getObjects())
    var currentObjects = ctx.getObjects();
    for (var i = currentObjects.length - 1; i >= 0; i--) {
        if (currentObjects[i].id === id)
            return currentObjects[i]
    }
    return null
}

const currAdd = new Set();

function Board_OnSync(_canvas, obj) {
    var existing = getObjectFromId(_canvas, obj.id);
    console.log("Board on Sync: " + existing);

    if (obj.removed) {
        if (existing) {
            _canvas.remove(existing);
            _canvas.renderAll();
        }
        return;
    }
    if (existing && !existing.removed) {
        if (currAdd.has(existing.id)) {
            currAdd.delete(existing.id);
        }
        else {
            Object.assign(existing, obj);
            onModify(new ModifyCommand(existing), false);
            return;
        }
    }

    if (existing) {
        existing.set(obj);
    } else {
        // _canvas.add(obj.fromJSON())
        enliven(_canvas, obj)
    }
    _canvas.renderAll();
}

// Make the function wait until the connection is made...
function waitForSocketConnection(socket, callback) {
    setTimeout(
        function () {
            if (socket.readyState === 1) {
                console.log("Connection is made")
                if (callback != null) {
                    callback();
                }
            } else {
                console.log("wait for connection...")
                waitForSocketConnection(socket, callback);
            }

        }, 5); // wait 5 milisecond for the connection...
}

function sendMsg(msg) {
    waitForSocketConnection(boardSocket, () => {
        boardSocket.send(msg)
    })
}

function sendObjectToGroup(obj, type) {
    console.log("sendObjectToGroup: " + type + " obj: " + obj)
    console.log(obj)
    sendMsg(JSON.stringify({
        'data_json': obj,
        'data_type': type,
    }))
}

function getUser(s) {
    var n = s.indexOf("-");
    return s.substring(n + 1);
}

const copies = new Map();

canvas.on("object:added", (e) => {
    console.log("OBJECT ADDED: ", e.target)
    if (e.target) {
        var obj = e.target
        obj.set('removed', false) // Nie jest usunięty
        obj.toJSON = (function (toJSON) {
            return function () {
                console.log("New to json called!")
                return fabric.util.object.extend(toJSON.call(this), {
                    id: this.id,
                    removed: this.removed,
                    owner: this.owner,
                    generation: this.generation,
                    oldId: this.oldId,
                });
            };
        })(obj.toJSON);

        if (!obj.id) {
            // Object was created by us
            if (obj.oldid == undefined) {
                obj.set('id', Date.now() + '-' + username);
            }
            else {
                obj.set('id', obj.oldid);
            }
            obj.set('owner', username);
            obj.set('generation', 0);
            setVersion(obj);
            currAdd.add(obj.id);
            sendObjectToGroup(obj, eventTypes.added);
        }
        setVersion(obj);
        let newObj = Object.assign({}, obj);
        copies.set(newObj.id, newObj);
    }
    console.log("OBJECT ADDED: ", e.target)

//    IMPLEMENTACJA CTRL Z
     console.log("object added id = " + obj.id)
    if (should_push && username.localeCompare(getUser(obj.id)) == 0) {
        if (!is_redoing) {
            redo_stack = []
        }
        is_redoing = false
        undo_stack.push(new AddCommand(obj))
    }
})

function onModify(e, first=true) {
    console.log("hejka stulejka");
    if (e.target) {
        console.log("ojej");
        console.log("itam")
        var obj = e.target;
        if (obj.removed) {
            return;
        }
        let oldObj = getObjectFromId(canvas, obj.id);
        if (oldObj && !oldObj.removed) {
            if (oldObj === obj && first) {
                if (obj.owner != username) {
                    obj.owner = username;
                    obj.generation++;
                }
                currAdd.add(obj.id);
                sendObjectToGroup(obj, eventTypes.modified);
            }
            else {
                Object.assign(oldObj, obj);
            }
        }
        setVersion(obj);
        let oldVer = copies.get(obj.id);
        if (should_push && obj.owner == username) {
            if (!is_redoing) {
                redo_stack = [];
            }
            is_redoing = false;
            let newObj = Object.assign({}, oldVer);
            console.log("witam");
            console.log(newObj);
            console.log("zegnam");
            undo_stack.push(new ModifyCommand(newObj));
        }
        Object.assign(oldVer, obj);
        obj.setCoords();
        canvas.requestRenderAll();
        canvas.renderAll();
        console.log("nowa wersja");
        console.log(oldVer);
        console.log(undo_stack);


        // obj.set('removed', true);
        // obj.toJSON = (function (toJSON) {
        //     return function () {
        //         return fabric.util.object.extend(toJSON.call(this), {
        //             id: this.id,
        //             uid: this.uid,
        //             removed: this.removed
        //         });
        //     };
        // })(obj.toJSON);

        // sendObjectToGroup(obj, eventTypes.removed);

        // obj.set('removed', false);
        // obj.set('id', Date.now() + '-' + username);
        // obj.toJSON = (function (toJSON) {
        //     return function () {
        //         return fabric.util.object.extend(toJSON.call(this), {
        //             id: this.id,
        //         });
        //     };
        // })(obj.toJSON);
        // sendObjectToGroup(obj, eventTypes.added);
    }
}

canvas.on("object:modified", onModify)

canvas.on("object:removed", e => {
    if (e.target) {
        var obj = e.target;
        console.log("witam witam");
        if (should_push && username.localeCompare(getUser(obj.id)) == 0) {
            console.log("siema siema");
            if (!is_redoing) {
                redo_stack = []
            }
            is_redoing = false
            undo_stack.push(new EraseCommand(e.target))
        }
        copies.delete(obj.id);
        if (obj.removed) {
            setVersion(obj);
            return; //Object already removed
        }

        obj.set('removed', true);
        if (obj.owner != username) {
            obj.owner = username;
            obj.generation++;
        }
        setVersion(obj);

        sendObjectToGroup(obj, eventTypes.removed);
        obj.set('oldid', obj.id);
        obj.set('id', null);
    }
})

canvas.on('text:changed', function(e) {
	var obj = e.target;
	if(obj instanceof KatexTextbox) {
		console.log("KATEX TEXT CHANGED");
	//	obj.set('text', katex.renderToString("c = \\pm\\sqrt{a^2 + b^2}", { displayMode: true }));
	//	canvas.renderAll();
	}
	else {
		console.log("NOT KATEXT TEXT CHANGED");
	}
});

setColorListener()
setBrushSizeListener()
setBackground(bgUrl, canvas)
setPanEvents(canvas)
window.addEventListener("resize", setCanvasSize);

const inputFile = document.getElementById('myImg');
inputFile.addEventListener('change', imgAdded)

reader.addEventListener("load", () => {
    fabric.Image.fromURL(reader.result, img => {
        img.top = pointer.y;
        img.left = pointer.x;
        canvas.add(img)
        canvas.requestRenderAll()
    },
        {crossOrigin: "Anonymous"})
})

function enliven(_canvas, obj) {
    fabric.util.enlivenObjects([obj], function (objects) {
        var origRenderOnAddRemove = _canvas.renderOnAddRemove;
        _canvas.renderOnAddRemove = false;

        objects.forEach(function (o) {
            _canvas.add(o);
        });

        _canvas.renderOnAddRemove = origRenderOnAddRemove;
        _canvas.renderAll();
    });
}

boardSocket.onmessage = function (e) {
    const event = JSON.parse(e.data);
    const type = event.data_type
    const data_json = JSON.parse(event.data_json)
    console.log("on message " + type + " " + data_json)
    Board_OnSync(canvas, data_json)
}

// Zaznaczanie grupy obiektów

var group_objects = $('group_objects'),
      ungroup = $('ungroup'),
      multiselect = $('multiselect'),
      addmore = $('addmore'),
      discard = $('discard');


      multiselect.onclick = function() {
        canvas.discardActiveObject();
        var sel = new fabric.ActiveSelection(canvas.getObjects(), {
          canvas: canvas,
        });
        canvas.setActiveObject(sel);
        canvas.requestRenderAll();
      }

      group_objects.onclick = function() {
        if (!canvas.getActiveObject()) {
          return;
        }
        if (canvas.getActiveObject().type !== 'activeSelection') {
          return;
        }
        canvas.getActiveObject().toGroup();
        canvas.requestRenderAll();
      }

      ungroup.onclick = function() {
        if (!canvas.getActiveObject()) {
          return;
        }
        if (canvas.getActiveObject().type !== 'group') {
          return;
        }
        canvas.getActiveObject().toActiveSelection();
        canvas.requestRenderAll();
      }

      discard.onclick = function() {
        canvas.discardActiveObject();
        canvas.requestRenderAll();
      }

