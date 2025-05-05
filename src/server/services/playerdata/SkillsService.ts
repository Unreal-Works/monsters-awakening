import DataStore2 from "@rbxts/datastore2";
import { KnitServer, RemoteSignal, Signal } from "@rbxts/knit";
import TimeLogService from "server/services/TimeLogService";
import LevelService from "server/services/playerdata/LevelService";
import { getDamageMultiplier, getSPCost, getSkill, getSkillID } from "shared/utils/Skill";
import Skill, { ASSETS, SerialisedSkillsData, SkillsData } from "shared/utils/constants";

declare global {
	interface KnitServices {
		SkillsService: typeof SkillsService;
	}
}

type SkillFunction = (player: Player, scaleType: string, damage: number) => void;

const SkillsService = KnitServer.CreateService({
    Name: "SkillsService",
    skillsUpdated: new Signal<(player: Player, skillsData: SkillsData) => void>(),
    equippedSkillsChanged: new Signal<(player: Player, equipped: {[key: string]: Skill}) => void>(),
    ownedSkillsChanged: new Signal<(player: Player, owned: Skill[]) => void>(),
    totalSPChanged: new Signal<(player: Player, totalSP: number) => void>(),
    remainingSPChanged: new Signal<(player: Player, sp: number) => void>(),
    slashSkill: getSkill("Slash"),
    manaPotionSkill: getSkill("ManaPotion"),

    Client: {
        skillsUpdated: new RemoteSignal<(skillsData: SkillsData) => void>(),
        equippedSkillsChanged: new RemoteSignal<(equipped: {[key: string]: Skill}) => void>(),
        ownedSkillsChanged: new RemoteSignal<(owned: Skill[]) => void>(),
        totalSPChanged: new RemoteSignal<(totalSP: number) => void>(),
        remainingSPChanged: new RemoteSignal<(sp: number) => void>(),

        equipSkill(player: Player, skill: Skill | undefined, slotNumber: number) {
            return this.Server.equipSkill(player, skill, slotNumber);
        },

        getSkillsData(player: Player) {
            return this.Server.getSkillsData(player);
        },

        getEquippedSkills(player: Player) {
            return this.Server.getEquippedSkills(player);
        },

        getOwnedSkills(player: Player) {
            return this.Server.getOwnedSkills(player);
        },

        respecSkills(player: Player) {
            return this.Server.respecSkills(player);
        },

        learnSkill(player: Player, skill: Skill) {
            return this.Server.learnSkill(player, skill);
        },

        useSkill(player: Player, slotNumber: number): boolean {
            const key = "CDUNIX" + slotNumber;
            const skill = this.Server.getEquippedSkill(player, slotNumber);
            if (!skill || TimeLogService.timeSinceLastLog(player, key) < (skill.cooldown as number)) {
                return false;
            }
            const result = this.Server.useSkill(player, skill);
            if (result === true) {
                TimeLogService.logTime(player, key);
            }
            return result;
        },

        getTotalSkillPoints(player: Player) {
            return this.Server.getTotalSkillPoints(player);
        },

        getRemainingSkillPoints(player: Player) {
            return this.Server.getRemainingSkillPoints(player);
        },
    },

    getDataStore(player: Player) {
        return DataStore2<SkillsData>("Skills", player);
    },

    getSkillsData(player: Player) {
        return this.getDataStore(player).Get({
            Owned: [],
            Equipped: {}
        });
    },

    setSkillsData(player: Player, skillsData: SkillsData) {
        this.getDataStore(player).Set(skillsData);
    },

    getOwnedSkills(player: Player) {
        return this.getSkillsData(player).Owned;
    },
    
    setOwnedSkills(player: Player, owned: Skill[]) {
        const skillsData = this.getSkillsData(player);
        skillsData.Owned = owned;
        this.setSkillsData(player, skillsData);
        this.ownedSkillsChanged.Fire(player, owned);
        this.Client.ownedSkillsChanged.Fire(player, owned);
    },

    setSkillOwned(player: Player, skill: Skill, isOwned: boolean) {
        const ownedSkills = this.getOwnedSkills(player); 
        if (isOwned && !this.isSkillOwned(player, skill)) {
            this.setOwnedSkills(player, [...ownedSkills, skill]);
        }
        else if (!isOwned) {
            this.setOwnedSkills(player, ownedSkills.filter((ownedSkill) => {
                return skill.ID !== ownedSkill.ID;
            }));
        }
    },
    
    isSkillOwned(player: Player, skill: Skill) {
        for (const ownedSkill of this.getOwnedSkills(player)) {
            if (ownedSkill.ID === skill.ID) {
                return true;
            }
        }
        return false;
    },

    learnSkill(player: Player, skill: Skill) {
        let siblingSkillsLearnt = 0;
        skill = getSkill(skill.ID) as Skill;

        for (const v of this.getOwnedSkills(player)) {
            if (v === skill) {
                return "This skill has already been learnt.";
            }
            if (v.position === skill.position) {
                siblingSkillsLearnt += 1;
            }
        }
        if (siblingSkillsLearnt > 1) {
            return "You cannot learn more than 2 skills of the same level.";
        }
        let skillNeeded = undefined as string | undefined;
        if (skill.skillsNeeded) {
            for (const v of skill.skillsNeeded) {
                if (typeOf(v) === "table") {
                    let allow = false;
                    for (const c of (v as string[])) {
                        const cSkill = getSkill(c);
                        if (cSkill && this.isSkillOwned(player, cSkill)) {
                            allow = true;
                        }
                    }
                    if (allow === false) {
                        skillNeeded = "initial skills";
                    }
                }
                else if (!this.isSkillOwned(player, getSkill(v as string) as Skill)) {
                    skillNeeded = (getSkill(v as string) as Skill).name;
                }
            }
        }

        if (skillNeeded) {
            return "You must first learn " + skillNeeded + " before learning this skill.";
        }
        else if (this.getRemainingSkillPoints(player) < getSPCost(skill)) {
            return "You need " + getSPCost(skill) + " skill points to learn this skill."   
        }
        this.setSkillOwned(player, skill, true);
    },

    getEquippedSkills(player: Player) {
        const e = this.getSkillsData(player).Equipped;
        if (this.manaPotionSkill) {
            e.b5 = this.manaPotionSkill;
        }
        if (this.slashSkill) {
            e.b6 = this.slashSkill;
        }
        return e;
    },
    
    setEquippedSkills(player: Player, equipped: {[key: string]: Skill}) {
        const skillsData = this.getSkillsData(player);
        skillsData.Equipped = equipped;
        this.setSkillsData(player, skillsData);
        this.equippedSkillsChanged.Fire(player, equipped);
        this.Client.equippedSkillsChanged.Fire(player, equipped);
    },

    equipSkill(player: Player, skill: Skill | undefined, slotNumber: number) {
        if (!skill || this.isSkillOwned(player, skill)) {
            const cur = {...this.getEquippedSkills(player)};
            if (skill && slotNumber > 0 && slotNumber < 5) {
                cur["b" + slotNumber] = skill;
            }
            this.setEquippedSkills(player, cur);
        }
    },
    
    getEquippedSkill(player: Player, slotNumber: number) {
        return this.getEquippedSkills(player)["b" + slotNumber];
    },

    respecSkills(player: Player) {
        this.setOwnedSkills(player, []);
        this.setEquippedSkills(player, {});
    },

    getTotalSkillPoints(player: Player) {
        return LevelService.getLevel(player) + 2;
    },

    getRemainingSkillPoints(player: Player) {
        let totalSP = this.getTotalSkillPoints(player);
        for (const skill of this.getOwnedSkills(player)) {
            totalSP -= getSPCost(skill);
        }
        return totalSP;
    },

    getSkillFunction(skill: Skill): SkillFunction {
		const split = string.split(getSkillID(skill), "_");
		const load = require(ASSETS.Skills.FindFirstChild(split[0]) as ModuleScript) as SkillFunction[];
		return split.size() > 1 ?
			load[tonumber(split[1]) as number - 1] :
			(typeOf(load) === "table" ? load[0] :
				(load as unknown) as SkillFunction);
	},
	
	
	useSkill(player: Player, skill: Skill): boolean {
		const load = this.getSkillFunction(skill);

		if (skill.ID === "Slash" || skill.ID === "ManaPotion") {
			load(player, "Physical", 1);
			return true;
		}

		if (load) {
			task.spawn(() => {
				load(player, skill.scaleType as string, getDamageMultiplier(skill));
			});
			return true;
		}
		return false;
	},

    serialiseSkill(skill: Skill) {
        return skill.ID;
    },
    
    deserialiseSkill(serialisedSkill: string) {
        return getSkill(serialisedSkill);
    },

    load(player: Player) {
        const dataStore = this.getDataStore(player);
        dataStore.BeforeInitialGet<SerialisedSkillsData>((serialised) => {
            const data: SkillsData = {
                Owned: [],
                Equipped: {}
            }
            for (const owned of serialised.Owned) {
                const s = this.deserialiseSkill(owned);
                if (s) {
                    data.Owned.push(s);
                }
            }
            for (const [index, equipped] of pairs(serialised.Equipped)) {
                const s = this.deserialiseSkill(equipped);
                if (s) {
                    data.Equipped[index] = s;
                }
            }
            return data;
        });
        dataStore.BeforeSave<SerialisedSkillsData>((data) => {
            const serialised: SerialisedSkillsData = {
                Owned: [],
                Equipped: {}
            }
            for (const owned of data.Owned) {
                serialised.Owned.push(this.serialiseSkill(owned));
            }
            for (const [index, equipped] of pairs(data.Equipped)) {
                serialised.Equipped[index] = this.serialiseSkill(equipped);
            }
            return serialised;
        });
        dataStore.OnUpdate((data) => {
            this.skillsUpdated.Fire(player, data);
            this.Client.skillsUpdated.Fire(player, data);
        });
        LevelService.levelChanged.Connect((player) => {
            const totalSP = this.getTotalSkillPoints(player);
            this.totalSPChanged.Fire(player, totalSP);
            this.Client.totalSPChanged.Fire(player, totalSP);
        });
        const onRemainingSPChanged = (player: Player) => {
            const sp = this.getRemainingSkillPoints(player);
            this.remainingSPChanged.Fire(player, sp);
            this.Client.remainingSPChanged.Fire(player, sp);
        }
        this.skillsUpdated.Connect(onRemainingSPChanged);
        this.totalSPChanged.Connect(onRemainingSPChanged);
    },
    
    KnitInit() {
        DataStore2.Combine("Data", "Skills");
    }
});


export = SkillsService;

