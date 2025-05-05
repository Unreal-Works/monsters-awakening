import { KnitServer, Signal } from "@rbxts/knit";
import { RunService } from "@rbxts/services";
import { STATUS_EFFECTS } from "shared/utils/constants";

declare global {
	interface KnitServices {
		StatusEffectsService: typeof StatusEffectsService;
	}
}

const StatusEffectsService = KnitServer.CreateService({
    Name: "StatusEffectsService",

    statusEffectsChanged: new Signal<(humanoid: Humanoid) => void>(),
    isEnabled: false,

    Client: {

    },

    getStatusEffectsFolder(humanoid: Humanoid, disableLoad?: boolean) {
        let statusEffectsFolder = humanoid.FindFirstChild("StatusEffects");
        if (statusEffectsFolder === undefined) {
            statusEffectsFolder = new Instance("Folder");
            statusEffectsFolder.Name = "StatusEffects";
            statusEffectsFolder.Parent = humanoid;
            if (!disableLoad) {
                this.load(humanoid);
            }
        }
        return statusEffectsFolder;
    },

    getStatusEffectFolder(humanoid: Humanoid, ID: string) {
        const statusEffectsFolder = this.getStatusEffectsFolder(humanoid);
        let statusEffectFolder = statusEffectsFolder.FindFirstChild(ID);
        if (statusEffectFolder === undefined) {
            statusEffectFolder = new Instance("Folder");
            statusEffectFolder.Name = ID;
            statusEffectFolder.Parent = statusEffectsFolder;
        }
        return statusEffectFolder;
    },

    addStack(humanoid: Humanoid, ID: string, amplifier: number, duration: number) {
        const folder = this.getStatusEffectFolder(humanoid, ID);
        const cached = folder.FindFirstChild(amplifier);
        if (cached) {
            (cached as IntValue).Value += duration * 1000;
            return;
        }
        const stack = new Instance("IntValue");
        stack.Name = tostring(amplifier);
        stack.Value = duration * 1000;
        stack.Parent = folder;
    },

    removeStack(humanoid: Humanoid, ID: string, amplifier: number) {
        const folder = this.getStatusEffectFolder(humanoid, ID);
        const stack = folder.FindFirstChild(amplifier);
        if (stack !== undefined) {
            stack.Destroy();
        }
    },

    removeStacks(humanoid: Humanoid, ID: string) {
        this.getStatusEffectFolder(humanoid, ID).ClearAllChildren();
    },

    hasStatusEffect(humanoid: Humanoid, ID: string) {
        return this.getStatusEffectFolder(humanoid, ID).GetChildren().size() > 0;
    },

    load(humanoid: Humanoid) {
        const mainFolder = this.getStatusEffectsFolder(humanoid, true);
        mainFolder.ChildAdded.Connect((statusEffectFolder) => {
            const update = () => {
                let bestAmplifier = 0;
                for (const stack of statusEffectFolder.GetChildren()) {
                    const amplifier = tonumber(stack.Name) ?? 0;
                    if (amplifier > bestAmplifier) {
                        bestAmplifier = amplifier;
                    }
                }
                statusEffectFolder.SetAttribute("BestAmplifier", bestAmplifier);
                this.statusEffectsChanged.Fire(humanoid);
            }
            statusEffectFolder.ChildAdded.Connect(() => update());
            statusEffectFolder.ChildRemoved.Connect(() => update());
            RunService.Heartbeat.Connect((deltaTime) => {
                if (statusEffectFolder !== undefined) {
                    for (const s of statusEffectFolder.GetChildren()) {
                        const stack = (s as IntValue);
                        stack.Value -= deltaTime * 1000;
                        if (stack.Value < 0) {
                            stack.Destroy();
                        }
                    }
                }
            });
            task.spawn(() => {
                while (task.wait(1)) {
                    const bestAmplifier = statusEffectFolder.GetAttribute("BestAmplifier") as number;
                    const bestStack = statusEffectFolder.FindFirstChild(bestAmplifier);
                    if (bestStack) {
                        const tickFunction = STATUS_EFFECTS[statusEffectFolder.Name].Effect.Tick;
                        if (tickFunction) {
                            tickFunction(bestAmplifier, 1, humanoid);
                        }
                    }
                }
            });
        });
    },

    KnitInit() {

    }
});


export = StatusEffectsService;

