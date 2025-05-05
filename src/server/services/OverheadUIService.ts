import { KnitServer as Knit, RemoteSignal } from "@rbxts/knit";
import { Debris, TweenService } from "@rbxts/services";
import { OverheadUI, STATUS_EFFECTS, UI_ASSETS } from "shared/utils/constants";
import { abbreviate } from "shared/utils/vrldk/NumberAbbreviations";
import StatusEffectsService from "./StatusEffectsService";

declare global {
    interface KnitServices {
        OverheadUIService: typeof OverheadUIService;
    }
}

const OverheadUIService = Knit.CreateService({
    Name: "OverheadUIService",

    Client: {
        healthChanged: new RemoteSignal<(humanoid: Humanoid) => void>(),
    },

    createOverheadUI(character: Model) {
        const overheadUI = UI_ASSETS.OverheadUI.Clone();
        overheadUI.Parent = character.WaitForChild("Head");
        const humanoid = character.FindFirstChildOfClass("Humanoid");
        if (!humanoid) {
            error("No humanoid for character "+character.Name+" found");
        }
    
        const onHealthChanged = (health: number) => {
            this.updateOverheadUI(overheadUI);
            const previousHealth = overheadUI.GetAttribute("PreviousHealth") as number | undefined ?? health;
            const delta = health - previousHealth;
            const damageEffect = UI_ASSETS.DamageEffect.Clone();
            const damageLabel = damageEffect.DamageLabel;
            damageLabel.Text = abbreviate(math.abs(math.floor(delta)));
            const scale = (2.5 * math.abs(delta) / humanoid.MaxHealth) + 0.8;
            damageEffect.Size = new UDim2(5, 0, scale > 1.5 ? 1.5 : scale, 0);
            damageEffect.StudsOffset = new Vector3(math.random(-10, 10) * 0.1, math.random(-100, 100) * 0.01, math.random(-1000, 1000) * 0.001);
            overheadUI.SetAttribute("PreviousHealth", health);
            if (delta > 0) {
                damageLabel.TextColor3 = new Color3(0, 1, 0);
            }
            else if (delta < 0) {
                const c = 0.4 - (math.abs(delta) / humanoid.MaxHealth);
                damageLabel.TextColor3 = new Color3(1, c < 0 ? 0 : c, 0);
                this.Client.healthChanged.FireAll(humanoid);
            }
            else {
                damageLabel.Destroy();
                return;
            }
            damageEffect.Parent = overheadUI.Parent;
            TweenService.Create(damageLabel, new TweenInfo(0.7), {Position: new UDim2(0.5, 0, -0.49, 0)}).Play();
            task.wait(0.7);
            TweenService.Create(damageLabel, new TweenInfo(0.5), {TextTransparency: 1, TextStrokeTransparency: 1}).Play();
            Debris.AddItem(damageLabel, 0.5);
        }
        onHealthChanged(humanoid.Health);
        humanoid.HealthChanged.Connect(onHealthChanged);
        return overheadUI;
    },
    
    updateOverheadUI(overheadUI: OverheadUI) {
        const character = overheadUI.Parent?.Parent;
        if (!character) {
            return;
        }
        const humanoid = character.WaitForChild("Humanoid") as Humanoid || undefined;
        if (!humanoid) {
            return;
        }
        const health = humanoid.Health;
        TweenService.Create(overheadUI.HealthBar.ExtendingBar, new TweenInfo(0.2), {
            Size: new UDim2(health / humanoid.MaxHealth, 0, 1, 0)
        }).Play();
        overheadUI.HealthBar.ValueLabel.Text = abbreviate(math.floor(health));
        const statusEffects = StatusEffectsService.getStatusEffectsFolder(humanoid);
        if (statusEffects) {
            overheadUI.HealthBar.ExtendingBar.BackgroundColor3 = new Color3(0, 1, 0.5);
            overheadUI.HealthBar.UIStrokes.ColorFrame.UIStroke.Color = new Color3(0, 1, 0.5);
            for (const icon of overheadUI.StatusEffects.GetChildren()) {
                if (icon.IsA("ImageLabel")) {
                    icon.Destroy();
                }
            }
            for (const stacks of statusEffects.GetChildren()) {
                if ((stacks.GetAttribute("BestAmplifier") as number) > 0) {
                    const icon = UI_ASSETS.StatusEffect.Clone();
                    const statusEffect = STATUS_EFFECTS[stacks.Name];
                    icon.Image = "rbxassetid://" + statusEffect.Image;
                    icon.Parent = overheadUI.StatusEffects;
                    if (statusEffect.Effect.OverheadUI) {
                        statusEffect.Effect.OverheadUI((stacks.GetAttribute("BestAmplifier") as number) ?? 0,  overheadUI);
                    }
                }
            }
        }
    },
    
    getOverheadUI(character: Model) {
        return character.FindFirstChild("Head")?.FindFirstChild("OverheadUI") as OverheadUI | undefined;
    },

    KnitInit() {
    },
});

export = OverheadUIService;