/* Copyright G. Hemingway @2017 - All rights reserved */
"use strict";

let Joi             = require('joi'),
    _               = require('underscore'),
    Solitare        = require('../../solitare');


module.exports = app => {

    // Create a new game
    app.post('/v1/game', (req, res) => {
        if (!req.session.user) {
            res.status(401).send({ error: 'unauthorized' });
        } else {
            // Schema for user info validation
            let schema = Joi.object().keys({
                game: Joi.string().lowercase().required(),
                color: Joi.string().lowercase().required(),
                draw: Joi.any()
            });
            // Validate user input
            Joi.validate(req.body, schema, {stripUnknown: true}, (err, data) => {
                if (err) {
                    const message = err.details[0].message;
                    console.log(`Game.create validation failure: ${message}`);
                    res.status(400).send({error: message});
                } else {
                    // Set up the new game
                    let newGame = {
                        owner:          req.session.user._id,
                        active:         true,
                        cards_remaining: 52,
                        color:          data.color,
                        game:           data.game,
                        score:          0,
                        start:          Date.now(),
                        winner:         "",
                        moves:          [],
                        state:          []
                    };
                    switch(data.draw) {
                        case 'Draw 1': newGame.drawCount = 1; break;
                        case 'Draw 3': newGame.drawCount = 3; break;
                    }
                    // Generate a new initial game state
                    newGame.state.push(Solitare.initialState());
                    let game = new app.models.Game(newGame);
                    game.save(err => {
                        if (err) {
                            console.log(`Game.create save failure: ${err}`);
                            res.status(400).send({ error: 'failure creating game' });
                            // TODO: Much more error management needs to happen here
                        } else {
                            const query = { $push: { games: game._id }};
                            // Save game to user's document too
                            app.models.User.findOneAndUpdate({ _id: req.session.user._id }, query, () => {
                                res.status(201).send({
                                    id: game._id
                                });
                            });
                        }
                    });
                }
            });
        }
    });

    // Fetch game information
    app.get('/v1/game/:id', (req, res) => {
       if (!req.session.user) {
           res.status(401).send({ error: 'unauthorized' });
       } else {
           app.models.Game.findById(req.params.id)
               .then(
                   game => {
                       if (!game) {
                           res.status(404).send({error: `unknown game: ${req.params.id}`});
                       } else {
                           const state = game.state[0].toJSON();
                           let results = _.pick(game.toJSON(), 'start', 'moves', 'winner', 'score', 'drawCount', 'color', 'active');
                           results.start = Date.parse(results.start);
                           results.cards_remaining = 52 - (state.stack1.length + state.stack2.length + state.stack3.length + state.stack4.length);
                           res.status(200).send(_.extend(results, state));
                       }
                   }, err => {
                       console.log(`Game.get failure: ${err}`);
                       res.status(404).send({error: `unknown game: ${req.params.id}`});
                   }
               );
       }
    });

    app.put('/v1/game/:id', (req, res) => {
        let move = req.body;
        app.models.Game.findById(req.params.id, (err, game) => {
            console.log('move received');
            console.log(req.body);


            let state = game.state[0];
            if (Solitare.validateMove(state, move)) {
                // move is valid, update the state
                state[move.src] = state[move.src].slice(0, -move.cards.length);
                state[move.dst] = state[move.dst].concat(move.cards);

                // flip the top card in the src pile
                if(move.src !== 'draw' && state[move.src].length > 0){
                    state[move.src][state[move.src].length-1].up = true;
                }
                // handle flipping the top Discard card
                if(state['discard'].length > 0) {
                    state['discard'][state['discard'].length-1].up = true;
                }
                // Set all Draw cards to face down
                if(move.dst === 'draw') {
                    for(let i = 0; i < state['draw'].length; i++) {
                        state['draw'][i].up = false;
                    }
                }

                game.state.unshift(state);
                game.moves.push(move);
                game.save(err => {
                    if (err) {
                        console.log(`Game move save failure: ${err}`);
                        res.status(500).send({ error: 'failure saving move'});
                        // TODO: Much more error management needs to happen here
                    } else {
                        res.status(202).send(state);
                    }
                });
            }
            else {
                res.status(400).send({error: 'Invalid Move', state: state});
            }
        });
    });


    // Provide end-point to request shuffled deck of cards and initial state - for testing
    app.get('/v1/cards/shuffle', (req, res) => {
        res.send(Solitare.shuffleCards(false));
    });
    app.get('/v1/cards/initial', (req, res) => {
        res.send(Solitare.initialState());
    });

};
