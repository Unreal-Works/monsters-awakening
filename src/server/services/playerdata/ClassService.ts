import DataStore2 from "@rbxts/datastore2";
import { KnitServer, RemoteSignal, Signal } from "@rbxts/knit";

declare global {
	interface KnitServices {
		ClassService: typeof ClassService;
	}
}

const ClassService = KnitServer.CreateService({
    Name: "ClassService",

    classChanged: new Signal<(player: Player, playerClass: string) => void>(),
    
    Client: {
        classChanged: new RemoteSignal<(playerClass: string) => void>(),

        getClass(player: Player) {
            return this.Server.getClass(player);
        },

        setClass(player: Player, newClass: string) {
            this.Server.setClass(player, newClass);
        }
    },

    getDataStore(player: Player) {
        return DataStore2<string>("Class", player);
    },

    getClass(player: Player) {
        return this.getDataStore(player).Get("None");
    },

    setClass(player: Player, value: string) {
        if (value === "Warrior" || value === "Mage") {
            this.getDataStore(player).Set(value);
        }
    },

    load(player: Player) {
        const dataStore = this.getDataStore(player);
        dataStore.OnUpdate((value) => {
            this.classChanged.Fire(player, value);
            this.Client.classChanged.Fire(player, value);
        });
    },
    
    KnitInit() {
        DataStore2.Combine("Data", "Class");
    }
});


export = ClassService;

