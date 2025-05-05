import { ReplicatedStorage, Workspace } from "@rbxts/services";

export const ASSETS = ReplicatedStorage.WaitForChild("Assets") as Folder & {
    Enemies: Folder & {[key: string]: ModuleScript},
    Items: Folder,
    SkillAssets: Folder,
    Skills: Folder & {[key: string]: ModuleScript},
    StatusEffects: Folder & {[key: string]: ModuleScript},
    UI: UIAssets,
    Effects: EffectAssets,
    BaseItems: ModuleScript,
    BaseSkills: ModuleScript,
    Codes: ModuleScript,
    Dungeons: ModuleScript,
    Cosmetics: ModuleScript,
}

export const BASE_ITEMS = require(ASSETS.BaseItems) as {[key: string]: BaseItem};
export const BASE_SKILLS =  require(ASSETS.BaseSkills) as {[key: string]: Skill};

const statusEffects = {} as {[ID: string]: StatusEffect};
for (const module of ASSETS.StatusEffects.GetChildren()) {
    if (module.IsA("ModuleScript")) {
        const statusEffect = require(module) as StatusEffect;
        statusEffect.ID = module.Name;
        statusEffects[module.Name] = statusEffect;
    }
}
export const STATUS_EFFECTS = statusEffects;

export type CodeLoot = {
    gold: number,
    items: string[],
    cosmetics: number[],
    badges: number[]
}
export const CODES = require(ASSETS.Codes) as {[key: string]: CodeLoot};
export const DUNGEONS = require(ASSETS.Dungeons) as {[key: string]: Dungeon};
export const COSMETICS = require(ASSETS.Cosmetics) as string[];

export type UIAssets = Folder & {
    FreeCamera: ScreenGui,
    OverheadUI: OverheadUI,
    DamageEffect: BillboardGui & {
        DamageLabel: TextLabel;
    },
    StatusEffect: ImageLabel;
}

export type EffectAssets = Folder & {
    Damage: Folder
}

export type Bar = Frame & {
    UIStrokes: Folder & {
        ColorFrame: Frame & {
            UIStroke: UIStroke;
        }
    },
    ValueLabel: TextLabel,
    ExtendingBar: Frame;
}

export type OverheadUI = BillboardGui & {
    HealthBar: Bar,
    StatusEffects: Frame & {[key: string]: ImageLabel},
    NameLabel: TextLabel,
}

export const UI_ASSETS = ASSETS.WaitForChild("UI") as UIAssets;
export const EFFECT_ASSETS = ASSETS.WaitForChild("Effects") as EffectAssets;

export type ItemAssets = Folder & {[itemID: string]: Instance}

export const ITEM_ASSETS = ASSETS.WaitForChild("Items") as ItemAssets;

export const MOB_SPAWNS_FOLDER = Workspace.WaitForChild("MobSpawns") as Folder & {
    Dungeon: Folder | undefined;
};
export const BARRIERS_FOLDER = Workspace.WaitForChild("Barriers") as Folder;
export const SPAWN_LOCATION = Workspace.WaitForChild("SpawnLocation") as SpawnLocation;

export type WeaponAnims = {
    TOOL_NONE: string,
    WALK: string,
    SLASH: string[]
}

export const WEAPON_ANIMS: {[key: string]: WeaponAnims} = {
    Shortsword: {
        TOOL_NONE: "rbxassetid://0",
        WALK: "rbxassetid://7349435611",
        SLASH: ["rbxassetid://7293465971", "rbxassetid://7293468628"],
    },
    Sword: {
        TOOL_NONE: "rbxassetid://0",
        WALK: "rbxassetid://7357084908",
        SLASH: ["rbxassetid://7293465971", "rbxassetid://7293468628"],
    },
    Greatsword: {
        TOOL_NONE: "rbxassetid://9633220845",
        WALK: "rbxassetid://7357211304",
        SLASH: ["rbxassetid://7293465971", "rbxassetid://7293468628"],
    },
}

export const STAT_INFO: {[stat in Stat]: {name: string, description: string}} = {
	PhysicalStrength: {
		name: "Physical Strength",
		description: "Physical Strength increases the Physical damage of all your attacks."
	},
	MagicProficiency: {
		name: "Magical Proficiency",
		description: "Magical Proficiency increases the Magical damage of all your attacks."
	},
	Endurance: {
		name: "Endurance",
		description: "Endurance increases your maximum HP."
	},
	Dexterity: {
		name: "Dexterity",
		description: "Dexterity increases the chance of landing a critical (2x damage) hit."
	},
	Speed: {
		name: "Speed",
		description: "Speed increases the rate at which you are able to move."
	},
};

export default interface Skill {
    ID: string,
    name: string, 
    description?: string, 
    color?: Color3, 
    image?: string, 
    cooldown?: number, 
    scaleType?: string, 
    relativeDamageMulti?: number, 
    manaCost?: number, 
    SPCost?: number, 
    position?: number, 
    skillsNeeded?: string[] | string[][]
}

export type Trade = {
    P1: Player, 
    P2: Player, 
    OfferP1: Item[], 
    OfferP2: Item[], 
    AcceptedP1: boolean, 
    AcceptedP2: boolean
}

export type Party = {
    Host: Player, 
    Members: Player[], 
    Dungeon: Dungeon, 
    Difficulty: string, 
    Insane: boolean, 
    Public: boolean, 
    Whitelisted: Player[]
}

export type Enemy = {
    FirstDungeonAppearance: string, 
    Boss: boolean, 
    EXPDrop?: number, 
    StrengthMagnification: number, 
    WalkSpeed: number, 
    AggressionRange: number, 
    AttackingRange: number, 
    load: (humanoid: Humanoid) => void, 
    Behaviour: {
        Target?: Player, 
        Taunted: boolean, 
        WithinRange: boolean, 
        IdleStage: () => void,
        AggressionStage: (distance: number) => void, 
        AttackingStage: (distance: number) => void
    }
};

export type StatusEffect = {
    ID: string,
    Name: string,
    Description: string,
    Image: number,
    Hidden?: boolean,
    Effect: {
        SelfWalkSpeed?: (amplifier: number, walkSpeed: number) => number,
        SelfAutoRotate?: (amplifier: number, autoRotate: boolean) => boolean,
        DealingDamage?: (amplifier: number, damage: number) => number,
        TakingDamage?: (amplifier: number, damage: number) => number,
        Gravity?: (amplifier: number, gravity: number) => number,
        Tick?: (amplifier: number, deltaTime: number, humanoid: Humanoid) => void,
        OverheadUI?: (amplifier: number, overheadUI: OverheadUI) => void,
    }
}

export type Inventory = {
    equipment: {[equipmentSlot: string]: Item};
    storage: Item[];
}

export type SerialisedInventory = {
    equipment: {[equipmentSlot: string]: SerialisedItem};
    storage: SerialisedItem[];
}

export type BaseItem = {
	name: string,
	description?: string,
	type: string,
	wield?: string,
	levelReq: number,
	physical?: number,
	spell?: number,
	defense?: number,
	rarity?: string,
	sell?: number,
	upgrades?: number,
	maxUpgrades?: number,
    manaRegen?: number,
    tier?: number,
}

export type Item = {
    ID: string,
    name?: string,
    description?: string,
    type?: string,
    wield?: string,
    levelReq?: number,

    physicalP?: number,
    spellP?: number,
    defenseP?: number,
    upgrades?: number,
    maxUpgradesP?: number,
    sell?: number,
    rarity?: Rarity,   
    manaRegen?: number,
    tier?: number,
    creationTime: number,
}

export type SerialisedItem = {
    ID: string,
    physicalP?: number,
    spellP?: number,
    defenseP?: number,
    upgrades?: number,
    maxUpgradesP?: number,
    sell?: number,
    rarity?: string,
    creationTime: number,
    manaRegen?: number,
    tier?: number,
}
export interface ReadableItem extends Item {
    physical?: number;
    spell?: number;
    defense?: number;
    maxUpgrades?: number;
}

export type Rarity = {
    name: string,
    multiplier: number,
    color: Color3,
}

export interface PotentialLoot {
    quantity?: number,
    gold: number,
    items: {
        [itemID: string]: number
    }
    cosmetics?: {
        [cosmeticID: string]: number
    }
}

export interface Loot {
    gold: number,
    items: Item[],
    cosmetics: number[],
    badges: number[]
}

export interface DifficultyStats {
    levelReq: number,
    strengthMagnification: number,
    loot: PotentialLoot
}

export interface Dungeon {
    name: string,
    description: string,
    placeID: number,
    testing?: boolean,
    questingTheme: string,
    bossTheme: string,
    victoryTheme: string,
    time: number,
    difficulties: {[difficulty: string]: DifficultyStats}
}

export type QuestRecord = {
    DailyRewardsCollected?: number, 
	EnemiesKilled?: {[ID: string]: number}, 
	DungeonsCleared?: {[ID: string]: number},
	CurrentStage: number, 
	QuestCleared: boolean
}

export type Stats = {[stat in Stat]: number};
export type Stat = "PhysicalStrength" | "Endurance" | "MagicProficiency" | "Speed" | "Dexterity";

export type SkillsData = {
    Owned: Skill[],
    Equipped: {[key: string]: Skill}
}

export type SerialisedSkillsData = {
    Owned: string[],
    Equipped: {[key: string]: string}
}

export type CosmeticsData = {
    Owned: number[],
    Equipped: {
        Weapon: number | undefined,
        Armor: number | undefined
    }
}

export type Settings = {
    MusicDisabled: boolean,
    HideTradeRequests: boolean
}
export type Setting = keyof Settings;

export type Record = {
    EnemiesKilled: {[key: string]: number},
    DungeonsCleared: {[key: string]: number},
    DailyRewardsCollected: number,
    LastDaily: number,
    LastLeave?: number,
    DisplayName?: string,
    DisplayColor?: [number, number, number],
    RedeemedCodes: string[],
    CompletedEvents: string[],
    CompletedTrades?: {trade: Trade, otherPlayer: Player}[],
    QuestRecords: {[key: string]: QuestRecord},
}