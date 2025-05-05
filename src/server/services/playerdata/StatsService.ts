import DataStore2 from "@rbxts/datastore2";
import { KnitServer, RemoteSignal, Signal } from "@rbxts/knit";
import LevelService from "server/services/playerdata/LevelService";
import { Stat, Stats } from "shared/utils/constants";
import SkillsService from "./SkillsService";

declare global {
	interface KnitServices {
		StatsService: typeof StatsService;
	}
}

const StatsService = KnitServer.CreateService({
    Name: "StatsService",
    statsUpdated: new Signal<(player: Player, stats: Stats) => void>(),
    totalLPChanged: new Signal<(player: Player, LP: number) => void>(),
    remainingLPChanged: new Signal<(player: Player, remainingLP: number) => void>(),

    Client: {
        statsUpdated: new RemoteSignal<(stats: Stats) => void>(),
        totalLPChanged: new RemoteSignal<(totalLP: number) => void>(),
        remainingLPChanged: new RemoteSignal<(remainingLP: number) => void>(),

        getRemainingLevelPoints(player: Player) {
            return this.Server.getRemainingLevelPoints(player);
        },

        getTotalLevelPoints(player: Player) {
            return this.Server.getTotalLevelPoints(player);
        },

        getStrengthStat(player: Player) {
            return this.Server.getStat(player, "PhysicalStrength");
        },

        getMagicProficiencyStat(player: Player) {
            return this.Server.getStat(player, "MagicProficiency");
        },

        getEnduranceStat(player: Player) {
            return this.Server.getStat(player, "Endurance");
        },

        getDexterityStat(player: Player) {
            return this.Server.getStat(player, "Dexterity");
        },

        getSpeedStat(player: Player) {
            return this.Server.getStat(player, "Speed");
        },

        getStats(player: Player) {
            return this.Server.getStats(player);
        },

        /**
         * Attempts to spend level points to increase the specified stat.
         * 
         * @param player Player to increment stat
         * @param stat Stat to increment
         * @param delta Number of incrementation
         */
        spendLevelPoints(player: Player, stat: Stat, delta: number) {
            if (this.Server.getRemainingLevelPoints(player) >= delta) {
                this.Server.incrementStat(player, stat, delta);
            }
        },

        removeLevelPoints(player: Player, stat: Stat, delta: number) {
            const current = this.Server.getStat(player, stat);
            if (current > delta - 1) {
                this.Server.incrementStat(player, stat, -delta);
            }
        },

        resetLevelPoints(player: Player) {
            return this.Server.resetLevelPoints(player);
        }
    },

    getDataStore(player: Player) {
        return DataStore2<Stats>("Stats", player);
    },
    
    getRawStats(player: Player) {
        return this.getDataStore(player).Get({
            PhysicalStrength: 0,
            MagicProficiency: 0,
            Endurance: 0,
            Dexterity: 0,
            Speed: 0
        });
    },

    setRawStats(player: Player, stats: Stats) {
        this.getDataStore(player).Set(stats);
    },

    getRawStat(player: Player, stat: Stat) {
        return this.getRawStats(player)[stat] ?? 0;
    },

    getStat(player: Player, stat: Stat) {
        return this.getRawStat(player, stat);
    },

    getStats(player: Player) {
        return this.getRawStats(player);
    },

    setRawStat(player: Player, stat: Stat, value: number) {
        const stats = this.getRawStats(player);
        stats[stat] = value;
        this.setRawStats(player, stats);
    },

    incrementStat(player: Player, stat: Stat, delta: number) {
        const stats = this.getRawStats(player);
        if (stats[stat] === undefined) {
            stats[stat] = 0;
        }
        stats[stat] += delta;
        if (stats[stat] < 0) {
            stats[stat] = 0;
        }
        this.setRawStats(player, stats);
    },

    resetLevelPoints(player: Player) {
        this.setRawStats(player, {
            PhysicalStrength: 0,
            MagicProficiency: 0,
            Endurance: 0,
            Dexterity: 0,
            Speed: 0
        });
    },

    getTotalLevelPoints(player: Player) {
        return LevelService.getLevel(player);
    },

    getRemainingLevelPoints(player: Player) {
        return this.getTotalLevelPoints(player) - 
            this.getRawStat(player, "PhysicalStrength") - 
            this.getRawStat(player, "MagicProficiency") - 
            this.getRawStat(player, "Endurance") - 
            this.getRawStat(player, "Dexterity") - 
            this.getRawStat(player, "Speed");
    },

    load(player: Player) {
        const dataStore = this.getDataStore(player);
        dataStore.OnUpdate((data) => {
            this.statsUpdated.Fire(player, data);
            this.Client.statsUpdated.Fire(player, data);
        });
        SkillsService.ownedSkillsChanged.Connect((player) => {
            const newStats = this.getStats(player);
            this.statsUpdated.Fire(player, newStats);
            this.Client.statsUpdated.Fire(player, newStats);
        });
        this.statsUpdated.Connect((player) => {
            const totalLP = this.getTotalLevelPoints(player);
            this.totalLPChanged.Fire(player, totalLP);
            this.Client.totalLPChanged.Fire(player, totalLP);
            onRemainingLPChanged(player);
        });
        const onRemainingLPChanged = (player: Player) => {
            const remainingLP = this.getRemainingLevelPoints(player);
            this.remainingLPChanged.Fire(player, remainingLP);
            this.Client.remainingLPChanged.Fire(player, remainingLP);
        }
        this.totalLPChanged.Connect(onRemainingLPChanged);
        for (const [i, v] of pairs(this.getRawStats(player))) {
            if (v < 0) {
                this.setRawStat(player, i, 0);
            }
        }
    },
    
    KnitInit() {
        DataStore2.Combine("Data", "Stats");
    }
});


export = StatsService;

