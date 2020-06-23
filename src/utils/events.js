import { createEventDispatcher } from 'svelte';

export const emitDone = () => {
    const dispatch = createEventDispatcher();
    dispatch('done');
};
export const emitBack = () => {
    dispatch('back');
};
