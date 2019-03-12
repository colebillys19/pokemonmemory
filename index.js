
"use strict";

// audio samples
let clickSample = new Audio("https://res.cloudinary.com/dxklaorw6/video/upload/v1552165806/click.mp3")
let matchSample = new Audio("https://res.cloudinary.com/dxklaorw6/video/upload/v1552076552/poke_match.mp3");
let finishSample = new Audio("https://res.cloudinary.com/dxklaorw6/video/upload/v1552322262/poke_finish.mp3");
let song = new Audio("https://res.cloudinary.com/dxklaorw6/video/upload/v1552076553/poke_theme.mp3");

// global variables
let currentScore = 0;
let activeCards = [];
let currentFlipped = [];

// if there's a best score saved in storage, render to the page
if (window.localStorage.length) {
    document.querySelector("div.bestScore").innerHTML = parseInt(localStorage.getItem('best'));
    document.querySelector("div.bestScoreContainer").style.display = "flex";
}

/**************************************************/

// assemble game
(function generateCards() {
    // generate a new card and append to page (x24)
    for (let i = 0; i < 24; i++) {
        let cardContainer = document.createElement("div");
        cardContainer.classList.add("card-container");
        let card = document.createElement("div");
        card.classList.add("card");
        card.id = `card${i}`;
        let back = document.createElement("div");
        back.classList.add("back");
        let front = document.createElement("div");
        front.classList.add("front");
        let ball = document.createElement("img");
        ball.src = "https://res.cloudinary.com/dxklaorw6/image/upload/v1552165861/pokeball.png"
        let sprite = document.createElement("img");
        sprite.classList.add("sprite");
        let num = document.createElement("span");
        num.classList.add("num");
        // assemble
        back.appendChild(ball);
        front.appendChild(sprite);
        front.appendChild(num);
        card.appendChild(back);
        card.appendChild(front);
        cardContainer.appendChild(card);
        // append to page
        document.querySelector("div.game-grid").appendChild(cardContainer);
    }
})();

/**************************************************/

// initilize global variable for amount of pokemon (to be determined)
let pokeAmount;

// attach listeners to select buttons
document.querySelector("div#orig").addEventListener("click", pick);
document.querySelector("div#all").addEventListener("click", pick);

// handle select button click
function pick(e) {
    if (this.id === "orig") { pokeAmount = 151; }
    else { pokeAmount = 807; }
    // start new game
    newGame(pokeAmount);
    // hide landing with shadow and remove game opacity
    document.querySelector("div.landing").style.display = "none";
    document.querySelector("img.shadow").style.display = "none";
    document.querySelector("img.shadow").style.opacity = "1";
    document.querySelector("div.game-container").classList.remove("opaque");
}

/**************************************************/

// start new game
function newGame(amount) {
    // play background music
    song.play();
    song.loop = true;
    // get numbers
    let nums = generateNums(amount);
    // make an array of all card divs
    let cards = [...document.querySelectorAll("div.card")];
    // make an array of all pokemon sprite image tags
    let sprites = [...document.querySelectorAll("img.sprite")];
    // make an array of all pokemon number spans
    let pokeNums = [...document.querySelectorAll("span.num")];
    // iterate over all cards and keep track of indeces (in order to assign numbers)
    cards.forEach((card, i) => {
        // assign a number to each card (pokemon number)
        card.setAttribute("data-key", nums[i]);
        // using the number, render appropriate pokemon image for each card
        sprites[i].src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${nums[i]}.png`;
        // display the number under the image
        pokeNums[i].innerHTML = nums[i];
        // add each card container to the active cards array
        activeCards.push(card);
    });
    // add click listeners to active cards
    addListeners();
}

// add click listeners to active cards
function addListeners() {
    activeCards.forEach(card => {
        card.addEventListener("click", clickListen, false);
    });
}

/**************************************************/

// handle card click
function clickListen(e) {
    // if the same card is clicked twice, exit code block
    if (currentFlipped.length !== 0 && this.id === currentFlipped[0].id) { return }
    // specify that the following code is only executed on a 'card' div, not its children
    if (this.classList[0] === "card") {
        // rotate card
        this.classList.add("flipped");
        // add to currently flipped array
        currentFlipped.push(this);
        // check if two cards have been flipped
        ifTwoCardsFlipped(this);
    }
}

/**************************************************/

// check if 2 cards have been flipped
function ifTwoCardsFlipped(justClicked) {
    // if two cards have been flipped
    if (currentFlipped.length > 1) {
        // check if there's a match before card flips - in order to play match sample during flip
        if (currentFlipped[0].dataset.key === currentFlipped[1].dataset.key) {
            // reset sample and play
            matchSample.currentTime = 0;
            matchSample.play();
        }
        // if no match, play click
        else {
            // reset sample and play
            clickSample.currentTime = 0;
            clickSample.play();
        }
        // temporarily prevent the user from clicking any more cards
        activeCards.forEach(card => {
            card.removeEventListener("click", clickListen, false);
        });
        // wait for card to flip
        justClicked.addEventListener("transitionend", function wait() {
            justClicked.removeEventListener("transitionend", wait, false);
            // increment current score and render to page
            currentScore++;
            document.querySelector("div.currentScore").innerHTML = currentScore;
            // check for match
            checkForMatch();
        }, false);
    }
    // if only 1 card flipped, play click
    else {
        // reset sample and play
        clickSample.currentTime = 0;
        clickSample.play();
    }
}

/**************************************************/

// check if cards match
function checkForMatch() {
    // if two cards match
    if (currentFlipped[0].dataset.key === currentFlipped[1].dataset.key) {
        // grab the key number of the matching two cards
        let target = currentFlipped[0].dataset.key;
        // grab the current amount of active cards
        let len = activeCards.length;
        // set i
        let i = len - 1;
        // if we have yet to remove both cards, keep looping until both are found
        while (activeCards.length > len - 2) {
            if (activeCards[i].dataset.key === target) {
                activeCards.splice(i, 1);
            }
            i--;
        }
        // if there are no more active cards, game is over
        if (activeCards.length === 0) {
            finish()
        }
        // if still more active cards, re-establish click listeners and empty currentFlipped array
        else {
            addListeners();
            currentFlipped.length = 0;
        }
    }
    // if no match
    else {
        // wait 1 second so the user can view cards
        setTimeout(() => {
            // flip the two cards back over
            activeCards.forEach(card => {
                card.classList.remove("flipped");
            })
            // empty currentFlipped array
            currentFlipped.length = 0;
            // re-establish click listeners
            addListeners();
        }, 1000);
    }
}

/**************************************************/

// when game finishes
function finish() {
    // play finish sample
    finishSample.play();
    // if the users score is better than the best score, set best score to users score
    // if there is no best score, set best score to users score
    if (currentScore < parseInt(localStorage.getItem("best")) || window.localStorage.length === 0) {
        // save new best score
        localStorage.setItem("best", currentScore);
        // render best score
        document.querySelector("div.bestScore").innerHTML = currentScore;
        document.querySelector("div.bestScoreContainer").style.display = "flex";
    }
    // display final score + image + shadow, make game board opaque
    document.querySelector("div.finishScore").innerHTML = currentScore;
    document.querySelector("div.finish").style.display = "flex";
    document.querySelector("img.ash").style.display = "inline-block";
    document.querySelector("img.shadow").style.display = "inline-block";
    document.querySelector("div.game-container").classList.add("opaque");
    // add listener to 'play again' button
    document.querySelector("a#again").addEventListener("click", resetGame);
}

/**************************************************/

// reset game
function resetGame() {
    // hide finish box and remove game board opacity
    document.querySelector("div.finish").style.display = "none"; 
    document.querySelector("img.ash").style.display = "none";
    document.querySelector("img.shadow").style.display = "none";
    document.querySelector("div.game-container").classList.remove("opaque");
    // reset the score counter to 0
    document.querySelector("div.currentScore").innerHTML = 0;
    currentScore = 0;
    // reset all cards
    let cards = [...document.querySelectorAll("div.card")];
    cards.forEach(card => {
        card.classList.remove("flipped");
    })
    // empty currentFlipped array
    currentFlipped.length = 0;
    // wait for cards to reset
    document.querySelector("div.card").addEventListener("transitionend", function wait() {
        // start a new game
        newGame(pokeAmount);
        //
        document.querySelector("div.card").removeEventListener("transitionend", wait, false);
    }, false);
}

/********************************************************************************/

// generate 12 random numbers, each with a duplicate
function generateNums(amount) {
    // create a 24 value array
    let nums = new Array(24);
    // generate 12 unique numbers, add each one to nums array twice
    for (let i = 0; i < 12; i++) {
        let random = Math.ceil(Math.random() * amount);
        while (nums.includes(random)) {
            random = Math.ceil(Math.random() * amount);
        }
        nums[i] = random;
        nums[i + 12] = random;
    }
    // shuffle the array twice
    return shuffleArr(shuffleArr(nums));
}

/**************************************************/

// shuffle array helper function
function shuffleArr(arr) {
    var currentIndex = arr.length;
    var randomIndex;
    var temp;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
        temp = arr[currentIndex];
        arr[currentIndex] = arr[randomIndex];
        arr[randomIndex] = temp;
    }
    return arr;
}


