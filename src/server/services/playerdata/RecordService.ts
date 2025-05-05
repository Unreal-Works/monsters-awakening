import DataStore2 from "@rbxts/datastore2";
import { KnitServer, RemoteSignal, Signal } from "@rbxts/knit";
import { Players, TextService } from "@rbxts/services";
import LootService from "server/services/LootService";
import SpecialService from "server/services/playerdata/SpecialService";
import { generateRandomItem } from "shared/utils/Item";
import { BASE_ITEMS, CODES, Loot, QuestRecord, Record, Trade } from "shared/utils/constants";

declare global {
	interface KnitServices {
		RecordService: typeof RecordService;
	}
}

const RecordService = KnitServer.CreateService({
    Name: "RecordService",
    recordChanged: new Signal<(player: Player, record: Record) => void>(),

    Client: {
        recordChanged: new RemoteSignal<(record: Record) => void>(),

        getRecord(player: Player) {
            return this.Server.getRecord(player);
        },

        redeemCode(player: Player, code: string) {
            return this.Server.redeemCode(player, code);
        }
    },

    getDataStore(player: Player) {
        return DataStore2<Record>("Record", player);
    },

    getRecord(player: Player) {
        return this.getDataStore(player).Get({
            EnemiesKilled: {},
            DungeonsCleared: {},
            DailyRewardsCollected: 0,
            LastDaily: 0,
            LastLeave: 0,
            RedeemedCodes: [],
            CompletedEvents: [],
            CompletedTrades: [],
            QuestRecords: {},
        });
    },

    setRecord(player: Player, value: Record) {
        this.getDataStore(player).Set(value);
    },

    getEnemiesKilled(player: Player) {
        return this.getRecord(player).EnemiesKilled;
    },

    setEnemiesKilled(player: Player, value: {[key: string]: number}) {
        const record = this.getRecord(player);
        record.EnemiesKilled = value;
        this.setRecord(player, record);
    },

    getEnemyKills(player: Player, enemyID: string) {
        return this.getEnemiesKilled(player)[enemyID] ?? 0;
    },

    setEnemyKills(player: Player, enemyID: string, value: number) {
        const enemiesKilled = this.getEnemiesKilled(player);
        enemiesKilled[enemyID] = value;
        this.setEnemiesKilled(player, enemiesKilled);
    },

    incrementEnemyKills(player: Player, enemyID: string, delta: number) {
        const enemiesKilled = this.getEnemiesKilled(player);
        enemiesKilled[enemyID] += delta;
        this.setEnemiesKilled(player, enemiesKilled);
    },

    getDungeonsCleared(player: Player) {
        return this.getRecord(player).DungeonsCleared;
    },

    setDungeonsCleared(player: Player, value: {[key: string]: number}) {
        const record = this.getRecord(player);
        record.DungeonsCleared = value;
        this.setRecord(player, record);
    },

    getDungeonClears(player: Player, dungeonID: string) {
        return this.getDungeonsCleared(player)[dungeonID] ?? 0;
    },

    setDungeonClears(player: Player, dungeonID: string, value: number) {
        const dungeonsCleared = this.getDungeonsCleared(player);
        dungeonsCleared[dungeonID] = value;
        this.setDungeonsCleared(player, dungeonsCleared);
    },

    incrementDungeonClears(player: Player, dungeonID: string, delta: number) {
        const dungeonsCleared = this.getDungeonsCleared(player);
        dungeonsCleared[dungeonID] += delta;
        this.setEnemiesKilled(player, dungeonsCleared);
    },

    getLastDaily(player: Player) {
        return this.getRecord(player).LastDaily;
    },

    setLastDaily(player: Player, value: number) {
        const record = this.getRecord(player);
        record.LastDaily = value;
        this.setRecord(player, record);
    },

    getDailyRewardsCollected(player: Player) {
        return this.getRecord(player).DailyRewardsCollected;
    },

    setDailyRewardsCollected(player: Player, value: number) {
        const record = this.getRecord(player);
        record.DailyRewardsCollected = value;
        this.setRecord(player, record);
    },

    incrementDailyRewardsCollected(player: Player, delta: number) {
        const record = this.getRecord(player);
        record.DailyRewardsCollected += delta;
        this.setRecord(player, record);
    },
    
    getDisplayName(player: Player) {
        return this.getRecord(player).DisplayName;
    },

    setDisplayName(player: Player, value: string | undefined) {
        const record = this.getRecord(player);
        if (value) {
            const res = TextService.FilterStringAsync(value, player.UserId);
            value = res.GetNonChatStringForBroadcastAsync();
        }
        record.DisplayName = SpecialService.isVIP(player) ? value : undefined;
        this.setRecord(player, record);
    },

    getDisplayColor(player: Player) {
        const serColor = this.getRecord(player).DisplayColor;
        return serColor ? new Color3(serColor[0], serColor[1], serColor[2]) : undefined;
    },

    setDisplayColor(player: Player, value: Color3 | undefined) {
        const record = this.getRecord(player);
        record.DisplayColor = SpecialService.isVIP(player) ? (value ? [value.R, value.G, value.B] : undefined) : undefined;
        this.setRecord(player, record);
    },

    resetVIPOptions(player: Player) {
        this.setDisplayName(player, undefined);
        this.setDisplayColor(player, undefined);
    },
    
    getRedeemedCodes(player: Player) {
        return this.getRecord(player).RedeemedCodes;
    },

    setRedeemedCodes(player: Player, codes: string[]) {
        const record = this.getRecord(player);
        record.RedeemedCodes = codes;
        this.setRecord(player, record);
    },

    isCodeRedeemed(player: Player, code: string) {
        return this.getRedeemedCodes(player).includes(code);
    },

    redeemCode(player: Player, code: string) {
        for (const [i, v] of pairs(CODES)) {
            if (i === code && !this.isCodeRedeemed(player, code)) {
                const loot = ({...v} as unknown) as Loot;
                loot.items = v.items.map((value) => {
                    return generateRandomItem(BASE_ITEMS[value]);
                })
                LootService.giveLoot(player, loot);
                const record = this.getRecord(player);
                record.RedeemedCodes.push(code);
                this.setRecord(player, record);
                return true;
            }
        }
        return false;
    },

    getCompletedEvents(player: Player) {
        return this.getRecord(player).CompletedEvents;
    },

    setCompletedEvents(player: Player, completedEvents: string[]) {
        const record = this.getRecord(player);
        record.CompletedEvents = completedEvents;
        this.setRecord(player, record);
    },

    isEventCompleted(player: Player, eventID: string) {
        return this.getCompletedEvents(player).includes(eventID);
    },

    completeEvent(player: Player, eventID: string) {
        if (!this.isEventCompleted(player, eventID)) {
            const completedEvents = this.getCompletedEvents(player);
            completedEvents.push(eventID);
            this.setCompletedEvents(player, completedEvents);
            return true;
        }
        return false;
    },

    getCompletedTrades(player: Player) {
        return this.getRecord(player).CompletedTrades ?? [];
    },

    setCompletedTrades(player: Player, completedTrades: {trade: Trade, otherPlayer: Player}[]) {
        const record = this.getRecord(player);
        record.CompletedTrades = completedTrades;
        this.setRecord(player, record);
    },

    addCompletedTrade(player: Player, completedTrade: {trade: Trade, otherPlayer: Player}) {
        const completed = this.getCompletedTrades(player);
        completed.push(completedTrade);
        this.setCompletedTrades(player, completed);
    },

    getQuestRecords(player: Player) {
        return this.getRecord(player).QuestRecords;
    },

    setQuestRecords(player: Player, questRecords: {[key: string]: QuestRecord}) {
        const record = this.getRecord(player);
        record.QuestRecords = questRecords;
        this.setRecord(player, record);
    },

    getQuestRecord(player: Player, questID: string): QuestRecord {
        return this.getQuestRecords(player)[questID] ?? {
            CurrentStage: 0,
            QuestCleared: false
        };
    },

    setQuestRecord(player: Player, questID: string, questRecord: QuestRecord) {
        const questRecords = this.getQuestRecords(player);
        questRecords[questID] = questRecord;
        this.setQuestRecords(player, questRecords);
    },

    isQuestCompleted(player: Player, questID: string) {
        return this.getQuestRecord(player, questID).QuestCleared;
    },

    getCurrentQuestStage(player: Player, questID: string) {
        return this.getQuestRecord(player, questID).CurrentStage;
    },

    nextQuestStage(player: Player, questID: string) {
        const questRecord = this.getQuestRecord(player, questID);
        questRecord.CurrentStage += 1;
        this.setQuestRecord(player, questID, questRecord);
    },

    getRecordedEnemiesKilled(player: Player, questID: string) {
        return this.getQuestRecord(player, questID).EnemiesKilled ?? {};
    },

    getRecordedEnemyKills(player: Player, questID: string, enemyID: string) {
        return this.getRecordedEnemiesKilled(player, questID)[enemyID] ?? 0;
    },

    getAdjustedEnemyKills(player: Player, questID: string, enemyID: string) {
        return this.getEnemyKills(player, enemyID) - this.getRecordedEnemyKills(player, questID, enemyID);
    },

    getRecordedDungeonsCleared(player: Player, questID: string) {
        return this.getQuestRecord(player, questID).DungeonsCleared ?? {};
    },

    getRecordedDungeonClears(player: Player, questID: string, dungeonID: string) {
        return this.getRecordedDungeonsCleared(player, questID)[dungeonID] ?? 0;
    },

    getAdjustedDungeonClears(player: Player, questID: string, dungeonID: string) {
        return this.getDungeonClears(player, dungeonID) - this.getRecordedDungeonClears(player, questID, dungeonID);
    },

    getRecordedDailyRewardsCollected(player: Player, questID: string) {
        return this.getQuestRecord(player, questID).DailyRewardsCollected ?? 0;
    },

    getAdjustedDailyRewardsCollected(player: Player, questID: string) {
        return this.getDailyRewardsCollected(player) - this.getRecordedDailyRewardsCollected(player, questID);
    },

    getLastLeave(player: Player) {
        return this.getRecord(player).LastLeave ?? 0;
    },

    setLastLeave(player: Player, lastLeave: number) {
        const record = this.getRecord(player);
        record.LastLeave = lastLeave;
        this.setRecord(player, record);
    },

    load(player: Player) {
        const dataStore = this.getDataStore(player);
        dataStore.OnUpdate((value) => {
            this.recordChanged.Fire(player, value);
            this.Client.recordChanged.Fire(player, value);
        });
    },

    KnitInit() {
        DataStore2.Combine("Data", "Record");
        Players.PlayerRemoving.Connect((player) => {
            this.setLastLeave(player, tick());
        });
    }
});


export = RecordService;

