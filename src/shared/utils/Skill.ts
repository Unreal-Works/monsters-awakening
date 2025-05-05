import Skill, { BASE_SKILLS } from "shared/utils/constants";

export const getDamageMultiplier = (skill: Skill): number => {
    let damage = 0;
	if (skill.cooldown) {
		if (skill.relativeDamageMulti) {
			damage = skill.relativeDamageMulti * math.pow(1.16, (skill.position ?? 0) - 3) * 8;
		}
		damage *= skill.cooldown * 0.5;
	}
    return damage;
}

export const getManaCost = (skill: Skill): number => {
	const rawCost = skill.manaCost ?? getDamageMultiplier(skill) * 0.45;
    return skill.scaleType === "Physical" ? rawCost * 0.4 / (skill.cooldown as number) : rawCost;
}

export const getSPCost = (skill: Skill): number => {
	if (!skill.position) {
		return 0;
	}
    return skill.SPCost ?? math.floor(((4 * skill.position) - 9) * (skill.relativeDamageMulti ? 1.5 * skill.relativeDamageMulti : 1) * 0.64);
}

export const serialiseSkill = (skill: Skill): string => {
    return skill.ID;
}

export const getSkill = (ID: string): Skill | undefined => {
	for (const [baseSkillID, baseSkill] of pairs(BASE_SKILLS)) {
		if (baseSkillID === ID) {
			return baseSkill;
		}
	}
	return undefined;
}

export const getSkillID = (skill: Skill): string => {
	for (const [baseSkillID, baseSkill] of pairs(BASE_SKILLS)) {
		if (skill.name === baseSkill.name) {
			return baseSkillID as string;
		}
	}
	error("How");
}

export const geSkillFromName = (skillName: string): Skill | undefined => {
	for (const [_, baseSkill] of pairs(BASE_SKILLS)) {
		if (baseSkill.name === skillName) {
			return baseSkill;
		}
	}
	return undefined;
}

export const getChildren = (skill: Skill): Skill[] => {
	const index = [];
	for (const [_, baseSkill] of pairs(BASE_SKILLS)) {
		if (baseSkill.skillsNeeded) {
			if ((baseSkill.skillsNeeded as string[]).includes(skill.ID)) {
				index.push(baseSkill);
				continue;
			}
			let a = 0;
			for (const skillNeeded of baseSkill.skillsNeeded) {
				if (typeOf(skillNeeded) === "table" && 
				(skillNeeded as string[]).includes(skill.ID)) {
					a += 1;
					break;
				}
			}
			if (a !== 0 && a === baseSkill.skillsNeeded.size()) {
				index.push(baseSkill);
				continue;
			}
		}
	}
	return index;
}

export const deserialiseSkill = (serialisedSkill: string): Skill => {
	const skill = getSkill(serialisedSkill);
	if (!skill) {
		error("Error deserialising skill "+serialisedSkill);
	}
	return skill;
}
