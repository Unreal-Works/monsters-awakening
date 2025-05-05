import DataStore2 from "@rbxts/datastore2";
import { KnitServer, RemoteSignal, Signal } from "@rbxts/knit";
import { Players } from "@rbxts/services";

declare global {
	interface KnitServices {
		LevelService: typeof LevelService;
	}
}

const LevelService = KnitServer.CreateService({
    Name: "LevelService",
    levelChanged: new Signal<(player: Player, level: number) => void>(),

    Client: {
        levelChanged: new RemoteSignal<(level: number) => void>(),
        playerLevelsChanged: new RemoteSignal<(playerLevels: Map<string, number>) => void>(),

        getLevel(player: Player) {
            return this.Server.getLevel(player);
        },
        
        getPlayerLevels() {
            return this.Server.getPlayerLevels();
		}
    },

    getDataStore(player: Player) {
        return DataStore2<number>("Level", player);
    },

    getLevel(player: Player) {
        return this.getDataStore(player).Get(1);
    },
    
    setLevel(player: Player, value: number) {
        this.getDataStore(player).Set(value);
    },

    incrementLevel(player: Player, delta: number) {
        this.getDataStore(player).Increment(delta);
    },

    getPlayerLevels() {
        const levels = new Map<string, number>();
        for (const player of Players.GetPlayers()) {
            levels.set(player.Name, this.getLevel(player));
        }
        return levels;
    },
    
    load(player: Player) {
        const dataStore = this.getDataStore(player);
        dataStore.OnUpdate((value) => {
            this.levelChanged.Fire(player, value);
            this.Client.levelChanged.Fire(player, value);
        });
    },

    KnitInit() {
        DataStore2.Combine("Data", "Level");
        this.levelChanged.Connect(() => {
            this.Client.playerLevelsChanged.FireAll(this.getPlayerLevels());
        })
    }
});


export = LevelService;

