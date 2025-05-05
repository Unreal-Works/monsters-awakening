import { KnitServer as Knit } from "@rbxts/knit";
import { Workspace } from "@rbxts/services";

declare global {
    interface KnitServices {
        MusicService: typeof MusicService;
    }
}

const MusicService = Knit.CreateService({
    Name: "MusicService",

    globalMusic: new Instance("Sound"),

    Client: {
        
    },

    play(id?: string, volume?: number) {
        if (id) {
            this.globalMusic.SoundId = id;
        }
        this.globalMusic.Volume = volume ?? 0.5;
        this.stop();
        this.resume();
    },

    resume() {
        this.globalMusic.Resume();
    },

    stop() {
        this.globalMusic.Stop();
    },

    pause() {
        this.globalMusic.Pause();
    },

    KnitInit() {
        this.globalMusic.Name = "SoundInstance";
        this.globalMusic.Looped = true;
        this.globalMusic.Parent = Workspace;
    },
});

export = MusicService;