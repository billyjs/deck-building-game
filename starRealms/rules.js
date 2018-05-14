const cards = require('./cards');

function createStartingDeck() {
    let deck = [];
    for (let i = 0; i < 8; i++) {
        deck.push(new cards.Scout());
    }
    for (let i = 0; i < 2; i++) {
        deck.push(new cards.Viper());
    }
    return deck;
}

function createTradeDeck() {
    let deck = [];
    // triples
    for (let i = 0; i < 3; i++) {
        deck.push("BlobFighter");
        deck.push("TradePod");
        deck.push("BlobWheel");

        deck.push("ImperialFighter");
        deck.push("ImperialFrigate");
        deck.push("SurveyShip");
    }
    // doubles
    for (let i = 0; i < 2; i++) {
        deck.push("BattlePod");
        deck.push("Ram");
        deck.push("BlobDestroyer");

        deck.push("Corvette");
        deck.push("SpaceStation");
        deck.push("RecyclingStation");
    }
    // singles
    deck.push("BattleBlob");
    deck.push("BlobCarrier");
    deck.push("Mothership");
    deck.push("TheHive");
    deck.push("BlobWorld");

    deck.push("Battlecruiser");
    deck.push("Dreadnaught");
    deck.push("WarWorld");
    deck.push("RoyalRedoubt");
    deck.push("FleetHQ");
    return deck;
}

function makePlayingActions(gameState) {
    let actions = [];
    gameState.getPlaying().hand.forEach((card, index) => {
        actions.push({
            action: 'play',
            card: card.name,
            index: index
        })
    });
    return actions;
}

function makeAbilityActions(gameState) {
    let actions = [];
    gameState.getPlaying().inPlay.forEach((card, index) => {
        card.availableAbilities().forEach((ability) => {
            actions.push({
                action: "ability",
                ability: ability,
                card: card.name,
                index: index
            });
        });
    });
    return actions;
}

function makeCombatActions(gameState) {
    // TODO: is not correct
    let actions = [];
    let combat = gameState.getPlaying().get("combat");
    gameState._playerIds.filter((playerId) => { return playerId !== gameState.playing }).forEach((playerId) => {
        let bases = [];
        let outposts = [];
        let outpost = false;
        gameState.players[playerId].inPlay.forEach((card, index) => {
            if (card.types.has("outpost")) {
                outpost = true;
            }
            if (card.defense <= combat) {
                if (card.types.has("outpost")) {
                    outposts.push({card, index});
                } else {
                    bases.push({card, index});
                }
            }
        });
        outposts.forEach((outpost) => {
            actions.push({
                action: "combat",
                target: "card",
                player: playerId,
                damage: outpost.card.defense,
                card: outpost.card.name,
                index: outpost.index
            });
        });
        if (!outpost) {
            bases.forEach((base) => {
                actions.push({
                    action: "combat",
                    target: "card",
                    player: playerId,
                    damage: base.card.defense,
                    card: base.card.name,
                    index: base.index
                });
            });
            if (combat > 0) {
                actions.push({
                    action: "combat",
                    target: "player",
                    player: playerId,
                    damage: combat
                });
            }
        }
    });
    return actions;
}

function makeBuyActions(gameState) {
    let actions = [];
    let trade = gameState.getPlaying().get("trade");
    // piles
    Object.keys(gameState.shop.piles).forEach((key) => {
        let pile = gameState.shop.piles[key];
        if (pile.amount > 0 && cards._costEnum[pile.cardName] <= trade) {
            actions.push({
                action: "buy",
                target: "pile",
                pile: key
            })
        }
    });
    //rows
    Object.keys(gameState.shop.rows).forEach((key) => {
        let row = gameState.shop.rows[key];
        row.row.forEach((card, index) => {
            if (card && cards._costEnum[row.row[index]] <= trade) {
                actions.push({
                    action: "buy",
                    target: "row",
                    row: key,
                    index: index
                })
            }
        })
    });
    return actions;
}

function drawAmount(turn, playerIndex) {
    if (turn === 0 && playerIndex === 0) {
        return 3;
    } else {
        return 5;
    }
}

function actionPlay(gameState, action) {
    gameState.getPlaying().play(gameState, action.index);
    return "played " + action.card;
}

function actionAbility(gameState, action) {
    gameState.getPlaying().inPlay[action.index].onActivate(gameState, action.ability);
}

function actionCombat(gameState, action) {
    switch(action.target) {
        case "player":
            gameState.players[action.player].updateCounter("authority", -action.damage);
            gameState.getPlaying().updateCounter("combat", -action.damage);
            break;
        case "card":
            gameState.players[action.player].destroy(gameState, action.index);
            gameState.getPlaying().updateCounter("combat", -action.damage);
            break;
        default:
            break;
    }
}

function actionBuy(gameState, action) {
    if (action.target === "pile") {
        let card = gameState.shop.fromPile(action.pile);
        gameState.getPlaying().toDiscard(card);
        gameState.getPlaying().updateCounter("trade", -card.cost);
    } else if (action.target === "row") {
        let card = gameState.shop.fromRow(action.row, action.index);
        gameState.getPlaying().toDiscard(card);
        gameState.getPlaying().updateCounter("trade", -card.cost);
    }
}

module.exports = {
    cards: cards,
    phases: ['play', 'discard', 'draw'],
    startingDeck: createStartingDeck,
    shop: {
        rows: [{
            name: "tradeRow",
            deck: createTradeDeck(),
            shown: 5
        }],
        piles: [{
            name: "explorers",
            cardName: "Explorer",
            amount: 10
        }]
    },
    player: {
        counters: [
            {
                name: "trade",
                value: 0
            },
            {
                name: "combat",
                value: 0
            },
            {
                name: "authority",
                value: 50
            },
            {
                name: "blobs",
                value: 0
            }
        ]
    },
    game: {
        makes: [
            {
                phase: "play",
                func: makePlayingActions
            },
            {
                phase: "play",
                func: makeAbilityActions
            },
            {
                phase: "play",
                func: makeCombatActions
            },
            {
                phase: "play",
                func: makeBuyActions
            }
        ],
        applications: [
            {
                action: "play",
                func: actionPlay
            },
            {
                action: "ability",
                func: actionAbility
            },
            {
                action: "combat",
                func: actionCombat
            },
            {
                action: "buy",
                func: actionBuy
            }
        ]
    },

    // functions
    drawAmount: drawAmount
};

