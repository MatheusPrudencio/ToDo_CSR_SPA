"use strict";

const express = require('express');
const path = require('path');
const fs = require('fs');
const process = require('process');
const bodyParser = require('body-parser');

const STATIC_DIR = path.join(__dirname, 'static');
const TODO_FILE = 'todos.json';
const TOAST_LIB_ROOT = path.join(__dirname, 'node_modules', 
    'jquery-toast-plugin', 'dist');

// in-memory model
let toDoObjects = [];

/**
 * Load the in-memory from disk
 */
function loadFile() {
    fs.readFile(TODO_FILE, (err, data) => {
        if (err) throw err;
        
        toDoObjects = JSON.parse(data);
        console.log(`Data file ${TODO_FILE} loaded successfully`);
    });
}

/**
 * Save the in-memory model to disk
 */
function saveFile() {
    console.log('Saving data to the file system...');
    fs.writeFileSync(TODO_FILE, JSON.stringify(toDoObjects));
    console.log('Finished saving data');
}


let app = express();

/**
 * In-memory model is loaded from disk when the server starts
 */
app.listen(3000, () => {
    console.log('ToDo! server listening on port 3000!');
    loadFile();
});

/**
 * static routes
 */
app.use('/', express.static(STATIC_DIR));
app.use('/lib/toast', express.static(TOAST_LIB_ROOT));


/**
 * Return all todo items as JSON
 */
app.get('/todos', (req, res) => {
    res.json(toDoObjects);
});

app.use(bodyParser.urlencoded({extended: true}));

/**
 * Insert a new todo item in the in-memory model
 */
app.post('/todo', (req, res) => {
    if (req.body.description == undefined || req.body.tags == undefined)
        res.json({status: 'failed'});
    else {
        toDoObjects.push(req.body);
        res.json({status: 'ok'});
    }
});

// Nesta rota é removido 1 id solicitado
app.post('/remove', (req, res) => {
    let id = req.body;
    toDoObjects = toDoObjects.filter( (toDo)=> {
        return toDo['id'] != id.id;
    });
    res.json({status: 'ok'});
});

// Allways a error is throw this route as called
app.use((error,req, res, next) =>{
    res.sendFile(STATIC_DIR + path.sep + 'error.html');
});

// If the user try to access an existing url static  html response will be send
app.use((req, res) =>{
    res.sendFile(STATIC_DIR + path.sep + 'not_found.html');
});

/**
 * Operating system signal handling
 * Makes the im-memory model be saved o disk when
 * server is interrupted via CTRL+C
 */
process.on('exit', (code) => {
    console.log(`Server exiting with code ${code}`);
    saveFile();
});

let exitHandler = (code) => {
    process.exit();
}

// XXX: does not work with nodemon, discover which signal nodemon is sending
process.on('SIGINT', exitHandler);
