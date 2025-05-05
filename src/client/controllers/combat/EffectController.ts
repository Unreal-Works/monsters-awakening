import { KnitClient as Knit, KnitClient } from "@rbxts/knit";
import { TweenService, Workspace } from "@rbxts/services";
import { EFFECT_ASSETS } from "shared/utils/constants";

declare global {
    interface KnitControllers {
        EffectController: typeof EffectController;
    }
}

const OverheadUIService = KnitClient.GetService("OverheadUIService");

const EffectController = Knit.CreateController({
    Name: "EffectController",

    partColorsPerCharacter: new Map<Model, Map<BasePart, Color3>>(),
    rng: new Random(),

    characterHit(character: Model) {
        const DAMAGE_EFFECT_ASSETS = EFFECT_ASSETS.WaitForChild("Damage");
        const cframe = character.GetPivot();
        let partColors = this.partColorsPerCharacter.get(character);
        if (partColors === undefined) {
            partColors = new Map<BasePart, Color3>();
            for (const part of character.GetDescendants()) {
                if (part.IsA("BasePart")) {
                    partColors.set(part, part.Color);
                }
            }
            this.partColorsPerCharacter.set(character, partColors);
            character.Destroying.Connect(() => {
                this.partColorsPerCharacter.delete(character);
            });
        }
        const hitColor = new Color3(1, 0.29, 0.29);
        partColors.forEach((color, part) => {
            part.Color = hitColor;
            TweenService.Create(part, new TweenInfo(0.2, Enum.EasingStyle.Quad), {Color: color}).Play();
        });
        for (let i = 0; i < 6; i++) {
            task.spawn(() => {
                const spark = DAMAGE_EFFECT_ASSETS.WaitForChild("Sphere").Clone() as BasePart;
                spark.Color = new Color3(1, 0.29, 0.29);
                spark.Transparency = 0.25;
                spark.Size = new Vector3(0.1, this.rng.NextInteger(20, 30) * 0.01, this.rng.NextInteger(20, 30) * 0.01);
                spark.CFrame = cframe.mul(CFrame.Angles(0, math.rad(this.rng.NextInteger(-180, 180)), math.rad(this.rng.NextInteger(-180, 180))));
                spark.Parent = Workspace;
                TweenService.Create(spark, new TweenInfo(0.3), 
                    {CFrame: spark.CFrame.mul(new CFrame(this.rng.NextInteger(-40, -80)/10,0,0))}).Play();
                TweenService.Create(spark, new TweenInfo(0.1, Enum.EasingStyle.Quart), 
                    {Size: new Vector3(this.rng.NextNumber(2, 3), spark.Size.Y, spark.Size.Z)}).Play();
                task.wait(0.1);
                TweenService.Create(spark, new TweenInfo(0.1), {Size: new Vector3(spark.Size.X * 0.25, 0, 0), Transparency: 1}).Play();
                task.wait(0.1);
                spark.Destroy();
            });
        }
    },

    load() {

    },

    KnitInit() {
        OverheadUIService.healthChanged.Connect((humanoid) => {
            const character = humanoid.Parent;
            if (character) {
                this.characterHit(character as Model);
            }
        });
    },
});

export = EffectController;