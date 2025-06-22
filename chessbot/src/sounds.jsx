import { Howl } from "howler";


const moveSound = new Howl({ src: ['/sounds/move.mp3'] });
const captureSound = new Howl({ src: ['/sounds/capture.mp3'] });
const victorySound = new Howl({ src: ['/sounds/Victory.mp3'] });
const defeatSound = new Howl({ src: ['/sounds/Victory.mp3'] });
const checkSound = new Howl({ src: ['/sounds/Check.mp3'] }); 
const bellSound = new Howl({src: ["/sounds/bell.wav"]});
const TimerSound = new Howl({src: ["/sounds/Timer.mp3"]});
const castleSound = new Howl({src: ["/sounds/Castles.mp3"]});

export const Sounds = (move) => {
    console.log(move);
    switch(move){
        case "c": 
            captureSound.play();
            break;
        case "n":
            moveSound.play();
            break;
        case "b":
            moveSound.play();
            break;
        case "w":
            victorySound.play();
            break;
        case "d":
            defeatSound.play();
            break;
        case "ch":
            checkSound.play();
            break;
        case "k":
            castleSound.play();
    }
   
};


export const playBell = () => {
  const id = bellSound.play();
  setTimeout(() => {
    bellSound.stop(id); 
  }, 3000);
};

export const playTimer = () => {
  const id = TimerSound.play();
  setTimeout(() => {
    TimerSound.stop(id); 
  }, 8000);
};
