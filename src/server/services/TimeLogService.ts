import DataStore2 from "@rbxts/datastore2";
import { KnitServer, RemoteSignal } from "@rbxts/knit";

declare global {
	interface KnitServices {
		TimeLogService: typeof TimeLogService;
	}
}

type TimeLog = {[key: string]: number}

const TimeLogService = KnitServer.CreateService({
    Name: "TimeLogService",
    
    Client: {
        timeLogChanged: new RemoteSignal<(timeLog: TimeLog) => void>(),

        getTimeLog(player: Player) {
            return this.Server.getTimeLog(player);
        }
    },

    getDataStore(player: Player) {
        return DataStore2<TimeLog>("TimeLog", player);
    },

    getTimeLog(player: Player) {
        return this.getDataStore(player).Get({});
    },

    setTimeLog(player: Player, timeLog: TimeLog) {
        this.getDataStore(player).Set(timeLog);
    },

    logTime(player: Player, key: string) {
        const timeLog = this.getTimeLog(player);
        timeLog[key] = tick();
        this.setTimeLog(player, timeLog);
    },

    lastLog(player: Player, key: string) {
        return this.getTimeLog(player)[key] ?? 0;
    },

    timeSinceLastLog(player: Player, key: string): number {
        return tick() - this.lastLog(player, key);
    },

    load(player: Player) {
        this.getDataStore(player).OnUpdate((value) => {
            this.Client.timeLogChanged.Fire(player, value);
        });
    },

    KnitInit() {
        DataStore2.Combine("Data", "TimeLog");
    }
});


export = TimeLogService;