import { KnitClient as Knit, KnitClient, Signal } from "@rbxts/knit";
import { CollectionService, TeleportService } from "@rbxts/services";
import { BOSS_LABEL, LOCAL_PLAYER, START_BUTTON, TIMER_WINDOW } from "client/constants";
import { isLobby } from "shared/utils/Dungeon";
import { getSkill } from "shared/utils/Skill";
import Skill, { CosmeticsData, Inventory, Record, Settings, SkillsData, Stats } from "shared/utils/constants";
import { convertToMMSS } from "shared/utils/vrldk/NumberAbbreviations";

declare global {
    interface KnitControllers {
        DataController: typeof DataController;
    }
}

const ClassService = KnitClient.GetService("ClassService");
const CosmeticsService = KnitClient.GetService("CosmeticsService");
const EXPService = KnitClient.GetService("EXPService");
const GoldService = KnitClient.GetService("GoldService");
const SnowflakesService = KnitClient.GetService("SnowflakesService");
const InventoryService = KnitClient.GetService("InventoryService");
const LevelService = KnitClient.GetService("LevelService");
const RecordService = KnitClient.GetService("RecordService");
const SkillsService = KnitClient.GetService("SkillsService");
const StatsService = KnitClient.GetService("StatsService");
const SettingsService = KnitClient.GetService("SettingsService");
const DungeonService = KnitClient.GetService("DungeonService");

const DataController = Knit.CreateController({
    Name: "DataController",

    level: LevelService.getLevel(),
    levelChanged: new Signal<(level: number) => void>(),
    playerLevels: LevelService.getPlayerLevels(),
    playerLevelsChanged: new Signal<(playerLevels: Map<string, number>) => void>(),

    class: ClassService.getClass(),
    classChanged: new Signal<(playerClass: string) => void>(),
    EXP: EXPService.getEXP(),
    EXPChanged: new Signal<(EXP: number) => void>(),
    maxEXP: EXPService.getMaxEXP(),
    maxEXPChanged: new Signal<(maxEXP: number) => void>(),
    gold: GoldService.getGold(),
    goldChanged: new Signal<(gold: number) => void>(),
    snowflakes: SnowflakesService.getSnowflakes(),
    snowflakesChanged: new Signal<(snowflakes: number) => void>(),
    inventory: InventoryService.getInventory(),
    inventoryChanged: new Signal<(inventory: Inventory) => void>(),

    skills: SkillsService.getSkillsData(),
    skillsUpdated: new Signal<(skills: SkillsData) => void>(),
    ownedSkillsChanged: new Signal<(ownedSkills: Skill[]) => void>(),
    totalSP: SkillsService.getTotalSkillPoints(),
    totalSPChanged: new Signal<(totalSP: number) => void>(),
    remainingSP: SkillsService.getRemainingSkillPoints(),
    remainingSPChanged: new Signal<(remainingSP: number) => void>(),

    stats: StatsService.getStats(),
    statsUpdated: new Signal<(stats: Stats) => void>(),
    totalLP: StatsService.getTotalLevelPoints(),
    totalLPChanged: new Signal<(totalLP: number) => void>(),
    remainingLP: StatsService.getRemainingLevelPoints(),
    remainingLPChanged: new Signal<(remainingLP: number) => void>(),
    cosmetics: CosmeticsService.getCosmeticsData(),
    cosmeticsUpdated: new Signal<(cosmetics: CosmeticsData) => void>(),
    record: RecordService.getRecord(),
    recordChanged: new Signal<(record: Record) => void>(),
    settings: SettingsService.getSettings(), 
    settingsChanged: new Signal<(settings: Settings) => void>(),

    isSkillOwned(skill: Skill) {
        for (const ownedSkill of DataController.skills.Owned) {
            if (ownedSkill.ID === skill.ID) {
                return true;
            }
        }
        return false;
    },

    isSkillEquipped(skill: Skill) {
        for (const [_key, ownedSkill] of pairs(DataController.skills.Equipped)) {
            if (ownedSkill.ID === skill.ID) {
                return true;
            }
        }
        return false;
    },

    KnitInit() {
        ClassService.classChanged.Connect((playerClass) => {
            this.class = playerClass;
            this.classChanged.Fire(playerClass);
        });
        LevelService.levelChanged.Connect((level) => {
            this.level = level;
            this.levelChanged.Fire(level);
        });
        LevelService.playerLevelsChanged.Connect((playerLevels) => {
            this.playerLevels = playerLevels;
            this.playerLevelsChanged.Fire(playerLevels);
        });
        EXPService.EXPChanged.Connect((EXP) => {
            this.EXP = EXP;
            this.EXPChanged.Fire(EXP);
        });
        EXPService.maxEXPChanged.Connect((maxEXP) => {
            this.maxEXP = maxEXP;
            this.maxEXPChanged.Fire(maxEXP);
        });
        SnowflakesService.snowflakesChanged.Connect((snowflakes) => {
            this.snowflakes = snowflakes;
            this.snowflakesChanged.Fire(snowflakes);
        });
        GoldService.goldChanged.Connect((gold) => {
            this.gold = gold;
            this.goldChanged.Fire(gold);
        });
        InventoryService.inventoryChanged.Connect((inventory) => {
            this.inventory = inventory;
            this.inventoryChanged.Fire(inventory);
        });
        SkillsService.skillsUpdated.Connect((skills) => {
            this.skills = skills;
            this.skillsUpdated.Fire(skills);
        });
        SkillsService.ownedSkillsChanged.Connect((owned) => {
            this.skills.Owned = owned;
            this.ownedSkillsChanged.Fire(owned);
        });
        SkillsService.totalSPChanged.Connect((totalSP) => {
            this.totalSP = totalSP;
            this.totalSPChanged.Fire(totalSP);
        });
        SkillsService.remainingSPChanged.Connect((remainingSP) => {
            this.remainingSP = remainingSP;
            this.remainingSPChanged.Fire(remainingSP);
        });
        StatsService.statsUpdated.Connect((stats) => {
            this.stats = stats;
            this.statsUpdated.Fire(stats);
        });
        StatsService.totalLPChanged.Connect((totalLP) => {
            this.totalLP = totalLP;
            this.totalLPChanged.Fire(totalLP);
        });
        StatsService.remainingLPChanged.Connect((remainingLP) => {
            this.remainingLP = remainingLP;
            this.remainingLPChanged.Fire(remainingLP);
        });
        CosmeticsService.cosmeticsUpdated.Connect((cosmetics) => {
            this.cosmetics = cosmetics;
            this.cosmeticsUpdated.Fire(cosmetics);
        });
        RecordService.recordChanged.Connect((record) => {
            this.record = record;
            this.recordChanged.Fire(record);
        });
        SettingsService.settingsChanged.Connect((settings) => {
            this.settings = settings;
            this.settingsChanged.Fire(settings);
        });

        this.levelChanged.Fire(this.level);
        this.playerLevelsChanged.Fire(this.playerLevels);
        this.EXPChanged.Fire(this.EXP);
        this.maxEXPChanged.Fire(this.maxEXP);
        this.goldChanged.Fire(this.gold);
        this.snowflakesChanged.Fire(this.snowflakes);
        this.inventoryChanged.Fire(this.inventory);
        this.skillsUpdated.Fire(this.skills);
        this.ownedSkillsChanged.Fire(this.skills.Owned);
        this.totalSPChanged.Fire(this.totalSP);
        this.remainingSPChanged.Fire(this.remainingSP);
        this.statsUpdated.Fire(this.stats);
        this.totalLPChanged.Fire(this.totalLP);
        this.remainingLPChanged.Fire(this.remainingLP);
        this.cosmeticsUpdated.Fire(this.cosmetics);
        this.recordChanged.Fire(this.record);

        const tpData = TeleportService.GetLocalPlayerTeleportData() as {Difficulty: string, Insane: boolean};
        DungeonService.setDifficulty(tpData ? tpData.Difficulty : "Medium");
        if (tpData && tpData.Insane) {
            DungeonService.enableInsaneMode();
        }
    }
});

export = DataController;