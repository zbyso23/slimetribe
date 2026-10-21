Game.Battle = {
    generateWorld() {
        try {
            if (gameData.battle.world.first === true) {
                // Game.Scene.Graphics.addBattleGround();
                Game.Scene.Graphics.addBattleAmbient();
                Game.Battle.Sounds.preloader();
            }

            Game.Battle.Grid.generateCharacters(tribe.left, true, 3.14);
            Game.Battle.Grid.generateCharacters(
                tribe.right,
                false,
                0,
                gameData.battle.plane.gridWidth - 1
            );

            if (gameData.battle.world.first === true) {
                Game.Battle.Grid.generateMap();
            }

            gameData.battle.world.first = false;
            gameData.battle.world.ready = true;
        } catch (error) {
            // Existing behavior: errors are swallowed.
        }
    },

    healing(attacker, defender) {
        const hero = gameData.battle.selection.hero;
        const healer = hero.monsters[attacker.x][attacker.y];
        const target = hero.monsters[defender.x][defender.y];
        const healing = Game.Battle.calcHealing(healer, target);

        target.healthRemain += healing.health;
        healer.manaRemain = Math.max(0, healer.manaRemain - healer.stats.magic);
        healer.speedRemain = 0;

        const settings = {
            x: attacker.x,
            y: attacker.y,
            xT: parseInt(defender.x, 10),
            yT: parseInt(defender.y, 10),
            grid: hero.grid,
            enemyGrid: gameData.battle.selection.enemyHero.grid,
            withAttack: false,
            withHealing: true,
            withDeath: false,
            damage: 0,
            heal: healing.health,
            nearAttack: false,
            withSpell: false
        };

        Game.Battle.Animation.animate(settings);
    },

    spell(attacker, defender) {
        const selection = gameData.battle.selection;
        const caster = selection.hero.monsters[attacker.x][attacker.y];
        const target = selection.enemyHero.monsters[defender.x][defender.y];
        const spell = Game.Battle.calcSpell(caster, target);
        const activeSpell = spellsList[caster.stats.activeSpell];

        const settings = {
            x: attacker.x,
            y: attacker.y,
            xT: parseInt(defender.x, 10),
            yT: parseInt(defender.y, 10),
            grid: selection.hero.grid,
            enemyGrid: selection.enemyHero.grid,
            withAttack: false,
            withSpell: true,
            withHealing: false,
            withDeath: spell.death,
            damage: spell.damage,
            spell: activeSpell,
            nearAttack: true
        };

        target.healthRemain = Math.max(0, target.healthRemain - spell.damage);
        caster.manaRemain = Math.max(0, caster.manaRemain - activeSpell.manaCost);
        caster.speedRemain = 0;

        Game.Battle.Animation.animate(settings);
    },

    calcAttack(attacker, defender) {
        try {
            if (typeof attacker === "undefined" || typeof defender === "undefined") {
                return false;
            }

            const attackerStats = attacker.stats;
            const defenderStats = defender.stats;
            const attack = Math.round((attackerStats.attack + Math.random() * 0.5) * 7);
            const defense = Math.round((defenderStats.defense + Math.random() * 0.5) * 3);
            const damage = attack > defense ? Math.round(attack - defense) : 0;
            const death = defender.healthRemain - damage <= 0;

            if (death) {
                defender.healthRemain = 0;
            }

            return { damage, death };
        } catch (error) {
            // Existing behavior: errors are swallowed and reported as failure.
        }

        return false;
    },

    calcSpell(attacker, defender) {
        try {
            if (typeof attacker === "undefined" || typeof defender === "undefined") {
                return false;
            }

            const defenderStats = defender.stats;
            const activeSpell = spellsList[attacker.stats.activeSpell];

            console.log("attacker.stats.activeSpell", attacker.stats.activeSpell);

            const attackPower = attacker.stats.magic + Math.random() * 0.5;
            const defensePower = defenderStats.magicDefense * 0.5 + Math.random() * 0.5;
            const attack = attackPower - defensePower;
            const damage = attack > 0
                ? Math.round(activeSpell.damage + Math.random() * attack)
                : 0;
            const manaCost = activeSpell.manaCost;
            const death = defender.healthRemain - damage <= 0;

            if (death) {
                defender.healthRemain = 0;
            }

            return { damage, manaCost, death };
        } catch (error) {
            // Existing behavior: errors are swallowed and reported as failure.
        }

        return false;
    },

    calcHealing(healer, defender) {
        try {
            const healerStats = healer.stats;
            const defenderStats = defender.stats;
            const amount = Math.round((healerStats.magic + Math.random() * 2) * 2);
            const health = defender.healthRemain + amount > defenderStats.health
                ? defenderStats.health - defender.healthRemain
                : amount;

            return { health };
        } catch (error) {
            // Existing behavior: errors are swallowed and reported as failure.
        }

        return false;
    },

    calcGameover(hero) {
        const result = { gameOver: true };

        try {
            console.log("Look for gameover");

            for (const x in hero.grid) {
                for (const y in hero.grid[x]) {
                    if (hero.grid[x][y] != 0) {
                        result.gameOver = false;
                        break;
                    }
                }
            }
        } catch (error) {
            // Existing behavior: errors are swallowed.
        }

        return result;
    },

    calcEndTurn(hero) {
        const result = { endTurn: true };

        try {
            console.log("Look for end turn", hero);

            for (const x in hero.monsters) {
                for (const y in hero.monsters[x]) {
                    const monster = hero.monsters[x][y];

                    if (monster != 0 && monster.speedRemain > 0) {
                        result.endTurn = false;
                        break;
                    }
                }
            }
        } catch (error) {
            // Existing behavior: errors are swallowed.
        }

        return result;
    },

    changeTurn() {
        try {
            const selection = gameData.battle.selection;

            if (selection.selected === true) {
                Game.Battle.Grid.unselect({ x: selection.x, y: selection.y });
            }

            if (selection.player == "right") {
                selection.turn++;
            }

            selection.player = selection.player == "left" ? "right" : "left";
            selection.hero = selection.player == "left" ? tribe.left : tribe.right;
            selection.enemyHero = selection.player == "left" ? tribe.right : tribe.left;

            for (const x in tribe.left.monsters) {
                for (const y in tribe.left.monsters[x]) {
                    const leftMonster = tribe.left.monsters[x][y];
                    const rightMonster = tribe.right.monsters[x][y];

                    if (typeof leftMonster === "object" && leftMonster !== null) {
                        leftMonster.speedRemain = leftMonster.stats.speed;

                        if (leftMonster.manaRemain < leftMonster.stats.magic) {
                            const manaRegeneration = Math.round(leftMonster.stats.magic / 3);
                            leftMonster.manaRemain += manaRegeneration;
                        }
                    }

                    if (typeof rightMonster === "object" && rightMonster !== null) {
                        rightMonster.speedRemain = rightMonster.stats.speed;

                        if (rightMonster.manaRemain < rightMonster.stats.magic) {
                            const manaRegeneration = Math.round(rightMonster.stats.magic / 3);
                            rightMonster.manaRemain += manaRegeneration;
                        }
                    }
                }
            }

            // Restart AI iteration after changing the turn.
            Game.Battle.Ai.iteration = 0;
            Game.Html.activePlayerGUI();
        } catch (error) {
            // Existing behavior: errors are swallowed.
        }
    },

    findNearAttackPath(from, cords) {
        try {
            from[0] = parseInt(from[0], 10);
            from[1] = parseInt(from[1], 10);
            cords[0] = parseInt(cords[0], 10);
            cords[1] = parseInt(cords[1], 10);

            if (Game.Battle.findInGrid({
                x: cords[0],
                y: cords[1],
                x2: from[0],
                y2: from[1]
            }) === false) {
                throw new Error("is so far");
            }
        } catch (error) {
            return false;
        }

        return true;
    },

    findInGrid(params) {
        try {
            const { x, y, x2, y2 } = params;
            const { gridWidth, gridHeight } = gameData.battle.plane;

            if (
                y < 0 || x < 0 || x >= gridWidth || y >= gridHeight ||
                y2 < 0 || x2 < 0 || x2 >= gridWidth || y2 >= gridHeight
            ) {
                throw new Error("out of grid");
            }

            const diffX = Math.abs(x - x2);
            const diffY = Math.abs(y - y2);

            if (diffY > 1 || diffX > 1) {
                throw new Error("is so far");
            }
        } catch (error) {
            return false;
        }

        return true;
    }
};
