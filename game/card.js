module.exports =  class Card {
    constructor(player) {
        this.player = player;
        this.types = new Set(["card"]);
        this.name = "Base Card";
        this.value = 0;
        this.cost = 0;
        this.abilities = {};
    }

    availableAbilities() {
        let abilities = [];
        Object.keys(this.abilities).forEach((ability) => {
            if (this.abilities[ability].available && !this.abilities[ability].used) {
                abilities.push(ability);
            }
        });
        console.log(abilities);
        return abilities;
    }
    onActivate(gameState, ability) {
        this.abilities[ability].func(gameState);
        this.abilities[ability].used = true;
    }

    // abstract functions
    onPlay(gameState) {
        throw new Error("Abstract function Card.onPlay used: " + this.name);
    }
    onOtherPlay(other, gameState) {
        throw new Error("Abstract function Card.onOtherPlay used");
    }
    onPhaseStart(gameState, phase) {
        throw new Error("Abstract function Card.onPhaseStart used");
    }
    onAcquire(gameState) {
        throw new Error("Abstract function Card.onAcquire used");
    }
    onDestroy(gameState) {
        throw new Error("Abstract function Card.onDestroy used");
    }
};