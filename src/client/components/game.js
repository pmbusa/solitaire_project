/* Copyright G. Hemingway, 2017 - All rights reserved */
'use strict';


import React, { Component }     from 'react';
import { withRouter }           from 'react-router';

/*************************************************************************/

import { Pile } from './pile';

class Game extends Component {
    constructor(props) {
        super(props);
        this.state = {
            target: undefined,
            startDrag: { x: 0, y: 0 },
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
            discard: [],

            srcCard: null,
            dstCard: null,
            srcPile: null,
            dstPile: null,
            drawCount: null,
        };

        this.onClick           = this.onClick.bind(this);
        this.backgroundOnClick = this.backgroundOnClick.bind(this);
        this.sendMove          = this.sendMove.bind(this);
    }

    componentDidMount() {
        $.ajax({
            url: `/v1/game/${this.props.match.params.id}`
        }).then(data => {
            console.log(data);
            this.setState({
                pile1: data.pile1,
                pile2: data.pile2,
                pile3: data.pile3,
                pile4: data.pile4,
                pile5: data.pile5,
                pile6: data.pile6,
                pile7: data.pile7,
                stack1: data.stack1,
                stack2: data.stack2,
                stack3: data.stack3,
                stack4: data.stack4,
                draw: data.draw,
                discard: data.discard,

                drawCount: data.drawCount,
            });
        }).fail(err => {
            // TODO: Should show a helpful error message that the game could not be found
            console.log(err);
        });
    }

    onClick(cardInfo) {
        // let target = ev.target;
        // console.log(target.id);

        console.log(cardInfo);
        let selContainsCard = cardInfo.hasOwnProperty('card');
        let srcPileIsEmpty = this.state.srcCard === null;
        //console.log(srcPileIsEmpty);
        //console.log(selContainsCard);

        let move = null;
        switch(true) {
            // draw the cards
            case (cardInfo.pile === "draw" && srcPileIsEmpty && selContainsCard):
                console.log("drawing cards");
                move = {
                    cards: this.state.draw.slice(-this.state.drawCount),
                    src: 'draw',
                    dst: 'discard',
                };
                // reset the state
                this.setState({srcCard: null,   dstCard: null});
                // send move
                this.sendMove(move);
                break;

            // reset draw pile
            case (cardInfo.pile === 'draw' && !selContainsCard && this.state.draw.length === 0):
                move = {
                    cards:  this.state.discard.slice().reverse(),
                    src:    'discard',
                    dst:    'draw',
                };
                this.sendMove(move);
                break;

            // set first card
            case (srcPileIsEmpty && selContainsCard && cardInfo.card.up):
                this.setState({srcCard: cardInfo});
                console.log('setting first card');
                break;

            // illegal move - reset the move
            case (selContainsCard && !cardInfo.card.up
                    || srcPileIsEmpty
                    || this.state.srcCard.pile === cardInfo.pile):

                console.log('illegal move');

                // reset
                this.setState({srcCard: null, dstCard: null});
                break;

            //execute move
            default:
                let src = this.state.srcCard.pile;
                let index = this.state[src].indexOf(this.state.srcCard.card);
                move = {
                    cards: this.state[src].slice(index),
                    src: src,
                    dst: cardInfo.pile,
                };

                // reset the state
                this.setState({srcCard: null,   dstCard: null});
                // send move
                this.sendMove(move)
        }
    }

    backgroundOnClick(ev) {
        let target = ev.target;
        if(!target.classList.contains('card') && !target.classList.contains('card-pile')) {
            console.log('card selection cancelled');
            this.setState({srcCard: null, dstCard: null});
        }
    }


    sendMove(move){
        // const move = move;
        console.log('sending move');
        console.log(move);
        // send game data to server
        $.ajax({
            url:    `/v1/game/${this.props.match.params.id}`,
            method: 'put',
            data:   move,

        }).done((data, textStatus, jqXHR) => {
            // update the gamestate
            this.setState({
                pile1: data.pile1,
                pile2: data.pile2,
                pile3: data.pile3,
                pile4: data.pile4,
                pile5: data.pile5,
                pile6: data.pile6,
                pile7: data.pile7,
                stack1: data.stack1,
                stack2: data.stack2,
                stack3: data.stack3,
                stack4: data.stack4,
                draw: data.draw,
                discard: data.discard,
            });


        }).fail((jqXHR, textStatus, errorThrown) =>{
            console.log(`sendMove() ajax request failed with error: ${errorThrown} ${textStatus}`)
        });
    }


    render() {
        return (
            <div onClick={this.backgroundOnClick}>
                <div className="card-row" onClick={this.backgroundOnClick}>
                    <Pile
                        cards={this.state.stack1}
                        spacing={0}
                        onClick={this.onClick}
                        id="stack1"
                    />
                    <Pile
                        cards={this.state.stack2}
                        spacing={0}
                        onClick={this.onClick}
                        id="stack2"
                    />
                    <Pile
                        cards={this.state.stack3}
                        spacing={0}
                        onClick={this.onClick}
                        id="stack3"
                    />
                    <Pile
                        cards={this.state.stack4}
                        spacing={0}
                        onClick={this.onClick}
                        id="stack4"
                    />
                    <div className="card-row-gap" onClick={this.backgroundOnClick}/>
                    <Pile
                        cards={this.state.draw}
                        spacing={0}
                        onClick={this.onClick}
                        id="draw"
                    />
                    <Pile
                        cards={this.state.discard}
                        spacing={0}
                        onClick={this.onClick}
                        id="discard"
                    />
                </div>
                <div className="card-row" onClick={this.backgroundOnClick}>
                    <Pile
                        cards={this.state.pile1} onClick={this.onClick} id="pile1"/>
                    <Pile
                        cards={this.state.pile2} onClick={this.onClick} id="pile2"/>
                    <Pile
                        cards={this.state.pile3} onClick={this.onClick} id="pile3"/>
                    <Pile
                        cards={this.state.pile4} onClick={this.onClick} id="pile4"/>
                    <Pile
                        cards={this.state.pile5} onClick={this.onClick} id="pile5"/>
                    <Pile
                        cards={this.state.pile6} onClick={this.onClick} id="pile6"/>
                    <Pile
                        cards={this.state.pile7} onClick={this.onClick} id="pile7"/>
                </div>
            </div>
        )
    }
}

export default withRouter(Game);
