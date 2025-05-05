import { KnitServer as Knit, RemoteSignal } from "@rbxts/knit";
import { Players, Workspace } from "@rbxts/services";
import OverheadUIService from "server/services/OverheadUIService";
import StatusEffectsService from "server/services/StatusEffectsService";
import CosmeticsService from "server/services/playerdata/CosmeticsService";
import InventoryService from "server/services/playerdata/InventoryService";
import LevelService from "server/services/playerdata/LevelService";
import RecordService from "server/services/playerdata/RecordService";
import StatsService from "server/services/playerdata/StatsService";
import { Calculations } from "shared/utils/Calculations";
import { ITEM_ASSETS, OverheadUI, WEAPON_ANIMS } from "shared/utils/constants";
import { weld } from "shared/utils/vrldk/BasePartUtils";
import { destroyInstance } from "shared/utils/vrldk/InstanceUtils";
import { getHumanoid } from "shared/utils/vrldk/PlayerUtils";
import { loadAnimation, stopAllAnimations } from "shared/utils/vrldk/RigUtils";

declare global {
    interface KnitServices {
        CharacterService: typeof CharacterService;
    }
}

const CharacterService = Knit.CreateService({
    Name: "CharacterService",
    overheadUIPerPlayer: new Map<Player, OverheadUI>(),

    Client: {
        humanoidUpdated: new RemoteSignal<() => void>(),
        loadAnimation(player: Player, animationId: string | number) {
            return this.Server.loadAnimation(player, animationId);
        },
        playAnimation(player: Player, animationId: string | number) {
            return this.Server.playAnimation(player, animationId);
        },
    },

    loadAnimation(player: Player, animationId: string | number) {
        const humanoid = getHumanoid(player);
		if (humanoid) {
			return loadAnimation(humanoid, animationId);
        }
        return undefined;
    },

    playAnimation(player: Player, animationId: string | number) {
		const animTrack = this.loadAnimation(player, animationId);
        if (animTrack) {
            animTrack.Play();
            return animTrack;
        }
        return undefined;
	},

    getMaxHealth(player: Player) {
        return Calculations.getMaxHealth(StatsService.getStat(player, "Endurance"), InventoryService.getInventory(player).equipment);
    },
    
    getBaseDamage(player: Player, scale: string) {
        return Calculations.getBaseDamage(scale, 
            StatsService.getStat(player, scale.lower() === "physical" ? "PhysicalStrength" : "MagicProficiency"),
            InventoryService.getInventory(player).equipment);
    },

    updateHumanoid(player: Player) {
        const humanoid = getHumanoid(player);
        if (humanoid) {
            humanoid.MaxHealth = this.getMaxHealth(player);
            if (humanoid.Health > humanoid.MaxHealth) {
                humanoid.Health = humanoid.MaxHealth;
            }
            const overheadUI = humanoid.Parent?.FindFirstChild("Head")?.FindFirstChild("OverheadUI") as OverheadUI | undefined;
            if (overheadUI) {
                OverheadUIService.updateOverheadUI(overheadUI);
            }
            this.Client.humanoidUpdated.Fire(player);
        }
    },

    updatePhysicalEquipment(player: Player) {
        if (!player.Character) { return; }
        destroyInstance(player.Character.FindFirstChild("Weapon"));
        destroyInstance(player.Character.FindFirstChild("Helmet"));
        destroyInstance(player.Character.FindFirstChild("Chestplate"));
            
        const humanoid = getHumanoid(player);
        if (humanoid) {
            stopAllAnimations(humanoid);
            task.delay(0.2, () => {
                const cosmetic = CosmeticsService.getEquippedCosmetic(player).Weapon;
                const weapon = InventoryService.getEquipmentSlot(player, "Weapon");
                if (weapon && weapon.wield && player.Character) {
                    const animate = player.Character.WaitForChild("Animate") as Script & {
                        toolnone: {
                            ToolNoneAnim: Animation
                        },
                        idle: {
                            Animation1: Animation,
                            Animation2: Animation,
                        },
                        run: {
                            RunAnim: Animation,
                        }
                    };
        
                    animate.toolnone.ToolNoneAnim.AnimationId = WEAPON_ANIMS[weapon.wield].TOOL_NONE;
                    animate.idle.Animation1.AnimationId = "rbxassetid://6898688123";
                    animate.idle.Animation2.AnimationId = "rbxassetid://6898688123";
        
                    animate.run.RunAnim.AnimationId = WEAPON_ANIMS[weapon.wield].WALK;
        
                    const weaponInstance =  ITEM_ASSETS.WaitForChild(cosmetic ? "Cosmetic" + cosmetic : weapon.ID).Clone();
                    weaponInstance.Name = "Weapon";
                    weaponInstance.Parent = player.Character;
                }
            });
        }
    
        if (InventoryService.getEquipmentSlot(player, "Helmet")) {
            this.showArmor(player, "Helmet");
        }
        if (InventoryService.getEquipmentSlot(player, "Chestplate")) {
            this.showArmor(player, "Chestplate");
        }
    
        this.updateHumanoid(player);
    },
    
    showArmor(player: Player, equiptype: string) {
        const equippedCosmetic = CosmeticsService.getEquippedCosmetic(player).Armor;
        if (equippedCosmetic !== undefined && equiptype === "Helmet") {
            return;
        }
        const item = InventoryService.getEquipmentSlot(player, equiptype);
        if (!item) { return; }
        while (!player.Character) { wait(); }
        const character = player.Character;
        const humanoid = getHumanoid(player);
        if (!humanoid) { return; }
        const blankTrack = loadAnimation(humanoid, "rbxassetid://6912704190");
        if (!blankTrack) { return; }
        blankTrack.Looped = true;
        blankTrack.Play();
        while (blankTrack.Length <= 0) { wait(); }
        stopAllAnimations(humanoid);
        blankTrack.Play();
        
        const armor = ITEM_ASSETS.WaitForChild((equippedCosmetic) ? "Cosmetic" + equippedCosmetic : item.ID).Clone();
        if (!armor) { return; }
        armor.Name = item.type ?? "";
        humanoid.WalkSpeed = 0;
        wait(0.1);
        let pants = character.FindFirstChildOfClass("Pants");
        if (pants) { pants.PantsTemplate = ""; }
        let shirt = character.FindFirstChildOfClass("Shirt");
        if (shirt) { shirt.ShirtTemplate = ""; }
        const bodyColors = character.FindFirstChildOfClass("BodyColors");
        if (bodyColors) { bodyColors.Destroy(); }
        const a = new Instance("BodyColors", character);
    
        if (armor.IsA("Model")) {            
            for (const part of armor.GetChildren()) {
                if (part.IsA("BasePart")) {
                    for (const d of part.GetChildren()) {
                        weld(d as BasePart, part);
                        (d as BasePart).Anchored = false;
                    }
                    const charPart = character.WaitForChild(part.Name) as BasePart
                    part.CFrame = charPart.CFrame;
                    weld(part, charPart);
                    part.Anchored = false;
                }
                else if (part.IsA("Pants")) {
                    if (!pants) {
                        pants = new Instance("Pants", character);	
                    }
                    pants.PantsTemplate = part.PantsTemplate;
                }
                else if (part.IsA("Shirt")) {
                    if (!shirt) {
                        shirt = new Instance("Shirt", character);
                    }
                    shirt.ShirtTemplate = part.ShirtTemplate;
                }
                else if (part.IsA("BodyColors")) {
                    if (bodyColors) {
                        bodyColors.Destroy();
                    }
                    part.Parent = player.Character;
                }
            }
            armor.Parent = player.Character;
        }
        else if (armor.IsA("Accessory")) {
            for (const d of armor.GetChildren()) {
                if ((d.IsA("BasePart"))) {
                    if (d.Name !== "Handle") {
                        weld(d, armor.WaitForChild("Handle") as BasePart);
                    }
                    d.Anchored = false;
                }
            }
            humanoid.AddAccessory(armor);
        }
    
        blankTrack.Stop();
        this.updateHumanoid(player);
    },
    
    setOverheadUIStats(player: Player) {
        const overheadUI = this.overheadUIPerPlayer.get(player);
        if (!overheadUI) {
            return;
        }
        overheadUI.NameLabel.Text = '<font color="#fffb00">[Lv. '+(LevelService.getLevel(player))+']</font> '
        + ((RecordService.getDisplayName(player) ?? player.DisplayName));
        overheadUI.NameLabel.TextColor3 = RecordService.getDisplayColor(player) ?? new Color3(1, 1, 1);
    },
    
    load(player: Player) {
        const onCharacterAdded = (character: Model) => {
            while (character.Parent !== Workspace) {
                wait();
            }
            this.updatePhysicalEquipment(player);
            const humanoid = character.WaitForChild("Humanoid") as Humanoid;
            while (humanoid.MaxHealth === 100) {
                wait();
            }
            humanoid.Health = humanoid.MaxHealth;
            humanoid.HealthDisplayType = Enum.HumanoidHealthDisplayType.AlwaysOff;
            humanoid.DisplayDistanceType = Enum.HumanoidDisplayDistanceType.None;
            character.WaitForChild("Health").Destroy();
            const overheadUI = OverheadUIService.createOverheadUI(character);
            this.overheadUIPerPlayer.set(player, overheadUI);
            this.setOverheadUIStats(player);

            player.SetAttribute("LoadStatus", "Loaded character.");
        }

        player.CharacterAdded.Connect(onCharacterAdded);
        if (player.Character) {
            onCharacterAdded(player.Character);
        }
    },

    KnitInit() {
        InventoryService.equipmentChanged.Connect((player) => {
            this.updatePhysicalEquipment(player);
        });
        CosmeticsService.cosmeticsUpdated.Connect((player) => {
            this.updatePhysicalEquipment(player);
        });
        StatsService.statsUpdated.Connect((player) => {
            this.updateHumanoid(player);
        });
        LevelService.levelChanged.Connect((player) => {
            this.setOverheadUIStats(player);
        });
        RecordService.recordChanged.Connect((player) => {
            this.setOverheadUIStats(player);
        });
        StatusEffectsService.statusEffectsChanged.Connect((humanoid) => {
            const player = Players.GetPlayerFromCharacter(humanoid.Parent);
            if (player) {
                this.updateHumanoid(player);   
            }
        });
    },
});

export = CharacterService;