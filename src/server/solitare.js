/* Copyright G. Hemingway, @2017 */
'use strict';
let     _ = require('underscore');


let shuffleCards = (includeJokers = false) => {
    //return [{ "suit": "clubs", "value": 7 }, { "suit": "diamonds", "value": 12 }];

    /* Return an array of 52 cards (if jokers is false, 54 otherwise). Carefully follow the instructions in the README */
    let cards = [];
    ['spades', 'clubs', 'hearts', 'diamonds'].forEach(suit => {
        ['ace', 2, 3, 4, 5, 6, 7, 8, 9, 10, 'jack', 'queen', 'king'].forEach(value => {
            cards.push({ suit: suit, value: value });
        });
    });
    // Add in jokers here
    if (includeJokers) {/*...*/}
    // Now shuffle
    let deck = [];
    while (cards.length > 0) {
        // Find a random number between 0 and cards.length - 1
        const index = Math.floor((Math.random() * cards.length));
        deck.push(cards[index]);
        cards.splice(index, 1);
    }
    return deck;
};

let initialState = () => {
    /* Use the above function.  Generate and return an initial state for a game */
    let state = {
        id: Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 10),
        pile1: [],
        pile2: [],
        pile3: [],
        pile4: [],
        pile5: [],
        pile6: [],
        pile7: [],
        stack1: [],
        stack2: [],
        stack3: [],
        stack4: [],
        draw: [],
        discard: []
    };

    // Get the shuffled deck and distribute it to the players
    const deck = shuffleCards(false);
    // Setup the piles
    for (let i = 1; i <= 7; ++i) {
        let card = deck.splice(0, 1)[0];
        card.up = true;
        state[`pile${i}`].push(card);
        for (let j = i+1; j <= 7; ++j) {
            card = deck.splice(0, 1)[0];
            card.up = false;
            state[`pile${j}`].push(card);
        }
    }
    // Finally, get the draw right
    state.draw = deck.map(card => {
        card.up = false;
        return card;
    });
    return state;
};


let filterForProfile = game => ({
    id:         game._id,
    game:       game.game,
    color:      game.color,
    draw:       game.drawCount,
    start:      game.start,
    winner:     game.winner,
    score:      game.score,
    cards_remaining: 99,
    active:     game.active,
    moves:      game.moves.length
});


let validMoves = state => {
    // ...

    // Array of valid moves
    let valid  = [];

    let pileToPileIsValid = (srcPileName, srcCardIndex, dstPileName) => {

        let srcCard = state[srcPileName][srcCardIndex];
        let dstPile = state[dstPileName];
        let dstCard = dstPile[dstPile.length - 1];

        // handle empty pile
        if(state[dstPileName].length === 0) return srcCard.value === 'king';


        let srcIsRed = (srcCard.suit === 'diamonds' || srcCard.suit === 'hearts');
        let dstIsRed = (dstCard.suit === 'diamonds' || dstCard.suit === 'hearts');

            switch(true) {
                case(srcPileName === dstPileName):      // same pile - illegal
                case(srcIsRed && dstIsRed || !srcIsRed && !dstIsRed):   // compare suits/colors
                case(!srcCard.up):
                case(!dstCard.up):
                    return false;
                    break;

                // valid moves
                // case(srcCard.value === 'king' && dstCard.value === 'queen'):
                // case(srcCard.value === 'queen' && dstCard.value === 'jack'):
                // case(srcCard.value === 'jack' && dstCard.value == 10):
                // case(srcCard.value == 2 && dstCard.value === 'ace'):
                case(srcCard.value - dstCard.value === -1):
                case(srcCard.value === 'ace' && dstCard.value == 2):
                case(srcCard.value == 10 && dstCard.value === 'jack'):
                case(srcCard.value === 'jack' && dstCard.value === 'queen'):
                case(srcCard.value === 'queen' && dstCard.value === 'king'):
                    return true;
                    break;
            }
        return false;
    };

    let pileToStackIsValid = (srcPileName, dstStackName) => {
        let srcPile = state[srcPileName];
        let srcCard = srcPile[srcPile.length-1];
        let dstStack = state[dstStackName];
        let dstCard = dstStack[dstStack.length - 1];

        switch (true) {
            // handle empty stacks
            case(srcPile.length === 0):
                return false;
            case(dstStack.length === 0):
                return srcCard.value ==='ace';

            // handle occupied stacks
            case(srcCard.suit !== dstCard.suit):    // suits need to match
                return false;
                break;
            // validate card values
            case(srcCard.value - dstCard.value === 1):
            // case(srcCard.value === 'ace' && dstCard.value === 2):
            // case(srcCard.value === 10 && dstCard.value === 'jack'):
            // case(srcCard.value === 'jack' && dstCard.value === 'queen'):
            // case(srcCard.value === 'queen' && dstCard.value === 'king'):
            case(srcCard.value === 'king'   && dstCard.value === 'queen'):
            case(srcCard.value === 'queen'  && dstCard.value === 'jack'):
            case(srcCard.value === 'jack'   && dstCard.value == 10):
            case(srcCard.value == 2        && dstCard.value === 'ace'):
                return true;
                break;
        }
        return false;
    };

    let stackToPileIsValid = (srcStackName, dstPileName) => {

        let srcStack = state[srcStackName];
        let dstPile = state[dstPileName];

        // handle empty stacks and piles
        if(srcStack.length === 0) return false;
        let srcCard = srcStack[srcStack.length - 1];
        if(dstPile.length === 0) return srcCard.value === 'king';

        let srcIsRed = (srcCard.suit === 'diamonds' || srcCard.suit === 'hearts');
        let dstCard = dstPile[dstPile.length-1];
        let dstIsRed = (dstCard.suit === 'diamonds' || dstCard.suit === 'hearts');

        switch(true) {
            case(srcIsRed   && dstIsRed):
            case(!srcIsRed  && !dstIsRed):
                return false;
                break;
            case(srcCard.value - dstCard.value === -1):
            case(srcCard.value === 'ace'    && dstCard.value == 2):
            case(srcCard.value == 10       && dstCard.value === 'jack'):
            case(srcCard.value === 'jack'   && dstCard.value === 'queen'):
            case(srcCard.value === 'queen'  && dstCard.value === 'king'):
                return true;
                break;
        }
        return false;
    };

    let pushCardsToValid = (cardsSliceIndex, src, dst) => {
        valid.push({
            cards:  state[src].slice(cardsSliceIndex),
            src:    src,
            dst:    dst,
        });
    };

    // traverse the source piles
    for (let pileNum = 1; pileNum <=7; pileNum++) {   // i == source pile number
        let pileName = `pile${pileNum}`;
        let srcPile = state[pileName];

        for (let pileCardIndex = 0; pileCardIndex < srcPile.length; pileCardIndex++) {  // j == source card index
            if(!srcPile[pileCardIndex].up) continue;

            // Check from Piles to Piles
            for(let dstPileNum = 1; dstPileNum <= 7; dstPileNum++) {
                if(pileNum === dstPileNum) continue;
                let dstPileName = `pile${dstPileNum}`;

                if (pileToPileIsValid(pileName, pileCardIndex, dstPileName)) {
                    // push moves that are valid
                    pushCardsToValid(pileCardIndex, pileName, dstPileName);
                }
            }
        }

        // Piles to Stacks & Stacks to Piles
        // traverse source piles with destination stacks
        for(let s = 1; s <= 4; s++) {
            let stackName = `stack${s}`;
            if(pileToStackIsValid(pileName, stackName)) {
                pushCardsToValid(-1, pileName, stackName);
            }

            // Stacks to Piles
            if(stackToPileIsValid(stackName, pileName)){
                pushCardsToValid(-1, stackName, pileName);
            }
        }

        // Discard to Piles ---- watch variables
        if(stackToPileIsValid('discard', pileName)) {
            pushCardsToValid(-1, 'discard', pileName);
        }

    }



    //  Going from the stacks and discard to the seven piles
    for(let stackNum = 1; stackNum <= 4; stackNum++){
        let stackName = `stack${stackNum}`;

        // Check the discard going to stacks ---- watch variables
        if(pileToStackIsValid('discard', stackName)) {
            valid.push({
                cards:  state['discard'].slice(-1),
                src:    'discard',
                dst:    stackName,
            });
        }

        // Check for Stack to Stack
        for(let dstStackNum = 1; dstStackNum <= 4; dstStackNum++){
            let dstStackName = `stack${dstStackNum}`;
            if(pileToStackIsValid(stackName, `stack${dstStackNum}`)){
                pushCardsToValid(-1, stackName, dstStackName);
            }
        }
    }

    // handle potential draws
    pushCardsToValid(-3, 'draw', 'discard');
    pushCardsToValid(-1, 'draw', 'discard');

    // handle empty draw Pile
    if (state['draw'].length === 0 && state['discard'].length > 0) {
        valid.push({
            cards:  state['discard'].slice().reverse(),
            src:    'discard',
            dst:    'draw',
        })
    }

    console.log(`valid length ${valid.length}`);
    return valid;
};




let validateMove = (state, requestedMove) => {
    let moves = validMoves(state);


    // ...

    // requestedMove.cards = requestedMove.cards.map((card) => {
    //     if (card.up === "true" || card.up === "false") {
    //         card.up = card.up === "true";
    //     }
    //     return card;
    // });

    console.log('Requested Move:');
    console.log(requestedMove);
    // for(let i= 0; i < moves.length; i++){
    //     console.log(moves[i]);
    // }

    for(let i = 0; i < moves.length; i++) {
        let move = moves[i];
        if (move.src !== requestedMove.src
            || move.dst !== requestedMove.dst
            || move.cards.length !== requestedMove.cards.length) continue;

        for(let j = 0; j <= move.cards.length; j++) {
            if (j === move.cards.length) return true;
            let suit = move.cards[j].suit        === requestedMove.cards[j].suit;
            let value = move.cards[j].value   === requestedMove.cards[j].value;
            let up = move.cards[j].up      === requestedMove.cards[j].up;
        }
    }

    return false;
};


module.exports = {
    shuffleCards: shuffleCards,
    initialState: initialState,
    filterForProfile: filterForProfile,
    validateMove: validateMove
};