import DataStore2 from "@rbxts/datastore2";
import { KnitServer, RemoteSignal } from "@rbxts/knit";
import { Settings, Setting } from "shared/utils/constants";

declare global {
	interface KnitServices {
		SettingsService: typeof SettingsService;
	}
}

const SettingsService = KnitServer.CreateService({
    Name: "SettingsService",

    Client: {
        settingsChanged: new RemoteSignal<(settings: Settings) => void>(),

        getSettings(player: Player) {
            return this.Server.getSettings(player);
        },

        setSettings(player: Player, value: Settings) {
            return this.Server.setSettings(player, value);
        },

        getSetting(player: Player, setting: Setting) {
            return this.Server.getSetting(player, setting);
        },

        setSetting(player: Player, setting: Setting, value: Settings[Setting]) {
            return this.Server.setSetting(player, setting, value);
        }
    },

    getDataStore(player: Player) {
        return DataStore2<Settings>("Settings", player);
    },

    getSettings(player: Player) {
        return this.getDataStore(player).Get({
            MusicDisabled: false,
            HideTradeRequests: false
        });
    },

    setSettings(player: Player, value: Settings) {
        this.getDataStore(player).Set(value);
    },

    getSetting(player: Player, setting: Setting) {
        return this.getSettings(player)[setting];
    },

    setSetting(player: Player, setting: Setting, value: Settings[Setting]) {
        const settings = this.getSettings(player);
        settings[setting] = value;
        this.setSettings(player, settings);
    },

    load(player: Player) {
        const dataStore = this.getDataStore(player);
            dataStore.OnUpdate((value) => {
                this.Client.settingsChanged.Fire(player, value);
            });
    },
    
    KnitInit() {
        DataStore2.Combine("Data", "Settings");
    }
});


export = SettingsService;

