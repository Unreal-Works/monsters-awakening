export function destroyInstance(instance?: Instance, delayBeforeDestruction?: number) {
    const destroy = () => {
        if (instance) {
            instance.Destroy();
        }
    };
    if (delayBeforeDestruction) {
        task.delay(delayBeforeDestruction, destroy);
    }
    else {
        destroy();
    }
}