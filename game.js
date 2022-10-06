const canvas = document.querySelector('#game');//llamamos a el div canvas de html
const game = canvas.getContext('2d'); //le decimos que solo que a tener 2 dimenciones x,y
const btnUp = document.querySelector('#up')
const btnLeft = document.querySelector('#left')
const btnRight = document.querySelector('#right')
const btnDown = document.querySelector('#down')
const spanLives = document.querySelector('#lives')
const spanTime = document.querySelector('#Time')
const spanRecord = document.querySelector('#Record')
const pResult = document.querySelector('#result')
const btnWin = document.querySelector('#win-button')
const divGameWin = document.querySelector('#div-game-win')
const divMessages = document.querySelector('#div-messages')
const divBtnPlay = document.querySelector('#div-btn-play')
const btnPlay = document.querySelector('#btn-play')
const btnSound = document.querySelector('#btn-sound')

let canvasZise;
let elementSize;
let level = 0;
let lives = 3;

let timeStart;
let timePlayer;
let timeInterval;

//animations
let levelFailInterval;
let dispersionAnimationInteval;

//sounds
let soundClick=new Audio('./sounds/click.mp3')
let soundTrack = new Audio('./sounds/soundtrack.mp3')
let soundExplosion= new Audio('./sounds/explosionSound2.mp3')
let soundLvlPass=new Audio('./sounds/lvlPass.mp3')

const playerPosition = {//aunque sea const se pueden cambiar las propiedades de los atributos del objeto
    y: undefined,
    x: undefined,
}
const giftPosition = {
    x: undefined,
    y: undefined,
}

let enemyPositions = [];
window.addEventListener('load', setCanvasSize)//apenas termine de cargar la pag va a ejecutar el codigo que le digamos en el addeventlistener. El objeto window representa la ventana que contiene un documento DOM;
window.onresize = setCanvasSize;
///////////////////////////////////win btn
btnWin.addEventListener('click', reloadGame)

function reloadGame() {
    soundClick.play()
    pResult.innerHTML = '';
    divGameWin.classList.toggle('inactive')
    divMessages.classList.toggle('overlap-messages')
    /* location.reload()  */
    level = 0;
    lives = 3;
    playerPosition.x = undefined
    playerPosition.y = undefined
    timeStart = undefined;
    startGame();
}
//////////////////////////////////play btn
btnPlay.addEventListener('click', play)
function play() {
    soundClick.play()
    soundTrack.play()
    startGame()
    btnPlay.classList.toggle('inactive')
    divBtnPlay.classList.toggle('inactive')


}
/////////////////////////////////sound btn
btnSound.addEventListener('click', mute)
function mute() {
    soundTrack.pause();
}


function fixNumber(n) {
    return Number(n.toFixed(0))
}

function setCanvasSize() {
    playerPositionResize = [];
    canvasZise = (window.innerHeight > window.innerWidth) ? window.innerWidth * 0.7 : window.innerHeight * 0.7;//si width es menor va a ser el canvas zise
    //tamaño window(ventana) por 0.75 seia como 75% de la pantalla
    //innerWidth devuelve el ancho interior de la ventana en píxeles(solo lectura), setAttribute solo agrega el atributo a html
    playerPositionResize.x = playerPosition.x / elementSize
    playerPositionResize.y = playerPosition.y / elementSize
    canvas.setAttribute('width', canvasZise)//agrega width=32321 a el  HTML
    canvas.setAttribute('height', canvasZise)
    canvasZise = Number(canvasZise.toFixed(0))
    elementSize = canvasZise / 10;//alto o ancho de el camvas dividido 1
    //se divide entre 10 para que entren 10 emojis en el canvas(orizontal o vertical)

    if (timeStart && level < maps.length) { //si timeStart tiene algo   
        playerPosition.x = playerPositionResize.x * elementSize
        playerPosition.y = playerPositionResize.y * elementSize
        startGame() //se ejecuta start game para que cargue el mapa 
    } else {
        playerPosition.x = undefined;
        playerPosition.y = undefined; //borramos la posicion del jugador para que luego la tome como que no tiene nada y se la reasigne    
    }

}
function startGame() {
    window.addEventListener('keydown', moveByKeys)    //keydown cuando apretamos la tecla, keydown cuando la soltamos
    clearInterval(dispersionAnimationInteval);
    clearInterval(levelFailInterval);
    movementDisabled(false)

    game.font = (elementSize * 0.90) + 'px Verdana';//tamaño en pixeles con la fuente(agregamos la fuente por que es obligatoria)
    game.fontweight = 'lighter'
    game.textAlign = 'end';//para posicionar la bomba a el inicio

    const map = maps[level];
    if (!map) {//si no hay nada en mapa ejecuta
        gameWin();
        return
    }
    if (!timeStart) {//si time start no tiene valor se lo agrega
        timeStart = Date.now()//Dadamos el tiempo actual en ms, para saber en que ms del dia comenzo el juego  y lo guardamos en una variable (Time start)
        clearInterval(timeInterval);
        timeInterval = setInterval(showTime, 100) //setInterval(function,ms) establece cada cuantos ms va a ejecutar la funcion
        showRecord();
    }


    const mapRows = map.trim().split('\n') //trim quita los espacios al inicio y final, split crea un arreglo y separa los metodos por cada '\n' salto de linea
    const mapRowsCols = mapRows.map(row => row.trim().split(''))//esto va a hacer que cada map se vuelva un arreglo donde cada letra sea un elemento

    showLives()
    enemyPositions = [];
    game.clearRect(0, 0, canvasZise, canvasZise)

    mapRowsCols.forEach((row, rowI) => {//row es cada elemento del array mapRowsCols rowI guarda el indice de row que esta recorriendo el forEach
        row.forEach((col, colI) => {//colI guarda el indice de col que esta recorriendo el forEach
            const emoji = emojis[col]//nos da el emoji
            const posX = elementSize * (colI + 1);//multiplica el elementzise(tamaño de emoji) x1,x2 y con esas medidas posiciona los emmojis
            const posY = elementSize * (rowI + 1);
            if (col == 'O') {
                if (!playerPosition.x && !playerPosition.y) {//pregunta si player position no tiene algo (si tiene algo le asigna la posicion del jugador)
                    playerPosition.x = posX //le agregamos las coordenas a el objeto playerPosition {}
                    playerPosition.y = posY
                }
            }
            if (col == 'I') {
                giftPosition.x = posX;
                giftPosition.y = posY;
            }
            else if (col == 'X') {
                enemyPositions.push({
                    x: posX,
                    y: posY
                })
            }

            game.fillText(emoji, posX, posY);
        })
    });
    movePlayer()//palevelFailra que se renderize el jugador apenas termine de cargar el mapa
}


function movePlayer() {
    const giftCollisionX = playerPosition.x.toFixed(3) == giftPosition.x.toFixed(3);//un condicional if pero resumido en una variable
    const giftCollisionY = playerPosition.y.toFixed(3) == giftPosition.y.toFixed(3);
    const giftCollision = giftCollisionX && giftCollisionY;
    if (giftCollision) {
        console.log('Subiste de lvl crack!');
        levelWin()
    }
    const enemyCollision = enemyPositions.find(enemy => {//recorre el array y devuelve el primer elemento que coincida con la busqueda
        const enemyCollisionX = enemy.x.toFixed(3) == playerPosition.x.toFixed(3)//enemycollisionX guanda true o false
        const enemyCollisionY = enemy.y.toFixed(3) == playerPosition.y.toFixed(3)
        return enemyCollisionX && enemyCollisionY;//suelta las 2 variables como true o false 
    })

    if (enemyCollision) {
        movementDisabled(true)
        collisionAnimation()
        levelFailInterval = setInterval(levelFail, 2600);

    }

    game.fillText(emojis['PLAYER'], playerPosition.x,
        playerPosition.y)

    /*     if(playerPosition.y.toFixed()==giftPosition.y.toFixed() && playerPosition.x.toFixed()==giftPosition.x.toFixed()){
            console.log('Ganaste pedazo de aca! :D');
        } */
}
function collisionAnimation() {
    /* soundTrack.pause() */
    i = 0
    game.fillText(emojis['BURST'], playerPosition.x, playerPosition.y);
    dispersionAnimationInteval = setInterval(dispersionAnimation, 300)
    function dispersionAnimation() {
        soundExplosion.play()
        console.log(i);
        if (i < 10) {
            i++
            game.fillText(emojis['BURST'], playerPosition.x + (elementSize * i), playerPosition.y + (elementSize * i));//a=explosion abajo a la derecha
            game.fillText(emojis['BURST'], playerPosition.x - (elementSize * i), playerPosition.y - (elementSize * i));//arriba derecha
            game.fillText(emojis['BURST'], playerPosition.x - (elementSize * i), playerPosition.y + (elementSize * i));//abajo izquierda
            game.fillText(emojis['BURST'], playerPosition.x + (elementSize * i), playerPosition.y - (elementSize * i));//arriba izquierda
        }
    };




}

function movementDisabled(status) {
    btnUp.disabled = status
    btnDown.disabled = status
    btnRight.disabled = status
    btnLeft.disabled = status
    if(status==true){
        window.removeEventListener('keydown',moveByKeys)
    }
    else{
        window.addEventListener('keydown',moveByKeys)
    }
    
}
function levelWin() {
    console.log('Subiste de lvl ckackx2');
    level++;
    soundLvlPass.play()
    startGame()
};
function levelFail() {
    lives--;//no se nota pero son - (lo contrarios a i++)
    if (lives <= 0) {
        level = 0;
        lives = 3;
        timeStart = undefined;
    }
    playerPosition.x = undefined
    playerPosition.y = undefined
    movementDisabled(false);
    startGame();
    

}
function gameWin() {
    console.log('Ganaste el juego ez!');
    clearInterval(timeInterval); //para la funccion que se aloja en la variable timeInterval (funccion que repite x funcion cada x ms)
    const recordTime = localStorage.getItem('record_time');
    const playerTime = Date.now() - timeStart;


    if (recordTime) {//si record time existe,(yo creo que es si redotime tiene un valor)
        if (recordTime >= playerTime) {//si el timpo anterior es mayor a el nuevo
            localStorage.setItem('record_time', playerTime);//agrega el nuevo tiempo como record
            pResult.innerHTML = 'Record personal Superdado';
        } else {
            pResult.innerHTML = 'Record personal no superdado';
        }
    } else {//si no habia un record antes
        localStorage.setItem('record_time', playerTime)
        pResult.innerHTML = 'Primera vez?'
    }
    console.log({ recordTime, playerTime });
    divGameWin.classList.toggle('inactive')
    divMessages.classList.toggle('overlap-messages')
}
function showLives() {//function para agregar corazones
    const heartsArray = Array(lives).fill(emojis['HEART'])
    //Array() crea un arreglo con la cantidad de elementos que diga la variable lives 
    //no entinedo muy bien fill(), pero si le mandamos solo 1 parametro lo va a repetir por cada elemento del array

    /* spanLives.innerHTML=heartsArray;//imprime un corazon en el <span> del texto del html */
    spanLives.innerHTML = '';//limpia el span
    heartsArray.forEach(heart => spanLives.append(heart));
    //forEach ejecuta una funcion por cada elemento del array
    //apend permite agregar varios elementos a el html separados por 1 coma
}
function showTime() {
    spanTime.innerHTML = Date.now() - timeStart
}
function showRecord() {
    spanRecord.innerHTML = localStorage.getItem('record_time')

}



function moveByKeys(event) {//event es la tecla que recive gracias a keydown
    /* console.log(event); //muestra la tecla que precionamos */
    if (event.key == 'ArrowUp') moveUp() //pregunta si la tecla que precinamos es la fecha hacia arriba 
    else if (event.key == 'ArrowLeft') moveLeft();//if que funciona sin llaves :D(solo le quitamos las llaves)
    else if (event.key == 'ArrowRight') moveRight();
    else if (event.key == 'ArrowDown') moveDown();
}



btnUp.addEventListener('click', moveUp);
btnLeft.addEventListener('click', moveLeft);
btnRight.addEventListener('click', moveRight);
btnDown.addEventListener('click', moveDown);

function moveUp() {
    console.log('Me quiero mover hacia arriba');
    if ((playerPosition.y - 1) < elementSize) {
        console.log('OUT');
    }
    else {
        playerPosition.y -= elementSize;
        startGame()
    }
}
function moveLeft() {
    console.log('Me quiero mover hacia izquierda');
    if ((playerPosition.x - elementSize + 1) < elementSize) {
        console.log('OUT');
    } else {
        playerPosition.x -= elementSize;
        startGame()
    }
}
function moveRight() {
    console.log('Me quiero mover hacia derecha');
    if ((playerPosition.x + elementSize) > canvasZise) {
        console.log('OUT');
    } else {
        playerPosition.x += elementSize;
        startGame()
    }
}
function moveDown() {
    console.log('Me quiero mover hacia abajo');
    if ((playerPosition.y + elementSize) > canvasZise) {
        console.log('OUT');
    }
    else {
        playerPosition.y += elementSize;
        startGame()
    }
}
 //1) se preoduce si el usuario perdio las 3 vidas alguna vez, el tiempo sigue corriendo
 //se resolvio poniendo clearInterval(timeInterval); sobre timeInterval = setInterval(showTime, 100) linea 111 aproximadamente
 //2) se produce al hacer resize, todo lo que esta dentro del cambas desaparece
 //





    //game.fillRect(0,0,100,100);//fillRect indica donde va a iniciar nuestro trazo en canvas ((0x,0y inicia 100,100 termina) 0arriba,0izquierda,100px para derecha ,100px para abajo)
    //game.clearRect(0,0,50,50); //borra la parte del canvas que le indiquemos //clearRect(x, y, width, height);

    //game.font = '25px Verdana'//podemos dale estilo como si fuera css
    //game.fillStyle = 'purple'//color de letra
    //game.textAlign ='right';//posicion de textp
    //game.fillText('Platzi', 25, 25)//tamaño de area de texto
    //localStorage.setItem //setItem agrega un item, removeItem borra el item, getItem lee el item