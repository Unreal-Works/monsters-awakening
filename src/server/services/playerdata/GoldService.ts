import DataStore2 from "@rbxts/datastore2";
import { KnitServer, RemoteSignal, Signal } from "@rbxts/knit";
import { Players } from "@rbxts/services";

declare global {
	interface KnitServices {
		GoldService: typeof GoldService;
	}
}

const GoldService = KnitServer.CreateService({
    Name: "GoldService",

    Client: {
        goldChanged: new RemoteSignal<(gold: number) => void>(),

        getGold(player: Player) {
            return this.Server.getGold(player);
        }
    },

    getDataStore(player: Player) {
        return DataStore2<number>("Gold", player);
    },

    getGold(player: Player) {
        return this.getDataStore(player).Get(100);
    },

    setGold(player: Player, value: number) {
        this.getDataStore(player).Set(value);
    },

    incrementGold(player: Player, delta: number) {
        this.getDataStore(player).Increment(delta);
    },

    load(player: Player) {
        const dataStore = this.getDataStore(player);
        dataStore.OnUpdate((value) => {
            this.Client.goldChanged.Fire(player, value);
        });
    },
    
    KnitInit() {
        DataStore2.Combine("Data", "Gold");
    }
});


export = GoldService;

