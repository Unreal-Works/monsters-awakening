import { KnitServer, RemoteSignal, Signal } from "@rbxts/knit";
import { CollectionService, PhysicsService, Players, ServerStorage, TeleportService, TweenService, Workspace } from "@rbxts/services";
import LootService from "server/services/LootService";
import MsgService from "server/services/MsgService";
import MusicService from "server/services/MusicService";
import OverheadUIService from "server/services/OverheadUIService";
import StatusEffectsService from "server/services/StatusEffectsService";
import EXPService from "server/services/playerdata/EXPService";
import SpecialService from "server/services/playerdata/SpecialService";
import { Calculations } from "shared/utils/Calculations";
import { getCurrentDungeon, getEnemy, getRandomisedDungeonLoot, isLobby } from "shared/utils/Dungeon";
import { BARRIERS_FOLDER, Dungeon, Enemy, MOB_SPAWNS_FOLDER, OverheadUI, SPAWN_LOCATION, STATUS_EFFECTS, UI_ASSETS } from "shared/utils/constants";
import { getHumanoid } from "shared/utils/vrldk/PlayerUtils";
import SnowflakesService from "./playerdata/SnowflakesService";
declare global {
	interface KnitServices {
		DungeonService: typeof DungeonService;
	}
}

const DungeonService = KnitServer.CreateService({
    Name: "DungeonService",

    time: math.huge,
    timeChanged: new Signal<(time: number) => void>(),

    difficulty: "",
    difficultyAssigned: new Signal<(difficulty: string) => void>(),

    insaneMode: false,
    insaneModeEnabled: new Signal<() => void>(),

    isStarted: false,
    isEnded: false,
    dungeonStarted: new Signal<() => void>(),
    dungeonEnded: new Signal<() => void>(),

    enemyKilled: new Signal<(enemy: Enemy, enemyModel: Instance) => void>(),
    mobsFolder: ServerStorage.WaitForChild("Mobs"),
    numberOfEnemies: 0,
    debounce: false,
    no: 0,
    random: new Random(),

    Client: {
        timeChanged: new RemoteSignal<(time: number) => void>(),
        difficultyAssigned: new RemoteSignal<(difficulty: string) => void>(),
        insaneModeEnabled: new RemoteSignal<() => void>(),
        dungeonStarted: new RemoteSignal<() => void>(),
        dungeonEnded: new RemoteSignal<() => void>(),
        timerPenaltyGiven: new RemoteSignal<() => void>(),
        
        getDifficulty() {
            return this.Server.getDifficulty();
        },

        setDifficulty(_player: Player, difficulty: string) {
            this.Server.setDifficulty(difficulty);
        },

        enableInsaneMode() {
            this.Server.enableInsaneMode();
        },

        startDungeon() {
            return this.Server.startDungeon();  
        }
    },

    getTime() {
        return this.time;
    },

    setTime(time: number) {
        this.time = time;
        this.timeChanged.Fire(time);
        this.Client.timeChanged.FireAll(time);
    },

    getDifficulty() {
        return this.difficulty;
    },

    setDifficulty(difficulty: string) {
        if (this.difficulty === "") {
            this.difficulty = difficulty;
            this.difficultyAssigned.Fire(difficulty);
            this.Client.difficultyAssigned.FireAll(difficulty);
        }
    },

    isInsaneMode() {
        return this.insaneMode;
    },

    enableInsaneMode() {
        this.insaneMode = true;
        this.insaneModeEnabled.Fire();
        this.Client.insaneModeEnabled.FireAll();
    },

    startDungeon() {
        if (this.isStarted) {
            return;
        }
        this.isStarted = true;
        BARRIERS_FOLDER.WaitForChild("StartingBarrier").Destroy();
        this.dungeonStarted.Fire();
        this.Client.dungeonStarted.FireAll();
    },

    loadEnemy(enemyName: string, cFrame: CFrame, def?: Model) {
        const ref = def ?? this.mobsFolder.FindFirstChild(enemyName);
        if (!ref) {
            return;
        }
        const enemyModel = ref.Clone() as Model;
        enemyModel.PivotTo(cFrame);
        enemyModel.Parent = Workspace;
        CollectionService.AddTag(enemyModel, "Mob");
        const enemyHumanoid = enemyModel.FindFirstChildOfClass("Humanoid");
        if (enemyHumanoid && enemyHumanoid.RootPart) {
            StatusEffectsService.load(enemyHumanoid);
            const enemy = this.getEnemy(enemyModel.Name);
            task.spawn(() => {
                while (DungeonService.getDifficulty() === "") {
                    task.wait();
                }
                enemyHumanoid.SetAttribute("IsBoss", enemy.Boss);
                enemyHumanoid.SetAttribute("BaseWalkspeed", enemy.WalkSpeed);
                if (enemy.Boss) {
                    const indicate = new Instance("BoolValue", enemyHumanoid);
                    indicate.Name = "Boss";
                    indicate.Value = true;
                }
                for (const v of enemyModel.GetDescendants()) {
                    if (v.IsA("BasePart")) {
                        v.CollisionGroup = "Mobs";
                    }
                }
                enemyHumanoid.MaxHealth = this.getEnemyHealth(undefined, enemy) * 
                    (Players.GetPlayers().size() * 0.30 + 0.70) * (enemy.Boss ? 2 : 1);
                enemyHumanoid.Health = enemyHumanoid.MaxHealth;
                enemyHumanoid.WalkSpeed = enemy.WalkSpeed;
                const overheadUI = OverheadUIService.createOverheadUI(enemyModel as Model);
                const nameLabel = overheadUI.NameLabel;
                nameLabel.Text = '<font color="#fffb00">[Lv. '+(DungeonService.getDifficultyStats().levelReq)+']</font> '
                    + (enemyModel.Name);
                nameLabel.TextColor3 = new Color3(1, 1, 1);
    
                enemy.load(enemyHumanoid);
                let attacking = false;
                task.spawn(() => {
                    while (enemyHumanoid && enemyHumanoid.RootPart) {
                        if (!enemy.Behaviour.Target || !enemy.Behaviour.Target.Character ||
                                (enemy.Behaviour.Target.Character.WaitForChild("Humanoid") as Humanoid).Health <= 0) {
                            enemy.Behaviour.Target = undefined;
                            for (const v of Players.GetPlayers()) {
                                if (v.Character) {
                                    const humanoid = v.Character.FindFirstChildOfClass("Humanoid");
                                    if (humanoid && humanoid.RootPart) {
                                        if (enemy.AggressionRange > 500 || 
                                            (enemyHumanoid.RootPart.Position.sub(humanoid.RootPart.Position)).Magnitude < enemy.AggressionRange) {
                                            enemy.Behaviour.Target = v;
                                        }
                                        else if (enemyHumanoid.Health !== enemyHumanoid.MaxHealth) {
                                            if (humanoid.Health > 0 && humanoid.RootPart) {
                                                enemy.Behaviour.Target = v;
                                            }
                                        }
                                    }
    
                                }
                            }
                            enemy.Behaviour.IdleStage();
                        }
                        task.wait(0.25);
                    }
                });
    
                task.spawn(() => {
                    while (enemyHumanoid && enemyHumanoid.RootPart) {
                        if (enemy.Behaviour.Target) {
                            const humanoid = getHumanoid(enemy.Behaviour.Target);
                            if (humanoid && humanoid.RootPart) {
                                const distance = (enemyHumanoid.RootPart.Position.sub(humanoid.RootPart.Position)).Magnitude;
                                if (distance < enemy.AttackingRange) {
                                    attacking = true;
                                    enemy.Behaviour.AttackingStage(distance);
                                    attacking = false;
                                }
                            }
                        }
                        task.wait(0.1);
                    }
                });
    
                task.spawn(() => {
                    while (enemyHumanoid && enemyHumanoid.RootPart) {
                        if (enemy.Behaviour.Target) {
                            const humanoid = getHumanoid(enemy.Behaviour.Target);
                            if (humanoid && humanoid.RootPart) {
                                if (!attacking) {
                                    const distance = (enemyHumanoid.RootPart.Position.sub(humanoid.RootPart.Position)).Magnitude;
                                    if (enemy.AttackingRange <= 0 || distance > enemy.AttackingRange) {
                                        enemy.Behaviour.AggressionStage(distance);
                                    }
                                }
                            }
                        }
                        task.wait(0.1);
                    }
                });
                
                task.spawn(() => {
                    enemyHumanoid.HealthChanged.Connect(() => {
                        if (enemyHumanoid.Health < 1) {
                            if (isLobby()) {
                                return;
                            }
                            this.killEnemy(enemy, enemyModel);
                            for (const player of Players.GetPlayers()) {
                                EXPService.incrementEXP(player, this.getEnemyEXP(undefined, undefined, enemy, undefined, undefined));
                                SnowflakesService.incrementSnowflakes(player, math.random(enemy.Boss ? 10 : 3, enemy.Boss ? 15 : 7));
                            }
                        }
                    })
                });
            });
        }
    },

    killEnemy(enemy: Enemy, enemyModel: Instance) {
        this.enemyKilled.Fire(enemy, enemyModel);
        for (const v of enemyModel.GetDescendants()) {
            if (v.IsA("BasePart")) {
                v.Anchored = true;
            }
        }
        CollectionService.RemoveTag(enemyModel, "Mob");
        enemyModel.Destroy();
    },

    getEnemy(enemyID: string): Enemy {
        return getEnemy(enemyID);
    },

    getDifficultyStats(dungeon?: Dungeon, difficulty?: string) {
        return (dungeon ?? getCurrentDungeon()).difficulties[difficulty ?? this.getDifficulty()];
    },

    getTotalMagnification(enemy: Enemy, dungeon?: Dungeon, difficulty?: string): number {
        return enemy.StrengthMagnification * this.getDifficultyStats(dungeon, difficulty).strengthMagnification;
    },

    getBaseEnemyHealth(level: number | undefined): number {
        return Calculations.getBaseEnemyHealth(level ?? this.getDifficultyStats().levelReq);
    },

    getEnemyHealth(level: number | undefined, enemy: Enemy, dungeon?: Dungeon, difficulty?: string): number {
        return this.getBaseEnemyHealth(level) * this.getTotalMagnification(enemy, dungeon, difficulty);
    },

    getBaseEnemyEXP(level: number | undefined, numberOfEnemies: number): number {
        return Calculations.getBaseEnemyEXP(level ?? this.getDifficultyStats().levelReq, numberOfEnemies);
    },

    getEnemyEXP(level: number | undefined, numberOfEnemies: number | undefined, 
            enemy: Enemy, dungeon?: Dungeon, difficulty?: string) {
        return enemy.EXPDrop ?? 
            this.getBaseEnemyEXP(level, numberOfEnemies ?? this.numberOfEnemies) * 
            (1 + ((this.getTotalMagnification(enemy, dungeon, difficulty) - 1) * 0.25));
    },

    getBaseEnemyDamage(level?: number): number {
        return Calculations.getBaseEnemyDamage(level ?? this.getDifficultyStats().levelReq);
    },

    getEnemyDamage(level: number | undefined, enemy: Enemy, dungeon?: Dungeon, difficulty?: string): number {
        return this.getBaseEnemyDamage(level) * this.getTotalMagnification(enemy, dungeon, difficulty);
    },

    getRandomEnemyDamage(level: number | undefined, enemy: Enemy, dungeon?: Dungeon, difficulty?: string): number {
        return ((this.random.NextNumber() * 0.2) + 0.9) * this.getEnemyDamage(level, enemy, dungeon, difficulty);
    },

    advance() {
        if (this.debounce === true) {
            this.debounce = false;
            wait(1);
        }

        if (CollectionService.GetTagged("Mob").size() < 1) {
            this.no += 1;
            this.loadCurrentLocation();
            this.debounce = true;
        }
    },

    endDungeon() {
        if (this.isEnded) {
            return;
        }
        this.isEnded = true;
        this.dungeonEnded.Fire();
        this.Client.dungeonEnded.FireAll();
    },

    winDungeon() {
        this.endDungeon();
        MusicService.play(getCurrentDungeon().victoryTheme);
        const lobbyID = 6881133779;
        for (const player of Players.GetPlayers()) {
            const loot = getRandomisedDungeonLoot(getCurrentDungeon(), this.getDifficulty(), 
                (SpecialService.isExtraItem(player) ? 1 : 0) + (this.isInsaneMode() ? 1 : 0) + 1);
            LootService.giveLoot(player, loot);
        }
        this.setTime(999999);
        let countdown = 5;
        while (countdown > 0) {
            MsgService.sendGlobalNotification("Teleporting back in " + countdown + "...", new Color3(0.9,0.9,0.9));
            countdown -= 1;
            task.wait(1);
        }
        TeleportService.TeleportPartyAsync(lobbyID, Players.GetPlayers());
        MsgService.sendGlobalNotification("Teleporting!", new Color3(0.23,0.89,1));
    },

    load(player: Player) {
        const setCollisionGroupRecursive = (object: Instance, group: string) => {
            if (object.IsA("BasePart")) {
                object.CollisionGroup = group;
            }   
            for (const child of object.GetChildren()) {
                setCollisionGroupRecursive(child, group);
            }
        }

        const onCharacterAdded = (character: Model) => {
            setCollisionGroupRecursive(character, "Players");
            const humanoid = character.WaitForChild("Humanoid") as Humanoid;
            humanoid.Died.Connect(() => {
                task.spawn(() => {
                    DungeonService.setTime(DungeonService.getTime() - 10);
                    if (!Players.CharacterAutoLoads && player.Character) {
                        for (const v of player.Character.GetDescendants()) {
                            if (v.IsA("BasePart") || v.IsA("UnionOperation") || v.IsA("MeshPart")) {
                                TweenService.Create(v, new TweenInfo(1.5), {Transparency: 1}).Play();
                            }
                        }
                        wait(1.5);
                        player.Character.Destroy();
                        if (Players.GetPlayers().size() > 1) {
                            UI_ASSETS.FreeCamera.Clone().Parent = player.WaitForChild("PlayerGui");
                        }
                        else {
                            DungeonService.setTime(0);
                        }
                    }
                });
            });
        }
        player.CharacterAdded.Connect(onCharacterAdded);
        if (player.Character) {
            onCharacterAdded(player.Character);
        }
    },

    loadCurrentLocation() {
        const barrier = BARRIERS_FOLDER.FindFirstChild("Barrier" + this.no);
        if (barrier) {
            barrier.Destroy();
            const s = Workspace.FindFirstChild("Location" + this.no) as BasePart | undefined;
            if (s) {
                SPAWN_LOCATION.Position = s.Position;
                SPAWN_LOCATION.Size = new Vector3(1, 1, 1);
            }
        }
        const locationSpawns = MOB_SPAWNS_FOLDER.Dungeon?.FindFirstChild("Location" + this.no);
        if (locationSpawns) {
            for (const spawn of locationSpawns.GetChildren()) {
                this.loadEnemy(spawn.Name, (spawn as BasePart).CFrame);
            }
        }
        else {
            this.winDungeon();
        }

        if (!MOB_SPAWNS_FOLDER.Dungeon?.FindFirstChild("Location" + (this.no + 1))) {
            MusicService.play(getCurrentDungeon().bossTheme);
        }
    },

    KnitInit() {
        PhysicsService.RegisterCollisionGroup("Players");
        PhysicsService.CollisionGroupSetCollidable("Players", "Players", false);

        PhysicsService.RegisterCollisionGroup("Mobs");
        PhysicsService.CollisionGroupSetCollidable("Mobs", "Mobs", false);

        PhysicsService.CollisionGroupSetCollidable("Players", "Mobs", false);

        for (const v of MOB_SPAWNS_FOLDER.GetDescendants()) {
            if (v.IsA("BasePart")) {
                this.numberOfEnemies += 1;
                v.Transparency = 1;
                v.CanCollide = false;
            }
        }
        this.loadCurrentLocation();

        this.dungeonStarted.Connect(() => {
            MusicService.play(getCurrentDungeon().questingTheme);
            if (this.isInsaneMode()) {
                Players.CharacterAutoLoads = false;
            }
            while (this.getTime() > -1 && !this.isEnded) {
                task.wait(1);
                this.setTime(this.getTime() - 1);
                this.advance();
            }
        });

        print("Loaded " + this.numberOfEnemies + " enemies");
        this.setTime(getCurrentDungeon().time);
        if (isLobby()) {
            MusicService.play(getCurrentDungeon().questingTheme);
        }

        this.timeChanged.Connect((time) => {
            if (time <= 0 && this.isStarted && !this.isEnded) {
                Players.CharacterAutoLoads = false;
                for (const player of Players.GetPlayers()) {
                    if (player.Character) {
                        const humanoid = player.Character.FindFirstChildOfClass("Humanoid");
                        if (humanoid) {
                            humanoid.Health = 0;
                        }
                    }
                }
            }
        });

        StatusEffectsService.statusEffectsChanged.Connect((humanoid) => {
            if (!humanoid.Parent?.FindFirstChild("Enemy")) {
                return;
            }
            const head = humanoid.Parent.FindFirstChild("Head");
            if (!head) {
                return;
            }
            const overheadUI = head.FindFirstChild("OverheadUI");
            if (overheadUI) {
                OverheadUIService.updateOverheadUI(overheadUI as OverheadUI);
            }

            const enemy = this.getEnemy(humanoid.Parent.Name);
            if (!enemy) {
                return;
            }

            let ws = enemy.WalkSpeed;
            let autoRotate = true;
            for (const stacks of StatusEffectsService.getStatusEffectsFolder(humanoid).GetChildren()) {
                const effect = STATUS_EFFECTS[stacks.Name];
                const amplifier = (stacks.GetAttribute("BestAmplifier") as number) ?? 0;
                if (amplifier > 0) {
                    if (effect.Effect.SelfWalkSpeed) {
                        ws = effect.Effect.SelfWalkSpeed(amplifier, ws);
                    }
                    if (effect.Effect.SelfAutoRotate) {
                        autoRotate = effect.Effect.SelfAutoRotate(amplifier, autoRotate);
                    }
                }
            }
            humanoid.WalkSpeed = ws;
            humanoid.AutoRotate = autoRotate;
        });
    }
});


export = DungeonService;