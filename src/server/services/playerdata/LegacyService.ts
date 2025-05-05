import DataStore2 from "@rbxts/datastore2";
import { KnitServer as Knit } from "@rbxts/knit";
import { deserialiseItem } from "shared/utils/Item";
import { getRarityFromName } from "shared/utils/Rarity";
import Skill, { BASE_ITEMS, Inventory, Item, SerialisedItem, Settings } from "shared/utils/constants";
import InventoryService from "./InventoryService";
import RecordService from "./RecordService";
import LevelService from "./LevelService";
import EXPService from "./EXPService";
import GoldService from "./GoldService";
import SkillsService from "./SkillsService";
import StatsService from "./StatsService";
import SettingsService from "./SettingsService";
import CosmeticsService from "./CosmeticsService";
import { getSkill } from "shared/utils/Skill";

declare global {
    interface KnitServices {
        LegacyService: typeof LegacyService;
    }
}

interface LegacyItem {
    ID: string,
    Physical: number,
    Spell: number,
    Health?: number,
    Upgrades: number,
    MaxUpgrades: number,
    Sell?: number,
    Rarity?: string,
    CreationTime: number,
}

interface LegacyInventory {
    Head?: LegacyItem,
    Chest?: LegacyItem,
    Weapon?: LegacyItem,
    Storage: LegacyItem[],
}

type LegacyQuestRecord = {
    DailyRewardsCollected?: number, 
	EnemiesKilled?: {[ID: string]: number}, 
	DungeonsCleared?: {[ID: string]: number},
	CurrentStage: number, 
	QuestCleared: boolean
}
interface LegacyPlayerData {
    Level: number, 
	EXP: number, 
	Gold: number, 
	Inventory: LegacyInventory, 
	OwnedSkills: string[],
    EquippedSkills: {[slot: string]: string},
	Strength: number,
	MagicPower: number,
	Endurance: number,
	Speed: number,
	Settings: {[key: string]: unknown}, 
	Cosmetics: number[], 
	CurrentCosmetic?: number, 
	LastDaily: number, 
	DisplayName?: string, 
	DisplayColour?: [number, number, number], 
	DailyRewardsCollected: number, 
	DungeonsCleared: {[dungeonID: string]: number}, 
	EnemiesKilled: {[enemyID: string]: number}, 
	QuestRecord: {[questID: string]: LegacyQuestRecord},
	RedeemedCodes: string[],
    CompletedEvents: string[];
}

const LegacyService = Knit.CreateService({
    Name: "LegacyService",

    Client: {

    },

    getDataStore(player: Player) {
        return DataStore2<LegacyPlayerData>("data", player);
    },

    revertUpgrades(statValue: number, upgrades: number): number {
        for (let i = 0; i < upgrades; i++) {
            statValue -= i > 90 ? 10 : (math.floor(i * 0.1) + 1);
        }
        return statValue;
    },
    
    getP(player: Player, item: LegacyItem, stat: string, value: number, upgrades: number) {
        const originalValue = stat === "maxUpgrades" ? value : this.revertUpgrades(value, upgrades);
        let maxValue = ((BASE_ITEMS[item.ID] as unknown) as { [key: string]: number; })[stat];
        const rarity = getRarityFromName(item.Rarity);
        if (!maxValue) {
            this.log(player, "Irregularity found. Item of ID " + item.ID + " has stat " + stat + ".");
            this.log(player, "Removing this stat altogether.");
            return undefined;
        }
        maxValue *= rarity ? rarity.multiplier : 1;
        const res = math.floor(originalValue / maxValue * 100);
        return res > 100 ? 100 : (res < 0 ? 0 : res);
    },
    
    convertLegacyItem(player: Player, legacy: LegacyItem): Item | undefined {
        const serialised: SerialisedItem = {
            ID: legacy.ID,
            physicalP: legacy.Physical >= 0 ? this.getP(player, legacy, "physical", legacy.Physical, legacy.Upgrades) : undefined,
            spellP: legacy.Spell >= 0 ? this.getP(player, legacy, "spell", legacy.Spell, legacy.Upgrades) : undefined,
            defenseP: legacy.Health ? this.getP(player, legacy, "defense", legacy.Health * legacy.Health, legacy.Upgrades) : undefined,
            upgrades: legacy.Upgrades,
            maxUpgradesP: legacy.MaxUpgrades >= 0 ? this.getP(player, legacy, "maxUpgrades", legacy.MaxUpgrades, 0) : undefined,
            sell: legacy.Sell,
            rarity: legacy.Rarity,
            creationTime: legacy.CreationTime,
        };
        const baseItem = BASE_ITEMS[serialised.ID];
        if (!baseItem) {
            this.log(player, "Cannot find item of ID " + legacy.ID + ". Ignoring this item.");
            return undefined;
        }
        else if (baseItem.type === "ManaPotion") {
            this.log(player, "Found mana potion with " + legacy.Upgrades + " upgrades.");
            serialised.manaRegen = legacy.Upgrades;
            serialised.upgrades = 0;
        }
        return deserialiseItem(serialised);
    },
    
    convertLegacyInventory(player: Player, legacy: LegacyInventory): Inventory {
        const equipment: {[key: string]: Item} = {};
        if (legacy.Head) {
            const converted = this.convertLegacyItem(player, legacy.Head);
            if (converted) {
                equipment.Helmet = converted;
            }
        }
        if (legacy.Chest) {
            const converted = this.convertLegacyItem(player, legacy.Chest);
            if (converted) {
                equipment.Chestplate = converted;
            }
        }
        if (legacy.Weapon) {
            const converted = this.convertLegacyItem(player, legacy.Weapon);
            if (converted) {
                equipment.Weapon = converted;
            }
        }
        const storage: Item[] = [];
        for (const legacyItem of legacy.Storage) {
            const converted = this.convertLegacyItem(player, legacyItem);
            if (converted) {
                storage.push(converted);
            }
        }
        return {
            equipment: equipment,
            storage: storage,
        };
    },

    getLegacyData(player: Player) {
        return RecordService.isEventCompleted(player, "PREBETA3CONVERT") ? undefined : this.getDataStore(player).Get();
    },

    clearLegacyData(player: Player) {
        RecordService.completeEvent(player, "PREBETA3CONVERT");
    },

    log(player: Player, msg: string) {
        player.SetAttribute("LoadStatus", msg);
    },

    convertLegacyData(player: Player) {
        const legacyData = this.getLegacyData(player);
        if (legacyData) {
            this.log(player, "Found legacy data before the event PREBETA3CONVERT.");
            task.wait(0.1);
            this.log(player, "Converting legacy data...");
            LevelService.setLevel(player, legacyData.Level);
            this.log(player, "Set level.");
            EXPService.setEXP(player, legacyData.EXP);
            this.log(player, "Set EXP.");
            GoldService.setGold(player, legacyData.Gold);
            this.log(player, "Set gold.");
            InventoryService.setInventory(player, this.convertLegacyInventory(player, legacyData.Inventory));
            this.log(player, "Converted legacy items.");
            const equipped: {[key: string]: Skill} = {};
            for (const [i, v] of pairs(legacyData.EquippedSkills)) {
                const skill = getSkill(v);
                if (skill) {
                    equipped[i] = skill;
                }
            }
            const owned: Skill[] = [];
            for (const v of legacyData.OwnedSkills) {
                const skill = getSkill(v);
                if (skill) {
                    owned.push(skill);
                }
            }
            SkillsService.setSkillsData(player, {
                Equipped: {},
                Owned: []
            });
            this.log(player, "Converted legacy skills.");
            StatsService.setRawStats(player, {
                PhysicalStrength: legacyData.Strength,
                MagicProficiency: legacyData.MagicPower,
                Endurance: legacyData.Endurance,
                Dexterity: 0,
                Speed: 0,
            });
            this.log(player, "Converted stats.");
            SettingsService.setSettings(player, legacyData.Settings as Settings);
            this.log(player, "Converted settings.");
            CosmeticsService.setCosmeticsData(player, {
                Owned: legacyData.Cosmetics,
                Equipped: {
                    Weapon: undefined,
                    Armor: undefined
                }
            });
            this.log(player, "Converted cosmetics.");
            if (legacyData.DisplayName) {
                RecordService.setDisplayName(player, legacyData.DisplayName);
            }
            this.log(player, "Converted display name.");
            RecordService.setEnemiesKilled(player, legacyData.EnemiesKilled);
            this.log(player, "Converted enemies killed.");
            RecordService.setDungeonsCleared(player, legacyData.DungeonsCleared);
            this.log(player, "Converted dungeons cleared.");
            this.clearLegacyData(player);
            this.convertLegacyData(player);
        }
        for (const v of InventoryService.getItemsOfTypeInStorage(player, "DailyReward")) {
            if (InventoryService.removeItemFromStorage(player, v)) {
                GoldService.incrementGold(player, 50000);
            }
        }
        if (!RecordService.isEventCompleted(player, "PREBETA3VALUETWEAKCONVERT")) {
            RecordService.completeEvent(player, "PREBETA3VALUETWEAKCONVERT");
            EXPService.setEXP(player, 0);
        }
    },

    KnitInit() {

    },
});

export = LegacyService;