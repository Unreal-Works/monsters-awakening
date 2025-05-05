import DataStore2 from "@rbxts/datastore2";
import { KnitServer, RemoteSignal, Signal } from "@rbxts/knit";
import LevelService from "server/services/playerdata/LevelService";

declare global {
	interface KnitServices {
		EXPService: typeof EXPService;
	}
}

const EXPService = KnitServer.CreateService({
    Name: "EXPService",
    EXPChanged: new Signal<(player: Player, EXP: number) => void>(),
    maxEXPPerLevel: new Map<number, number>(),
    maxEXPChanged: new Signal<(player: Player, maxEXP: number) => void>(),

    Client: {
        EXPChanged: new RemoteSignal<(EXP: number) => void>(),
        maxEXPChanged: new RemoteSignal<(maxEXP: number) => void>(),

        getEXP(player: Player) {
            return this.Server.getEXP(player);
        },

        getMaxEXP(player: Player, level?: number) {
            return this.Server.getMaxEXP(level ?? LevelService.getLevel(player));
        },
    },

    getDataStore(player: Player) {
        return DataStore2<number>("EXP", player);
    },

    getEXP(player: Player) {
        return this.getDataStore(player).Get(0);
    },

    getMaxEXP(level: number) {
        const cached = this.maxEXPPerLevel.get(level);
        if (cached) {
            return cached;
        }
        else {
            let maxEXP = math.round(math.pow(1.1, level + 25) * 80 - 853);
            const divisor = tostring(maxEXP).size() - 2;
            maxEXP = math.round(maxEXP / math.pow(10, divisor)) * math.pow(10, divisor);
            this.maxEXPPerLevel.set(level, maxEXP);
            return maxEXP;
        } 
    },

    setEXP(player: Player, value: number) {
        this.getDataStore(player).Set(value);
    },

    incrementEXP(player: Player, delta: number) {
        this.getDataStore(player).Increment(delta);
    },

    load(player: Player) {
        const dataStore = this.getDataStore(player);
        dataStore.OnUpdate((value) => {
            this.EXPChanged.Fire(player, value);
            this.Client.EXPChanged.Fire(player, value);
            const maxEXP = this.getMaxEXP(LevelService.getLevel(player));
            if (value >= maxEXP) {
                this.incrementEXP(player, -maxEXP);
                LevelService.incrementLevel(player, 1);
            }
        });
        LevelService.levelChanged.Connect((player, level) => {
            this.maxEXPChanged.Fire(player, this.getMaxEXP(level));
            this.Client.maxEXPChanged.Fire(player, this.getMaxEXP(level));
        });
    },
    
    KnitInit() {
        DataStore2.Combine("Data", "EXP");
        for (let i = 1; i < 100; i++) {
            this.getMaxEXP(i);
        }
    }
});


export = EXPService;

