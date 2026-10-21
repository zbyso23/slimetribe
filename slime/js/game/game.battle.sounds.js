Game.Battle.Sounds = {
    ready: false,
    playing: false,

    play() {
        try {
            if (gameData.settings.graphics.mobile === "on") return;
            if (Game.Battle.Sounds.ready === false) throw "noready";

            const audio = document.getElementById("battle-sound");
            audio.addEventListener("canplaythrough", function () {
                if (Game.Battle.Sounds.playing === true) this.play();
            }, false);
        } catch (error) {
            // Preserve the original error-swallowing behavior.
        }

        Game.Battle.Sounds.playing = true;
    },

    isPlay() {
        if (gameData.settings.graphics.mobile === "on") return;

        const audio = document.getElementById("battle-sound");
        return audio.played;
    },

    isPause() {
        if (gameData.settings.graphics.mobile === "on") return;

        const audio = document.getElementById("battle-sound");
        return audio.paused;
    },

    isEnd() {
        if (gameData.settings.graphics.mobile === "on") return;

        const audio = document.getElementById("battle-sound");
        return audio.ended;
    },

    stop() {
        try {
            if (gameData.settings.graphics.mobile === "on") return;

            Game.Battle.Sounds.pause();
            Game.Battle.Sounds.playing = false;

            if (Game.Battle.Sounds.ready === false) throw "noready";
            if (Game.Battle.Sounds.isEnd() === true) return;
        } catch (error) {
            // Preserve the original error-swallowing behavior.
        }
    },

    pause() {
        try {
            if (gameData.settings.graphics.mobile === "on") return;
            if (Game.Battle.Sounds.ready === false) throw "noready";
            if (Game.Battle.Sounds.isPaused() === true) return;

            const audio = document.getElementById("battle-sound");
            audio.removeEventListener("ended", function () {
                this.currentTime = 0;
                if (Game.Battle.Sounds.playing === true) this.play();
            }, false);
            audio.pause();
        } catch (error) {
            // Preserve the original error-swallowing behavior.
        }
    },

    load(url) {
        if (gameData.settings.graphics.mobile === "on") return;

        Game.Battle.Sounds.stop();

        // const mp3Audio = document.getElementById("battle-sound-mp3");
        const oggAudio = document.getElementById("battle-sound-ogg");
        // mp3Audio.setAttribute("src", `${url}.mp3`);
        oggAudio.setAttribute("src", `${url}.ogg`);

        const audio = document.getElementById("battle-sound");
        audio.load();
        audio.addEventListener("ended", function () {
            this.currentTime = 0;
            if (Game.Battle.Sounds.playing === true) this.play();
        }, false);

        Game.Battle.Sounds.ready = true;
    },

    _repeat() {},

    prepare(params) {
        try {
            if (gameData.settings.graphics.mobile === "on") return;
            if (typeof params.sounds.parts[params.active] === "undefined") throw "nosound";

            Game.Battle.Sounds.load(
                params.sounds.baseUrl + params.sounds.parts[params.active]
            );
            Game.Battle.Sounds.ready = true;
        } catch (error) {
            Game.Battle.Sounds.ready = false;
        }
    },

    preloader() {
        if (gameData.settings.graphics.mobile === "on") return;

        const sounds = Game.Battle.Sounds.__findMonsterSounds();
        for (const sound of sounds) {
            ++gameData.loader.soundsCount;

            const audio = new Audio();
            audio.addEventListener(
                "canplaythrough",
                Game.Battle.Sounds.preloaderLoaded,
                false
            );
            audio.src = `${sound}.ogg`;
        }
    },

    __findMonsterSounds() {
        if (gameData.settings.graphics.mobile === "on") return;

        const sounds = [];
        for (const monsterKey in monstersList) {
            const monster = monstersList[monsterKey];
            const baseUrl = monster.sounds.baseUrl;

            for (const partKey in monster.sounds.parts) {
                const url = baseUrl + monster.sounds.parts[partKey];
                const alreadySeen = sounds.includes(url);
                if (alreadySeen === false) sounds.push(url);
            }
        }

        return sounds;
    },

    preloaderLoaded() {
        if (gameData.settings.graphics.mobile === "on") return;

        --gameData.loader.soundsCount;
        if (gameData.loader.soundsCount === 0) gameData.loader.soundsLoaded = true;
    }
};
